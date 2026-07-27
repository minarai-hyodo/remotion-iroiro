# Remotion Lambda レンダリングの仕組み

「Lambda関数をデプロイすれば動画がレンダリングできる」と思って読むと確実に混乱する。実際は **Lambda関数だけでは動画は1フレームも作れない**。ここが最初の詰まりどころなので、全体像を整理しておく。

## 全体像: 「汎用レンダラー」と「動画サイト」の2階建て

デプロイ時に作られるものは3つある。

```
┌──────────────────────────────────┐
│ Lambda関数（汎用レンダラー）          │  deployFunction()
│  Remotionレンダリングエンジン         │  ← 動画コードは入っていない
│  + ヘッドレスChrome                 │
└───────────────┬──────────────────┘
                │ serveUrl を開いて1フレームずつ撮影する
                ▼
┌──────────────────────────────────┐
│ サイト（S3上の静的サイト）            │  deploySite()
│  app/remotion/index.ts のバンドル    │  ← これがあなたの動画コード
│  + index.html                      │
└──────────────────────────────────┘

     どちらも同じS3バケットの上に乗る          getOrCreateBucket()
     （バケットはサイト置き場 兼 出力mp4の保存先）
```

- **`deployFunction()`** — AWSアカウントにLambda関数を作る。ただしこれは公式ドキュメントが "generic renderer" と明言している**汎用のレンダラー**で、ユーザーの動画コードは一切含まれない。中身はレンダリングエンジンとヘッドレスChromeだけ。同じバージョン・メモリ・タイムアウトの関数が既にあれば作り直さず再利用する（冪等）。
- **`getOrCreateBucket()`** — S3バケットを用意する。二役で、サイトの置き場所であり、かつレンダリング結果のmp4の出力先でもある。
- **`deploySite()`** — `app/remotion/index.ts` をエントリポイントに**動画コードをバンドルし、静的サイトとしてS3にアップロードする**。返り値の `serveUrl` は `https://remotionlambda-xxx.s3.../sites/xxxx/index.html` のようなURL。

## なぜ分離されているのか

Remotion Lambdaのレンダリングは、**ヘッドレスChromeで動画をWebページとして開き、1フレームずつスクリーンショットを撮って繋げる**という仕組み。

つまりLambda関数には「開くべきURL」が必要で、動画コードはブラウザが取りに行ける場所に置かれていなければならない。公式ドキュメントの言い方だと:

> the function itself only performs rendering—it needs a publicly accessible URL to open in a headless browser. Your project code must live somewhere the browser can fetch it.

動画コードをLambda関数の中に埋め込む設計にしなかったのは、それをやると動画を1行直すたびにLambda関数のデプロイをやり直す羽目になるから。分離しておけば、動画側の変更はS3にアップし直すだけで済む。

## レンダリング時に何が起きるか

`renderMediaOnLambda()` を呼んでから完成まで:

```
renderMediaOnLambda()
      │
      ▼
  main関数（1個）
   ├ serveUrl をヘッドレスChromeで開く
   ├ composition を特定し、props解決アルゴリズムを走らせる
   ├ 尺と concurrency から chunk に分割
   │
   ├──▶ renderer関数 × N（並列・最大200）
   │      各chunk分のフレームをレンダリング
   │      → Lambda Response Streaming で進捗とバイナリchunkを返す
   │
   ├ 進捗をまとめた progress.json を定期的にS3へアップロード
   │      ↑ getRenderProgress() が読んでいるのはこれ
   │
   └ 全chunk到着後に結合 → 最終mp4をS3へアップロードして終了
```

- **並列数の決まり方**: `concurrency = frameCount / framesPerLambda`。デフォルトでは `framesPerLambda` が動画の長さに応じて自動選択され、0〜10分（30fps）の範囲で並列数が75〜150に補間される。
- **上限・下限**: `framesPerLambda` の最小は5、並列数の最大は200。200を超える設定をするとエラーになる（"more would result in diminishing returns"）。基本はデフォルトに任せるのが推奨。
- **進捗はポーリング**: WebSocketではなく、S3上の `progress.json` をクライアントが定期的に読みに行く方式。

## このリポジトリでの対応関係

| ステップ | 実装 |
| --- | --- |
| Lambda関数のデプロイ | `react-router/infra/deploy-remotion.mjs` の `deployFunction()` |
| バケット確保 | 同ファイルの `getOrCreateBucket()` |
| サイトのデプロイ | 同ファイルの `deploySite()`（entryPoint: `app/remotion/index.ts`） |
| デプロイの自動実行 | `react-router/infra/remotion-lambda.ts` — `sst deploy` に統合。`app/remotion` のハッシュを取り、動画コードが変わったときだけ再実行する |
| Webサーバーへの権限付与 | 同ファイルの `remotionRenderInvokePermission()` → `sst.config.ts` の `sst.aws.React(..., { permissions })` |
| レンダリング依頼 | `app/render.tsx` → `app/lib/render-video.server.ts` の `renderMediaOnLambda()` |
| 進捗ポーリング | `app/progress.tsx` の `getRenderProgress()` ← `app/lib/use-rendering.ts` が1秒間隔で叩く |
| UI | `app/components/RenderIntroButton.tsx` |

設定値（RAM / DISK / TIMEOUT / REGION / SITE_NAME / COMPOSITION_ID）は `app/remotion/constants.mjs` から辿れる。うち Lambda関数のパラメータ（RAM / DISK / TIMEOUT / REGION と関数名の接頭辞）だけは `app/remotion/lambda-config.mjs` に実体があり、`constants.mjs` はそれを再エクスポートしている。分けてあるのは、`constants.mjs` が `SITE_NAME` のために `remotion` 本体を import しており、そのままだと sst.config.ts 側から読めないため。

## デプロイ後に誰がレンダーを呼ぶのか（IAM）

ローカル開発では `.env` のアクセスキーでレンダー関数を叩くが、**デプロイ後のWebサーバーはSSTが作ったIAMロールで動く**。ここが盲点で、ロールに何も足さないと Render video ボタンがこう落ちる:

```
User: arn:aws:sts::...:assumed-role/...RemotionIroiroWebServer...Role/... is not authorized to
perform: lambda:InvokeFunction on resource: arn:aws:lambda:us-east-1:...:function:remotion-render-...
```

`app/lib/render-video.server.ts` はアクセスキーの環境変数が無いとエラーを投げる作りだが、Lambda実行環境では `AWS_ACCESS_KEY_ID` などがロールの一時認証情報として**自動的に入っている**ので、このチェックは素通りする。その先のinvokeでロールの権限不足として弾かれる、という順番になる。

必要な権限は `lambda:InvokeFunction` **だけ**。`renderMediaOnLambda()` はもちろん、`getRenderProgress()` も（S3の `progress.json` を直接読むのではなく）レンダー関数を `status` 呼び出しでinvokeする実装なので、これ1つで進捗ポーリングまで通る。出来上がったmp4はpublicなS3 URLでブラウザが直接取りに行くため、Webサーバー側にS3権限は要らない。

```ts
// sst.config.ts
new sst.aws.React("RemotionIroiroWeb", {
  permissions: [remotionRenderInvokePermission()],
});
```

対象リソースは関数名そのものではなく `arn:aws:lambda:<region>:<account>:function:remotion-render-*` と前方一致で指定している。関数名にRemotionのバージョン・RAM・DISK・TIMEOUTが埋め込まれる（`speculateFunctionName()` が逆算しているのと同じ規則）ので、それらを変えるたびにIAMポリシー側も直す羽目になるのを避けるため。ワイルドカードは関数名部分だけに留め、アカウントIDは自アカウントに固定してある。

なお、レンダー関数**自身**のロール（S3の読み書きなど）は `deployFunction()` がRemotion側で用意するので、こちらで面倒を見る必要はない。

## 再デプロイのタイミング

| 変更内容 | `deployFunction` | `deploySite` |
| --- | --- | --- |
| 動画コードを変えた | 不要 | **必要** |
| Remotionをバージョンアップした | **必要** | **必要** |
| RAM / DISK / TIMEOUT を変えた | **必要** | 不要 |

`sst deploy` は両方まとめて実行するので、通常は意識せず流しておけばよい。

## 詰まりどころ

- **「プレビューでは直っているのにレンダリング結果が古い」**: 最頻出の罠。ローカルのStudio / `<Player>` は手元のコードを直接見るが、Lambdaが見るのは**S3上にデプロイ済みのサイト**。`deploySite()` を流し忘れると両者がズレる。このリポジトリでは `sst deploy` が `app/remotion` のハッシュ変化を検知して自動で流し直すので、この罠は踏みにくくしてある。
- **`functionName` を保存しなくていい**: `speculateFunctionName({ diskSizeInMb, memorySizeInMb, timeoutInSeconds })` でパラメータから関数名を逆算できる。Lambda関数が汎用品で、名前が設定値だけで決まるから成立する芸当。裏を返すと `constants.mjs` の RAM / DISK / TIMEOUT を変えたら、その値の関数を `deployFunction()` で作っておかないと存在しない関数を指すことになる。
- **`SITE_NAME` にRemotionのバージョンが埋め込まれている**（`"remotion-react-router-example-" + VERSION`）: レンダラーとサイトのRemotionバージョンが食い違うと壊れるため、バージョンごとに別サイトとして分離している。アップグレード時に両方デプロイし直す必要があるのはこのため。
- **`serveUrl` にはサイト「名」を渡してもよい**: `app/render.tsx` は `serveUrl: SITE_NAME` とサイト名を渡している。フルURLでなくてもRemotion側が解決してくれる。
- **各chunkが参照アセットを全部ダウンロードする**: "Each chunk will download all assets that are referenced in this chunk" なので、200並列なら同じ画像を最大200回取りに行くことになる。自前サーバーから配信していると負荷がかかるため、外部アセットはCDN推奨。`staticFile()` のアセットはサイトバンドルに含まれるのでS3から配信される。
- **AWS認証情報は `REMOTION_` プレフィックス必須ではない**: 解決順は `REMOTION_AWS_PROFILE` / `AWS_PROFILE` → `REMOTION_AWS_ACCESS_KEY_ID` / `SECRET` → `AWS_ACCESS_KEY_ID` / `SECRET`。プレフィックスは「同一プロセス内の他のAWS SDK利用と混ざらないように」という推奨であって必須ではない。IAMロールやEC2インスタンスメタデータに任せたい場合は `REMOTION_SKIP_AWS_CREDENTIALS_CHECK` でチェックを飛ばせる。

## 参考

- [How Lambda works](https://www.remotion.dev/docs/lambda/how-lambda-works)
- [deploySite()](https://www.remotion.dev/docs/lambda/deploysite) / [deployFunction()](https://www.remotion.dev/docs/lambda/deployfunction)
- [Concurrency](https://www.remotion.dev/docs/lambda/concurrency)
- [Authentication](https://www.remotion.dev/docs/lambda/authentication)

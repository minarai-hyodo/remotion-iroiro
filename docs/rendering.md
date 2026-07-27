# 書いたコードが mp4 になるまで

Remotionの実行系は「**再生**」と「**撮影**」の2種類しかない。この2つを混同したままだと、`useCurrentFrame()` がなぜ必要なのか、なぜ並列レンダリングが成立するのかが最後まで腑に落ちない。

| | 何をしているか | 使うもの |
| --- | --- | --- |
| 再生 | ブラウザが実時間でコンポーネントを描き続ける | `<Player>` / Remotion Studio |
| 撮影 | ヘッドレスChromeで開き、1フレームずつスクリーンショットを撮る | `npx remotion render` / Remotion Lambda |

## 撮影のパイプライン

```
npx remotion render RemotionIntro out/intro.mp4
   │
   ├ bundling     app/remotion/index.ts をバンドルして静的サイトにする
   ├ launching    ヘッドレスChromeを起動して、そのサイトを開く
   ├ composition  <Composition> を特定し、尺・解像度・fpsを確定させる
   ├ rendering    frame 0 → 1 → 2 … と送りながら1枚ずつスクリーンショット
   ├ encoding     集めた画像をh264にエンコード（FFmpegはRemotionに同梱）
   └ out/intro.mp4
```

Lambdaの場合もこの流れは同じで、「バンドルしたサイト」がS3に置かれ、Lambda関数がそれをブラウザで開くだけの違い。詳しくは [lambda-rendering.md](./lambda-rendering.md)。

## この仕組みから出てくる帰結

### 1. ブラウザが描けるものは、そのまま映像になる

レンダラーの表現力＝Chromeの表現力。CSS・SVG・Canvas・WebGL・Web Font・`<video>` が、追加の仕組みなしで動画に入る。DOMを組めれば映せる、というのがRemotionの表現力の上限であり下限。

### 2. 実時間では走っていない

1フレームずつ「座らせて」撮っているので、撮影と撮影の間に時間は流れない。つまり:

- CSS transition / animation、`setInterval`、`requestAnimationFrame` は**進まない**
- 時間は `useCurrentFrame()` から取るしかない
- 同じフレームなら常に同じ絵にならないといけない（`Math.random()` / `Date.now()` が禁止なのはこのため）

`useCurrentFrame()` は「Remotion流の書き方」ではなく、撮影モデルから逆算された唯一の選択肢だと考えるとよい。詳しくは [best-practices.md](./best-practices.md)。

### 3. フレームが独立しているから、並列に散らせる

1フレームは `frame` の純粋関数で、前のフレームの結果に依存しない。順番に作る必要がないので、時間軸を分割して同時に撮れる。

- **CLI**: 複数のブラウザタブに割り振る（`--concurrency`。デフォルトはマシンのCPUから自動決定）
- **Lambda**: chunkに分割してN個の関数へ。`concurrency = frameCount / framesPerLambda` で、尺に応じて75〜150並列が自動で選ばれる（上限200）

台数を増やせば、尺が伸びても書き出し時間をほぼ横ばいに保てる。ただし**各chunkは参照アセットを個別にダウンロードする**ので、200並列なら同じ画像を最大200回取りに行くことになる。外部アセットはCDNに置く。

## 紹介動画での扱い

`react-router/app/remotion/components/intro/` の3シーンがこの内容に対応している。

| シーン | 扱っている話 |
| --- | --- |
| `RenderPipelineScene` | 撮影のパイプラインと、そこから出てくる制約 |
| `ParallelRenderScene` | フレームの独立性と、Lambdaでのchunk分割 |
| `DeployScene` | 汎用レンダラーとサイトの2階建て、再デプロイの罠 |

## 参考

- [How Remotion works](https://www.remotion.dev/docs/the-fundamentals)
- [remotion render](https://www.remotion.dev/docs/cli/render)
- [Lambda: Concurrency](https://www.remotion.dev/docs/lambda/concurrency)

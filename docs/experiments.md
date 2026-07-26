# 検証メモ

技術検証中に得た、コードだけでは分かりにくい知見をここに記録する。

## RemotionIntro（`react-router/app/remotion/components/intro/`）

react-router雛形に、Remotion技術紹介プレゼン動画（約2分、`useCurrentFrame` / `interpolate` / `spring` / `Series` の実演）を追加した際の知見。

- **`<Player autoPlay>` だけでは再生が進まないことがある**: ブラウザのAutoplay/AudioContext制限に引っかかり、UIは再生中（Pauseアイコン）に見えてもフレームが0のまま止まることがある。既存の `home.tsx` と同様に `initiallyMuted` を付けると解消する。
- **`@remotion/transitions` の `TransitionSeries` は、トランジション分だけ合計尺が短くなる**: 合計フレーム数 = 各 `Series.Sequence` の `durationInFrames` の合計 − 各 `Transition` の `durationInFrames` の合計（隣接シーンの尺を「借りて」クロスフェードする仕組みのため）。
- **コードのシンタックスハイライトは、必ずしも `codehike` テンプレートの本格的なパイプラインを使う必要はない**: 固定の短いスニペットを数個表示するだけなら、`codehike` / `@code-hike/lighter` / `twoslash-cdn` のような重い依存を追加せず、トークンを手書きした自前コンポーネント（`tokens.ts` + `CodeBlock.tsx`）で十分。依存を絞れる分、レンダリング環境の安定性にも寄与する。
- **`@remotion/google-fonts` にはコーディング用フォントも揃っている**: `JetBrainsMono` など多数のGoogle Fonts製monospaceフォントをサブパス経由（`@remotion/google-fonts/JetBrainsMono`）でimportできる。
- **`react-router/` テンプレートには既存のpeer dependency不整合がある**: `react-router@7.18.0` と `@react-router/express` が要求する `react-router@7.12.0` がぶつかる。今回のパッケージ追加時にこの既存の不整合が表面化し、`npm install --legacy-peer-deps` が必要だった（この検証で作った不整合ではない）。

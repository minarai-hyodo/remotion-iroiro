# なぜ Sequence が必要なのか

「Sequenceを使わずに、丸ごと1本の動画をポンと作れないのか」という疑問への答え。

## 結論: 作れる。それでもSequenceを使う

Remotionは「フレーム番号を渡すと1枚の絵を返す関数」でしかないので、Sequenceなしでも動画は作れる。

```tsx
export const Video = () => {
  const frame = useCurrentFrame();
  if (frame < 150) return <TitleScene />;
  if (frame < 690) return <ConceptScene />;
  return <OutroScene />;
};
```

Sequenceは**必須の仕組みではなく、これを書きやすくするための道具**。何が「書きにくい」のかを理解するのがポイント。

## Sequenceの正体: `useCurrentFrame()` の返り値を書き換える装置

Remotionの唯一の情報源は `useCurrentFrame()`。そして **`<Sequence>` は、その子孫に対して「時間をずらして見せる」React Context**。

```tsx
// 動画全体の frame = 700 のとき
<Sequence from={690}>
  <ConceptScene />   {/* この中の useCurrentFrame() は 10 を返す */}
</Sequence>
```

これがSequenceの機能のほぼすべて。**シーンは「自分が動画のどこに置かれているか」を一切知らなくてよくなる。**

CSSの `position: relative` と同じ発想。親が座標の原点をずらしてくれるから、子は自分が画面のどこにあるか知らずに `top: 10px` と書ける。Sequenceはそれを時間軸でやっている。

## Sequenceがないと何が起きるか

`react-router/app/remotion/components/intro/FrameScene.tsx` のフェードイン/アウトはこう書かれている。

```tsx
const frame = useCurrentFrame();   // 0起点
const opacity = interpolate(frame, [0, 30, 120, 150], [0, 1, 1, 0]);
```

`<TransitionSeries.Sequence>` の中にいるおかげで `frame` が0から始まるからこう書ける。Sequenceなしで、動画の1350フレーム目から始まる位置に置いたら次のようになる。

```tsx
const opacity = interpolate(frame, [1350, 1380, 1470, 1500], [0, 1, 1, 0]);
```

**全シーン・全アニメーションのマジックナンバーに「そのシーンの開始位置」を足して回る**必要が出る。`RemotionIntro.tsx` の `SCENE_DURATIONS` は現在こうなっている。

```
title: 150, concept: 540, frame: 660, spring: 660,
sequence: 750, whySequence: 600, ecosystem: 660, outro: 240
```

ここで「concept を540→600フレームに伸ばしたい」と思った瞬間、以降6シーン分すべての `interpolate` の配列を +60 して回ることになる。1シーンに `interpolate` が5個あれば数十箇所の書き換えで、しかも1つでもミスると気付きにくいズレになる。

`Series` / `TransitionSeries` なら `durationInFrames` の数字を1つ変えるだけで済む。

## 「Sequenceの自作版」がコード内にある

`FrameScene.tsx` と `SequenceScene.tsx` のデモ部分には、こう書かれている。

```tsx
const frame = useCurrentFrame();
const local = frame % LOOP;   // ← ローカル時間を自前で作っている
```

デモをループさせるために「全体frame → ローカルframe」の変換を手で書いている。**これがまさにSequenceがやっていること**。1箇所なら手書きでいいが、シーン境界すべてでこれをやるのは現実的でない。

## 時間ずらし以外の、地味に重要な2つの効果

### 1. マウント/アンマウント制御

`if (frame < 150)` の分岐でも見た目は切り替わるが、Sequenceは**範囲外のとき子をDOMごと外す**ことを保証する。効いてくるのは次の場面。

- **`<Video>` / `<Audio>`** — Sequenceの外だと、まだ出番でない動画・音声が最初から鳴り続ける／メモリを食う。Sequence内なら `from` に応じて自動的にシークされ、正しい位置から再生される。
- **重いシーン**（Three.js、大量DOM）— 出番以外でレンダリングコストを払わない。
- `<Freeze>` や遅延読み込み系との組み合わせ。

つまりSequenceは**タイムライン上のライフサイクル境界**でもある。

### 2. トランジションの前提になっている

`RemotionIntro.tsx` の `TransitionSeries` は、**2シーンが一時的に同時に存在する**ことでクロスフェードを実現している。`if/else` の分岐だと「どちらか片方」しか描けないので、クロスフェードは原理的に書けない。

これは [experiments.md](./experiments.md) に記録した挙動の理由でもある。合計フレーム数が「各Sequenceの `durationInFrames` の合計 − 各Transitionの `durationInFrames` の合計」になるのは、隣接シーンの尺を「借りて」重ね合わせているため。`RemotionIntro.tsx` の `REMOTION_INTRO_DURATION` の計算式がそのまま対応している。

## 使い分け

| | 用途 |
| --- | --- |
| `<Sequence from={} durationInFrames={}>` | 開始位置を**明示的に**指定。BGM、透かし、字幕など「独立して重なるもの」向け |
| `<Series>` | シーンを**順番に並べる**。`from` は自動計算。切れ目のある連続再生 |
| `<TransitionSeries>` | Series + シーン間トランジション。`RemotionIntro` はこれ |

`<Sequence>` は重ね合わせもできる（同じ範囲を持つSequenceを複数置けば同時に表示される）ので、「連続」と「重畳」の両方を1つのプリミティブで表現できる。

## まとめ

- Sequenceなし = 全アニメーションが**絶対時刻**で書かれる → 1箇所直すと全部崩れる
- Sequenceあり = 各シーンが**相対時刻**で書ける → シーンが独立した部品になり、順番の入れ替え・尺の変更・使い回しが効く

「動画を1本の関数として書ける」のがRemotionの強みだが、**その関数を分割統治するための仕組みがSequence**、という位置づけ。

なお、この内容は紹介動画側にもシーンとして入れてある（`WhySequenceScene.tsx`）。

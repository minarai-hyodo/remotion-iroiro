import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Headline, SceneRoot } from "./SceneLayout";
import { COLORS, RADIUS } from "./theme";
import { fontFamily } from "./fonts";

const ITEMS = [
  {
    title: "Studio / Player",
    desc: "ブラウザでプレビューし、インタラクティブに確認する",
    color: COLORS.blue,
  },
  {
    title: "CLI Render",
    desc: "npx remotion render でmp4に書き出す",
    color: COLORS.mauve,
  },
  {
    title: "Lambda",
    desc: "クラウド上で並列レンダリングし、スケールさせる",
    color: COLORS.teal,
  },
];

const Card: React.FC<{ item: (typeof ITEMS)[number]; delay: number }> = ({ item, delay }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: COLORS.panel,
        borderRadius: RADIUS,
        padding: "38px 34px",
        opacity: progress,
        transform: `translateY(${(1 - progress) * 26}px)`,
        boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 6,
          borderRadius: 3,
          backgroundColor: item.color,
          marginBottom: 22,
        }}
      />
      <div style={{ fontFamily, fontWeight: 700, fontSize: 30, color: COLORS.text, marginBottom: 14 }}>
        {item.title}
      </div>
      <div style={{ fontFamily, fontSize: 20, color: COLORS.subtext, lineHeight: 1.6 }}>
        {item.desc}
      </div>
    </div>
  );
};

export const EcosystemScene: React.FC = () => {
  return (
    <SceneRoot>
      <Headline sub="同じコンポーネントを、目的に応じて実行方法だけ切り替える">
        書いたコードを、動かす・書き出す
      </Headline>
      <AbsoluteFill style={{ top: 240, justifyContent: "flex-start" }}>
        <div style={{ display: "flex", gap: 32, padding: "0 100px" }}>
          {ITEMS.map((item, i) => (
            <Card key={item.title} item={item} delay={20 + i * 15} />
          ))}
        </div>
      </AbsoluteFill>
    </SceneRoot>
  );
};

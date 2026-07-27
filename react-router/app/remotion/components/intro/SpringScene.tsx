import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CodeBlock } from "./CodeBlock";
import { Headline, PointList, SceneRoot, SplitPanel } from "./SceneLayout";
import { COLORS } from "./theme";
import { monoFontFamily } from "./fonts";
import { kw, pl, num, fn, type CodeLine } from "./tokens";

const lines: CodeLine[] = [
  [kw("const"), pl(" frame = "), fn("useCurrentFrame"), pl("();")],
  [kw("const"), pl(" { fps } = "), fn("useVideoConfig"), pl("();")],
  [],
  [pl("["), num("4"), pl(", "), num("12"), pl(", "), num("30"), pl("].map((damping) =>")],
  [pl("  "), fn("spring"), pl("({")],
  [pl("    frame,")],
  [pl("    fps,")],
  [pl("    config: { damping },")],
  [pl("  })")],
  [pl(");")],
];

const POINTS = [
  "dampingが小さいほど大きく跳ね返り、大きいほどピタッと止まる",
  "keyframeを手打ちしなくても、自然な減衰運動になる",
  "途中から再生してもズレない、frameベースの計算式",
];

const SETTLE = 120;
const CYCLE = SETTLE * 2;

const DAMPINGS = [4, 12, 30];

const SpringBall: React.FC<{ damping: number }> = ({ damping }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame % CYCLE;
  const local = t < SETTLE ? t : CYCLE - t;
  const scale = spring({
    frame: local,
    fps,
    config: { damping },
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 140,
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            backgroundColor: COLORS.mauve,
            transform: `scale(${scale})`,
          }}
        />
      </div>
      <div style={{ fontFamily: monoFontFamily, fontSize: 18, color: COLORS.subtext, textAlign: "center" }}>
        <div>damping: {damping}</div>
        <div>scale: {scale.toFixed(2)}</div>
      </div>
    </div>
  );
};

const SpringDemo: React.FC = () => (
  <div style={{ width: 460, display: "flex", justifyContent: "space-between" }}>
    {DAMPINGS.map((damping) => (
      <SpringBall key={damping} damping={damping} />
    ))}
  </div>
);

export const SpringScene: React.FC = () => {
  return (
    <SceneRoot>
      <Headline sub="バネの物理をパラメータで調整する">物理的な動きは spring() で</Headline>
      <SplitPanel
        left={
          <div>
            <CodeBlock lines={lines} />
            <PointList items={POINTS} />
          </div>
        }
        right={<SpringDemo />}
      />
    </SceneRoot>
  );
};

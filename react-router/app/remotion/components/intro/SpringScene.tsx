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
  [kw("const"), pl(" scale = "), fn("spring"), pl("({")],
  [pl("  frame,")],
  [pl("  fps,")],
  [pl("  config: { damping: "), num("12"), pl(" },")],
  [pl("});")],
];

const POINTS = [
  "dampingやmassの値で、硬さ・跳ね方を調整できる",
  "keyframeを手打ちしなくても、自然な減衰運動になる",
  "途中から再生してもズレない、frameベースの計算式",
];

const LOOP = 120;

const SpringDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame % LOOP;
  const scale = spring({
    frame: local,
    fps,
    config: { damping: 12 },
  });

  return (
    <div
      style={{
        width: 420,
        height: 260,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          backgroundColor: COLORS.mauve,
          transform: `scale(${scale})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          fontFamily: monoFontFamily,
          fontSize: 22,
          color: COLORS.subtext,
        }}
      >
        scale: {scale.toFixed(2)}
      </div>
    </div>
  );
};

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

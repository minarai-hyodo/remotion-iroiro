import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CodeBlock } from "./CodeBlock";
import { Headline, SceneRoot, SplitPanel } from "./SceneLayout";
import { COLORS } from "./theme";
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
        alignItems: "center",
        justifyContent: "center",
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
    </div>
  );
};

export const SpringScene: React.FC = () => {
  return (
    <SceneRoot>
      <Headline sub="バネの物理をパラメータで調整する">物理的な動きは spring() で</Headline>
      <SplitPanel left={<CodeBlock lines={lines} />} right={<SpringDemo />} />
    </SceneRoot>
  );
};

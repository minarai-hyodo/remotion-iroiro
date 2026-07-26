import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CodeBlock } from "./CodeBlock";
import { Headline, PointList, SceneRoot, SplitPanel } from "./SceneLayout";
import { COLORS } from "./theme";
import { monoFontFamily } from "./fonts";
import { kw, pl, num, fn, type CodeLine } from "./tokens";

const lines: CodeLine[] = [
  [kw("const"), pl(" frame = "), fn("useCurrentFrame"), pl("();")],
  [],
  [kw("const"), pl(" opacity = "), fn("interpolate"), pl("(")],
  [pl("  frame,")],
  [pl("  ["), num("0"), pl(", "), num("30"), pl("],")],
  [pl("  ["), num("0"), pl(", "), num("1"), pl("],")],
  [pl(");")],
];

const POINTS = [
  "state管理もランダム性もなく、frameの数だけで映像が決まる",
  "同じframeなら、何度再生しても同じ結果になる",
  "だから途中の一部分だけを並列に書き出すこともできる",
];

const LOOP = 150;

const FrameDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame % LOOP;
  const opacity = interpolate(local, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(local, [0, LOOP], [-140, 140], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: 420, height: 260, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: COLORS.panel,
          transform: "translateY(-1px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 90,
          height: 90,
          borderRadius: 20,
          backgroundColor: COLORS.blue,
          opacity,
          transform: `translate(${x - 45}px, -45px)`,
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
          display: "flex",
          gap: 20,
        }}
      >
        <span>frame: {local}</span>
        <span>opacity: {opacity.toFixed(2)}</span>
      </div>
    </div>
  );
};

export const FrameScene: React.FC = () => {
  return (
    <SceneRoot>
      <Headline sub="全てはuseCurrentFrame()から始まる">
        映像の正体は「フレームごとの静止画」
      </Headline>
      <SplitPanel
        left={
          <div>
            <CodeBlock lines={lines} />
            <PointList items={POINTS} />
          </div>
        }
        right={<FrameDemo />}
      />
    </SceneRoot>
  );
};

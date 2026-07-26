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
  [pl("  ["), num("0"), pl(", "), num("30"), pl(", "), num("120"), pl(", "), num("150"), pl("],")],
  [pl("  ["), num("0"), pl(", "), num("1"), pl(", "), num("1"), pl(", "), num("0"), pl("],")],
  [pl(");")],
];

const POINTS = [
  "state管理もランダム性もなく、frameの数だけで映像が決まる",
  "同じframeなら、何度再生しても同じ結果になる",
  "配列を伸ばせば、フェードイン→ホールド→フェードアウトも1本のinterpolateで書ける",
];

const FADE = 30;
const LOOP = 150;

const KeyframeTimeline: React.FC<{ local: number }> = ({ local }) => {
  const ticks = [0, FADE, LOOP - FADE, LOOP];

  return (
    <div style={{ width: 360, position: "relative", height: 10 }}>
      <div style={{ height: 2, backgroundColor: COLORS.panel, marginTop: 4 }} />
      {ticks.map((t) => (
        <div
          key={t}
          style={{
            position: "absolute",
            top: 0,
            left: `${(t / LOOP) * 100}%`,
            width: 2,
            height: 10,
            backgroundColor: COLORS.subtext,
            opacity: 0.5,
            transform: "translateX(-1px)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          top: -3,
          left: `${(local / LOOP) * 100}%`,
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: COLORS.blue,
          transform: "translateX(-5px)",
        }}
      />
    </div>
  );
};

const FrameDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame % LOOP;
  const opacity = interpolate(local, [0, FADE, LOOP - FADE, LOOP], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
        gap: 30,
        position: "relative",
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 20,
          backgroundColor: COLORS.blue,
          opacity,
        }}
      />
      <KeyframeTimeline local={local} />
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

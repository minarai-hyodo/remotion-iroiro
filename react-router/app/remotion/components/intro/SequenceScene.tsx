import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CodeBlock } from "./CodeBlock";
import { Headline, PointList, SceneRoot, SplitPanel } from "./SceneLayout";
import { COLORS } from "./theme";
import { fontFamily, monoFontFamily } from "./fonts";
import { pl, num, tag, type CodeLine } from "./tokens";

const lines: CodeLine[] = [
  [pl("<"), tag("Series"), pl(">")],
  [pl("  <"), tag("Series.Sequence"), pl(" durationInFrames={"), num("60"), pl("}>")],
  [pl("    <Intro />")],
  [pl("  </"), tag("Series.Sequence"), pl(">")],
  [pl("  <"), tag("Series.Sequence"), pl(" durationInFrames={"), num("90"), pl("}>")],
  [pl("    <Main />")],
  [pl("  </"), tag("Series.Sequence"), pl(">")],
  [pl("</"), tag("Series"), pl(">")],
];

const SEGMENTS = [
  { label: "Scene A", color: COLORS.blue, weight: 1, frames: 60 },
  { label: "Scene B", color: COLORS.mauve, weight: 1.4, frames: 90 },
  { label: "Scene C", color: COLORS.teal, weight: 1, frames: 60 },
];

const POINTS = [
  "durationInFramesで長さを指定するだけで、開始位置は自動計算される",
  "シーンを差し替えても、後続の位置は自動でずれる",
  "この動画自体も、7つのSequenceを並べて作られている",
];

const TOTAL_WEIGHT = SEGMENTS.reduce((a, s) => a + s.weight, 0);
const LOOP = 180;

const TimelineDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame % LOOP;
  const progress = local / LOOP;

  let acc = 0;
  let activeIndex = 0;
  let segmentLocalProgress = 0;
  for (let i = 0; i < SEGMENTS.length; i++) {
    const w = SEGMENTS[i].weight / TOTAL_WEIGHT;
    if (progress < acc + w) {
      activeIndex = i;
      segmentLocalProgress = (progress - acc) / w;
      break;
    }
    acc += w;
  }

  const activeOpacity = interpolate(segmentLocalProgress, [0, 0.15], [0.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: 460 }}>
      <div
        style={{
          fontFamily,
          fontSize: 40,
          fontWeight: 700,
          color: SEGMENTS[activeIndex].color,
          marginBottom: 28,
          textAlign: "center",
        }}
      >
        {SEGMENTS[activeIndex].label}
      </div>
      <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", gap: 4 }}>
        {SEGMENTS.map((s, i) => (
          <div
            key={s.label}
            style={{
              flex: s.weight,
              backgroundColor: s.color,
              opacity: i === activeIndex ? activeOpacity : 0.25,
              borderRadius: 6,
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {SEGMENTS.map((s) => (
          <div
            key={s.label}
            style={{
              flex: s.weight,
              fontFamily: monoFontFamily,
              fontSize: 16,
              color: COLORS.subtext,
              textAlign: "center",
            }}
          >
            {s.frames}f
          </div>
        ))}
      </div>
      <div style={{ position: "relative", height: 18, marginTop: 4 }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${progress * 100}%`,
            width: 3,
            height: 18,
            borderRadius: 2,
            backgroundColor: COLORS.text,
            transform: "translateX(-1.5px)",
          }}
        />
      </div>
    </div>
  );
};

export const SequenceScene: React.FC = () => {
  return (
    <SceneRoot>
      <Headline sub="このプレゼン自体も、Sequenceの積み重ねで作られている">
        時間軸は Sequence / Series で組み立てる
      </Headline>
      <SplitPanel
        left={
          <div>
            <CodeBlock lines={lines} fontSize={24} />
            <PointList items={POINTS} />
          </div>
        }
        right={<TimelineDemo />}
      />
    </SceneRoot>
  );
};

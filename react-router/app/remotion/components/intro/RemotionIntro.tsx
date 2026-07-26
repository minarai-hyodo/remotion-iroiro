import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Background } from "./Background";
import { COLORS } from "./theme";
import { TitleScene } from "./TitleScene";
import { ConceptScene } from "./ConceptScene";
import { FrameScene } from "./FrameScene";
import { SpringScene } from "./SpringScene";
import { SequenceScene } from "./SequenceScene";
import { EcosystemScene } from "./EcosystemScene";
import { OutroScene } from "./OutroScene";

const SCENE_DURATIONS = {
  title: 150,
  concept: 540,
  frame: 660,
  spring: 660,
  sequence: 750,
  ecosystem: 660,
  outro: 240,
};

const TRANSITION_DURATION = 20;
const SCENE_COUNT = Object.keys(SCENE_DURATIONS).length;

export const REMOTION_INTRO_DURATION =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  (SCENE_COUNT - 1) * TRANSITION_DURATION;

const transition = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
  />
);

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = Math.min(1, frame / durationInFrames);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end" }}>
      <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.08)" }}>
        <div
          style={{
            height: 4,
            width: `${progress * 100}%`,
            backgroundColor: COLORS.mauve,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const RemotionIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.title}>
          <TitleScene />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.concept}>
          <ConceptScene />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.frame}>
          <FrameScene />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.spring}>
          <SpringScene />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.sequence}>
          <SequenceScene />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.ecosystem}>
          <EcosystemScene />
        </TransitionSeries.Sequence>
        {transition()}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.outro}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <ProgressBar />
    </AbsoluteFill>
  );
};

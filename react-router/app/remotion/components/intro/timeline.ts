/**
 * シーンの尺の定義。RemotionIntroから切り出してあるのは、
 * シーン側（SequenceSceneなど）が「この動画は何シーンでできているか」を
 * 循環importなしに参照できるようにするため。
 */
export const SCENE_DURATIONS = {
  title: 150,
  concept: 540,
  frame: 660,
  spring: 660,
  sequence: 750,
  whySequence: 600,
  renderPipeline: 630,
  parallelRender: 660,
  deploy: 690,
  outro: 240,
};

export const TRANSITION_DURATION = 20;

export const SCENE_COUNT = Object.keys(SCENE_DURATIONS).length;

export const REMOTION_INTRO_DURATION =
  Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0) -
  (SCENE_COUNT - 1) * TRANSITION_DURATION;

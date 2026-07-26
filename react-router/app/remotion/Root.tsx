import { Composition } from "remotion";
import { COMPOSITION_FPS, COMPOSITION_HEIGHT, COMPOSITION_ID, COMPOSITION_WIDTH } from "./constants.mjs";
import { RemotionIntro, REMOTION_INTRO_DURATION } from "./components/intro/RemotionIntro";

export const RemotionRoot = () => {
  return (
    <Composition
      id={COMPOSITION_ID}
      component={RemotionIntro}
      durationInFrames={REMOTION_INTRO_DURATION}
      fps={COMPOSITION_FPS}
      width={COMPOSITION_WIDTH}
      height={COMPOSITION_HEIGHT}
    />
  );
};

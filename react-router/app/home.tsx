import { Player } from "@remotion/player";
import { COMPOSITION_FPS, COMPOSITION_HEIGHT, COMPOSITION_WIDTH } from "./remotion/constants.mjs";
import {
  RemotionIntro,
  REMOTION_INTRO_DURATION,
} from "./remotion/components/intro/RemotionIntro";
import "./app.css";

export default function Index() {
  return (
    <div style={{ padding: "48px 24px" }}>
      <div className="max-w-screen-md m-auto">
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)]">
          <Player
            component={RemotionIntro}
            durationInFrames={REMOTION_INTRO_DURATION}
            fps={COMPOSITION_FPS}
            compositionHeight={COMPOSITION_HEIGHT}
            compositionWidth={COMPOSITION_WIDTH}
            style={{ width: "100%" }}
            controls
            autoPlay
            loop
            initiallyMuted
          />
        </div>
      </div>
    </div>
  );
}

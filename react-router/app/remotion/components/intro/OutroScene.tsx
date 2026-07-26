import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./theme";
import { fontFamily } from "./fonts";
import { SceneRoot } from "./SceneLayout";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });
  const subOpacity = interpolate(frame, [16, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneRoot>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 92,
            color: COLORS.text,
            transform: `scale(${scale})`,
          }}
        >
          Remotion
        </div>
        <div
          style={{
            fontFamily,
            fontSize: 28,
            color: COLORS.subtext,
            marginTop: 18,
            opacity: subOpacity,
          }}
        >
          コードで、映像表現の可能性を探る。
        </div>
      </AbsoluteFill>
    </SceneRoot>
  );
};

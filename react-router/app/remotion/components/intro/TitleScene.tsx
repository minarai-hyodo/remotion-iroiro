import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./theme";
import { fontFamily } from "./fonts";
import { SceneRoot } from "./SceneLayout";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14 } });
  const subOpacity = interpolate(frame, [28, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [28, 52], [14, 0], {
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
            fontSize: 132,
            color: COLORS.text,
            transform: `scale(${scale})`,
          }}
        >
          Remotion
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 600,
            fontSize: 34,
            color: COLORS.subtext,
            marginTop: 18,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          Reactで動画を作る
        </div>
      </AbsoluteFill>
    </SceneRoot>
  );
};

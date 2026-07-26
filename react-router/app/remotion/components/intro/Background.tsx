import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS } from "./theme";

const Blob: React.FC<{
  color: string;
  size: number;
  baseX: number;
  baseY: number;
  driftFrames: number;
  driftAmount: number;
}> = ({ color, size, baseX, baseY, driftFrames, driftAmount }) => {
  const frame = useCurrentFrame();
  const t = (frame % driftFrames) / driftFrames;
  const dx = Math.sin(t * Math.PI * 2) * driftAmount;
  const dy = Math.cos(t * Math.PI * 2) * driftAmount;

  return (
    <div
      style={{
        position: "absolute",
        left: baseX + dx - size / 2,
        top: baseY + dy - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
      }}
    />
  );
};

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const gridOpacity = interpolate(frame, [0, 60], [0, 0.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, overflow: "hidden" }}>
      <Blob color={`${COLORS.mauve}26`} size={1100} baseX={420} baseY={260} driftFrames={900} driftAmount={80} />
      <Blob color={`${COLORS.blue}1f`} size={900} baseX={1500} baseY={820} driftFrames={780} driftAmount={70} />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: gridOpacity,
        }}
      />
    </AbsoluteFill>
  );
};

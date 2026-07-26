import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "./theme";
import { fontFamily } from "./fonts";

export const SceneRoot: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>{children}</AbsoluteFill>
);

export const Headline: React.FC<{ children: React.ReactNode; sub?: string }> = ({
  children,
  sub,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });
  const subOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ padding: "76px 100px 0" }}>
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 50,
          color: COLORS.text,
          opacity: entrance,
          transform: `translateY(${(1 - entrance) * 18}px)`,
        }}
      >
        {children}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily,
            fontSize: 25,
            color: COLORS.subtext,
            marginTop: 14,
            opacity: subOpacity,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

export const SplitPanel: React.FC<{
  left: React.ReactNode;
  right: React.ReactNode;
}> = ({ left, right }) => (
  <div
    style={{
      display: "flex",
      gap: 56,
      padding: "56px 100px 100px",
      flex: 1,
      alignItems: "center",
    }}
  >
    <div style={{ flex: 1.1 }}>{left}</div>
    <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>{right}</div>
  </div>
);

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

export const PointList: React.FC<{
  items: string[];
  startFrame?: number;
  stagger?: number;
}> = ({ items, startFrame = 44, stagger = 20 }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 30 }}>
      {items.map((text, i) => {
        const delay = startFrame + i * stagger;
        const progress = interpolate(frame, [delay, delay + 16], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              opacity: progress,
              transform: `translateX(${(1 - progress) * -14}px)`,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: COLORS.mauve,
                marginTop: 10,
                flexShrink: 0,
              }}
            />
            <div style={{ fontFamily, fontSize: 22, color: COLORS.subtext, lineHeight: 1.55 }}>
              {text}
            </div>
          </div>
        );
      })}
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

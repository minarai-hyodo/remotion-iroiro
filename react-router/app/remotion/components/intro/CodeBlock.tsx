import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, RADIUS } from "./theme";
import { monoFontFamily } from "./fonts";
import type { CodeLine } from "./tokens";

export const CodeBlock: React.FC<{
  lines: CodeLine[];
  fontSize?: number;
  delay?: number;
}> = ({ lines, fontSize = 27, delay = 15 }) => {
  const frame = useCurrentFrame();
  const lineNumberWidth = String(lines.length).length * 0.62 + 1.4;

  return (
    <div
      style={{
        backgroundColor: COLORS.codeBackground,
        borderRadius: RADIUS,
        padding: "26px 30px",
        boxShadow: "0 40px 80px rgba(0,0,0,0.45)",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[COLORS.red, COLORS.yellow, COLORS.green].map((c) => (
          <div
            key={c}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: c,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
      <div style={{ fontFamily: monoFontFamily, fontSize, lineHeight: 1.65 }}>
        {lines.map((line, i) => {
          const lineDelay = delay + i * 5;
          const progress = interpolate(
            frame,
            [lineDelay, lineDelay + 14],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return (
            <div
              key={i}
              style={{
                display: "flex",
                opacity: progress,
                transform: `translateX(${(1 - progress) * -18}px)`,
                whiteSpace: "pre",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: `${lineNumberWidth}em`,
                  color: COLORS.subtext,
                  opacity: 0.45,
                  userSelect: "none",
                }}
              >
                {i + 1}
              </span>
              <span>
                {line.length === 0
                  ? " "
                  : line.map((tok, j) => (
                      <span key={j} style={{ color: tok.c ?? COLORS.text }}>
                        {tok.text}
                      </span>
                    ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

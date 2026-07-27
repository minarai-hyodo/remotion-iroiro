import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, RADIUS } from "./theme";
import { monoFontFamily } from "./fonts";
import type { CodeLine } from "./tokens";

export const CodeBlock: React.FC<{
  lines: CodeLine[];
  fontSize?: number;
  delay?: number;
  /** 行ごとの表示ディレイの間隔。0にすると全行同時に出る */
  stagger?: number;
  /** ターミナル出力を見せたいときなど、行番号を消したい場合はfalse */
  lineNumbers?: boolean;
  /** 行ごとに表示タイミングを指定したい場合（delay/staggerより優先） */
  lineDelays?: number[];
}> = ({
  lines,
  fontSize = 27,
  delay = 15,
  stagger = 5,
  lineNumbers = true,
  lineDelays,
}) => {
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
          const lineDelay = lineDelays?.[i] ?? delay + i * stagger;
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
              {lineNumbers ? (
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
              ) : null}
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

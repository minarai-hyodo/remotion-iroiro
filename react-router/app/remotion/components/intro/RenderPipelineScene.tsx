import React from "react";
import { interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { CodeBlock } from "./CodeBlock";
import { Headline, SceneRoot } from "./SceneLayout";
import { COLORS, RADIUS } from "./theme";
import { fontFamily, monoFontFamily } from "./fonts";
import { cm, num, pl, str, type CodeLine } from "./tokens";

/** 撮影対象に見立てた合成の尺。ConceptSceneで出した durationInFrames={150} と揃えてある */
const TOTAL_FRAMES = 150;
const CAPTURE_COUNT = 8;
const CAPTURE_EVERY = 30;
const CAPTURE_START = 96;
const CAPTURE_END = CAPTURE_START + CAPTURE_COUNT * CAPTURE_EVERY;
const ENCODE_AT = CAPTURE_END + 14;
const DONE_AT = ENCODE_AT + 42;
const NOTE_AT = DONE_AT + 40;

/** i枚目のスクリーンショットが撮る合成側のフレーム */
const capturedFrame = (i: number) => Math.round((i * TOTAL_FRAMES) / CAPTURE_COUNT);

/**
 * 撮影されている側の中身。frameだけから位置と色が決まる純粋関数として書いてあり、
 * ブラウザ内のプレビューとフィルムストリップのサムネイルは、同じ関数に違うframeを渡しているだけ。
 */
const MiniScene: React.FC<{ f: number; height: number }> = ({ f, height }) => {
  const t = f / TOTAL_FRAMES;
  const size = height * 0.34;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: COLORS.background,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `${8 + t * 76}%`,
          width: size,
          height: size,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: interpolateColors(t, [0, 1], [COLORS.blue, COLORS.pink]),
        }}
      />
    </div>
  );
};

const UrlBar: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
    {[COLORS.red, COLORS.yellow, COLORS.green].map((c) => (
      <div
        key={c}
        style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: c, opacity: 0.7 }}
      />
    ))}
    <div
      style={{
        flex: 1,
        marginLeft: 8,
        padding: "7px 14px",
        borderRadius: 999,
        backgroundColor: COLORS.background,
        fontFamily: monoFontFamily,
        fontSize: 16,
        color: COLORS.subtext,
      }}
    >
      http://localhost:3000/index.html
    </div>
    <div
      style={{
        fontFamily: monoFontFamily,
        fontSize: 15,
        color: COLORS.subtext,
        border: `1px solid ${COLORS.panelAlt}`,
        borderRadius: 8,
        padding: "5px 10px",
      }}
    >
      headless
    </div>
  </div>
);

const BrowserMock: React.FC<{ shownFrame: number; flash: number }> = ({ shownFrame, flash }) => (
  <div
    style={{
      backgroundColor: COLORS.panel,
      borderRadius: RADIUS,
      padding: "18px 20px",
      boxShadow: "0 40px 80px rgba(0,0,0,0.45)",
    }}
  >
    <UrlBar />
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 10,
        overflow: "hidden",
        border: `2px solid ${interpolateColors(flash, [0, 1], [COLORS.panelAlt, COLORS.yellow])}`,
      }}
    >
      <MiniScene f={shownFrame} height={330} />
      <div style={{ position: "absolute", inset: 0, backgroundColor: `rgba(255,255,255,${flash * 0.38})` }} />
      <div
        style={{
          position: "absolute",
          right: 14,
          top: 14,
          padding: "6px 12px",
          borderRadius: 8,
          backgroundColor: "rgba(17,17,27,0.85)",
          fontFamily: monoFontFamily,
          fontSize: 20,
          color: COLORS.text,
        }}
      >
        frame {shownFrame} / {TOTAL_FRAMES}
      </div>
    </div>
  </div>
);

const FilmStrip: React.FC<{ captured: number }> = ({ captured }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", gap: 9, marginTop: 20 }}>
      {Array.from({ length: CAPTURE_COUNT }, (_, i) => {
        const landAt = CAPTURE_START + i * CAPTURE_EVERY + 14;
        const progress = interpolate(frame, [landAt, landAt + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const has = i < captured;

        return (
          <div key={i} style={{ flex: 1 }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: 6,
                overflow: "hidden",
                backgroundColor: COLORS.codeBackground,
                border: has ? `1px solid ${COLORS.panelAlt}` : `1px dashed ${COLORS.panelAlt}`,
                opacity: has ? 1 : 0.4,
                transform: `scale(${0.8 + progress * 0.2})`,
              }}
            >
              {has ? <MiniScene f={capturedFrame(i)} height={54} /> : null}
            </div>
            <div
              style={{
                fontFamily: monoFontFamily,
                fontSize: 14,
                color: COLORS.subtext,
                textAlign: "center",
                marginTop: 5,
                opacity: has ? 0.9 : 0.35,
              }}
            >
              f{capturedFrame(i)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Chip: React.FC<{ label: string; color: string; visible: number }> = ({
  label,
  color,
  visible,
}) => (
  <div
    style={{
      padding: "8px 16px",
      borderRadius: 999,
      backgroundColor: COLORS.panel,
      border: `1px solid ${color}`,
      fontFamily: monoFontFamily,
      fontSize: 18,
      color,
      opacity: visible,
      transform: `translateY(${(1 - visible) * 8}px)`,
    }}
  >
    {label}
  </div>
);

const Note: React.FC<{
  mark: string;
  color: string;
  title: string;
  body: string;
  delay: number;
}> = ({ mark, color, title, body, delay }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: "16px 20px",
        borderRadius: 14,
        backgroundColor: COLORS.panel,
        borderLeft: `4px solid ${color}`,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 12}px)`,
      }}
    >
      <div style={{ fontFamily, fontSize: 22, color, flexShrink: 0 }}>{mark}</div>
      <div>
        <div style={{ fontFamily, fontWeight: 700, fontSize: 22, color: COLORS.text }}>{title}</div>
        <div style={{ fontFamily, fontSize: 19, color: COLORS.subtext, lineHeight: 1.5, marginTop: 6 }}>
          {body}
        </div>
      </div>
    </div>
  );
};

export const RenderPipelineScene: React.FC = () => {
  const frame = useCurrentFrame();

  // 何枚撮り終えたか / いま何フレーム目を開いているか
  const captured = Math.min(
    CAPTURE_COUNT,
    Math.max(0, Math.floor((frame - CAPTURE_START - 14) / CAPTURE_EVERY) + 1),
  );
  const cursor = Math.min(
    CAPTURE_COUNT - 1,
    Math.max(0, Math.floor((frame - CAPTURE_START) / CAPTURE_EVERY)),
  );
  const shownFrame = frame < CAPTURE_START ? 0 : capturedFrame(cursor);

  // 撮影の瞬間だけシャッターを光らせる
  const cycleLocal = frame - (CAPTURE_START + cursor * CAPTURE_EVERY);
  const flash =
    frame >= CAPTURE_START && frame < CAPTURE_END
      ? interpolate(cycleLocal, [8, 11, 20], [0, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  const chipVisible = (delay: number) =>
    interpolate(frame, [delay, delay + 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const lines: CodeLine[] = [
    [{ text: "$", c: COLORS.green }, pl(" npx remotion render "), str("RemotionIntro"), pl(" out/intro.mp4")],
    [],
    [{ text: "◐", c: COLORS.blue }, pl(" bundling    "), cm("app/remotion/index.ts")],
    [{ text: "◐", c: COLORS.blue }, pl(" launching   "), cm("headless Chrome")],
    [{ text: "◐", c: COLORS.blue }, pl(" composition "), cm("1920x1080 / 30fps / 150 frames")],
    [
      { text: "◐", c: COLORS.blue },
      pl(" rendering   "),
      num(`frame ${shownFrame}/${TOTAL_FRAMES}`),
      cm("  ← 1枚ずつスクリーンショット"),
    ],
    [{ text: "◐", c: COLORS.blue }, pl(" encoding    "), cm("h264 (ffmpeg同梱)")],
    [{ text: "✔", c: COLORS.green }, pl(" out/intro.mp4")],
  ];

  const lineDelays = [10, 10, 30, 52, 72, CAPTURE_START - 8, ENCODE_AT, DONE_AT];

  return (
    <SceneRoot>
      <Headline sub="プレビューの<Player>は実時間で「再生」する。書き出しは、ブラウザで開いて1フレームずつ「撮影」する">
        書き出しの正体は「連続スクリーンショット」
      </Headline>
      <div style={{ flex: 1, display: "flex", gap: 40, padding: "26px 100px 50px" }}>
        <div style={{ flex: 1.02, display: "flex", flexDirection: "column", gap: 18 }}>
          <CodeBlock
            lines={lines}
            fontSize={20}
            lineNumbers={false}
            lineDelays={lineDelays}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {["CSS", "SVG", "Canvas", "WebGL", "Web Font", "<video>"].map((label, i) => (
              <Chip
                key={label}
                label={label}
                color={COLORS.teal}
                visible={chipVisible(NOTE_AT + 4 + i * 5)}
              />
            ))}
          </div>
          <Note
            mark="✔"
            color={COLORS.green}
            title="ブラウザが描けるものは、そのまま映像になる"
            body="レンダラーの表現力＝Chromeの表現力。新しいCSSもWebGLも、追加の仕組みなしで動画に入る。"
            delay={NOTE_AT}
          />
          <Note
            mark="!"
            color={COLORS.peach}
            title="ただし、実時間では走っていない"
            body="1フレームずつ「座らせて」撮るので、CSS transitionやsetIntervalは進まない。だから時間はuseCurrentFrame()から取る。"
            delay={NOTE_AT + 46}
          />
        </div>
        <div style={{ flex: 1 }}>
          <BrowserMock shownFrame={shownFrame} flash={flash} />
          <FilmStrip captured={captured} />
          <div
            style={{
              fontFamily,
              fontSize: 17,
              color: COLORS.subtext,
              textAlign: "center",
              marginTop: 10,
              opacity: 0.75,
            }}
          >
            ※ 実際は150枚。ここでは間引いて8枚だけ並べている
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginTop: 26,
              fontFamily: monoFontFamily,
              fontSize: 21,
              color: COLORS.subtext,
              opacity: chipVisible(ENCODE_AT),
            }}
          >
            <span>{TOTAL_FRAMES} フレーム分の画像</span>
            <span style={{ color: COLORS.mauve }}>→</span>
            <span>h264</span>
            <span style={{ color: COLORS.mauve }}>→</span>
            <span
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                backgroundColor: COLORS.panel,
                border: `2px solid ${COLORS.green}`,
                color: COLORS.text,
                opacity: chipVisible(DONE_AT),
              }}
            >
              intro.mp4
            </span>
          </div>
        </div>
      </div>
    </SceneRoot>
  );
};

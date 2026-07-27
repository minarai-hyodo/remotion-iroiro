import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CodeBlock } from "./CodeBlock";
import { Headline, SceneRoot } from "./SceneLayout";
import { COLORS } from "./theme";
import { fontFamily, monoFontFamily } from "./fonts";
import { cm, fn, kw, pl, str, type CodeLine } from "./tokens";

/** 5分 / 30fps の動画を書き出す、という設定の図 */
const TOTAL = 9000;
const LANES = 6;
const CHUNK = TOTAL / LANES;

const SEQ_START = 24;
const SEQ_END = 564;
const SPLIT_AT = 170;
const PAR_START = 210;
const PAR_END = 300;
const RESULT_AT = 316;
const BADGE_AT = 348;

const lines: CodeLine[] = [
  [cm("// app/lib/render-video.server.ts")],
  [kw("const"), pl(" { renderId, bucketName } = "), kw("await"), pl(" "), fn("renderMediaOnLambda"), pl("({")],
  [pl("  region: REGION,")],
  [pl("  functionName: "), fn("speculateFunctionName"), pl("({")],
  [pl("    diskSizeInMb: DISK, memorySizeInMb: RAM,")],
  [pl("    timeoutInSeconds: TIMEOUT,")],
  [pl("  }),")],
  [pl("  serveUrl: SITE_NAME,")],
  [pl("  composition: "), str('"RemotionIntro"'), pl(",")],
  [pl("  codec: "), str('"h264"'), pl(",")],
  [pl("});")],
  [],
  [cm("// app/lib/use-rendering.ts — 1秒おきに進捗を読む")],
  [kw("const"), pl(" p = "), kw("await"), pl(" "), fn("getRenderProgress"), pl("({ renderId, bucketName });")],
  [pl("p.overallProgress "), cm("// 0 → 1")],
];

const Bar: React.FC<{
  progress: number;
  color: string;
  height: number;
  dim?: boolean;
}> = ({ progress, color, height, dim }) => (
  <div
    style={{
      flex: 1,
      height,
      borderRadius: height / 2,
      backgroundColor: COLORS.panelAlt,
      overflow: "hidden",
      opacity: dim ? 0.85 : 1,
    }}
  >
    <div style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: color }} />
  </div>
);

const Lane: React.FC<{ index: number; progress: number; visible: number }> = ({
  index,
  progress,
  visible,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      opacity: visible,
      transform: `translateX(${(1 - visible) * 18}px)`,
    }}
  >
    <div style={{ fontFamily: monoFontFamily, fontSize: 16, color: COLORS.subtext, width: 150 }}>
      λ{index + 1} {index * CHUNK}–{(index + 1) * CHUNK - 1}
    </div>
    <Bar progress={progress} color={COLORS.teal} height={18} />
    <div
      style={{
        fontFamily: monoFontFamily,
        fontSize: 16,
        color: progress >= 1 ? COLORS.green : COLORS.subtext,
        width: 42,
        textAlign: "right",
      }}
    >
      {progress >= 1 ? "done" : `${Math.round(progress * 100)}%`}
    </div>
  </div>
);

const Badge: React.FC<{ text: string; accent: string; delay: number }> = ({
  text,
  accent,
  delay,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 18px",
        borderRadius: 12,
        backgroundColor: COLORS.panel,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 12}px)`,
      }}
    >
      <div
        style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: accent, flexShrink: 0 }}
      />
      <div style={{ fontFamily, fontSize: 19, color: COLORS.subtext, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
};

const Takeaway: React.FC<{ mark: string; color: string; text: string; delay: number }> = ({
  mark,
  color,
  text,
  delay,
}) => {
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
        padding: "15px 20px",
        borderRadius: 14,
        backgroundColor: COLORS.panel,
        borderLeft: `4px solid ${color}`,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 12}px)`,
      }}
    >
      <div style={{ fontFamily, fontSize: 21, color, flexShrink: 0 }}>{mark}</div>
      <div style={{ fontFamily, fontSize: 19, color: COLORS.subtext, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
};

export const ParallelRenderScene: React.FC = () => {
  const frame = useCurrentFrame();

  const seqProgress = interpolate(frame, [SEQ_START, SEQ_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const parProgress = interpolate(frame, [PAR_START, PAR_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const splitNote = interpolate(frame, [SPLIT_AT, SPLIT_AT + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const resultVisible = interpolate(frame, [RESULT_AT, RESULT_AT + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneRoot>
      <Headline sub="1フレームは frame の純粋関数。前のフレームの結果に依存しないから、順番に作る必要がない">
        フレームが独立しているから、並列に散らせる
      </Headline>
      <div style={{ flex: 1, display: "flex", gap: 40, padding: "26px 100px 50px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <CodeBlock lines={lines} fontSize={19} delay={10} stagger={4} />
          <Takeaway
            mark="✔"
            color={COLORS.green}
            text="台数を増やせば、尺が伸びても書き出し時間はほぼ横ばいにできる"
            delay={PAR_END + 20}
          />
          <Takeaway
            mark="!"
            color={COLORS.peach}
            text="ただし各chunkは参照アセットを個別にダウンロードする。200並列なら同じ画像を最大200回取りに行くので、外部アセットはCDNへ"
            delay={PAR_END + 56}
          />
        </div>
        <div style={{ flex: 1.05, display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily, fontSize: 20, color: COLORS.subtext, marginBottom: 16 }}>
            5分の動画 = {TOTAL.toLocaleString("en-US")} フレームを書き出す（図は{LANES}並列）
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontFamily: monoFontFamily, fontSize: 16, color: COLORS.subtext, width: 150 }}>
              1台で順番に
            </div>
            <Bar progress={seqProgress} color={COLORS.peach} height={18} dim />
            <div
              style={{
                fontFamily: monoFontFamily,
                fontSize: 16,
                color: seqProgress >= 1 ? COLORS.green : COLORS.peach,
                width: 42,
                textAlign: "right",
              }}
            >
              {seqProgress >= 1 ? "done" : `${Math.round(seqProgress * 100)}%`}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "22px 0 18px",
              opacity: splitNote,
            }}
          >
            <div style={{ fontFamily, fontSize: 21, color: COLORS.mauve, fontWeight: 700 }}>
              ↓ 時間軸をchunkに切って、同時に投げる
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {Array.from({ length: LANES }, (_, i) => (
              <Lane
                key={i}
                index={i}
                progress={parProgress}
                visible={interpolate(frame, [PAR_START - 16 + i * 3, PAR_START + i * 3], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 20,
              opacity: resultVisible,
            }}
          >
            <div style={{ fontFamily: monoFontFamily, fontSize: 19, color: COLORS.subtext }}>
              chunkを結合 →
            </div>
            <div
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                backgroundColor: COLORS.panel,
                border: `2px solid ${COLORS.green}`,
                fontFamily: monoFontFamily,
                fontSize: 19,
                color: COLORS.text,
              }}
            >
              S3 に out.mp4
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
            <Badge
              accent={COLORS.mauve}
              text="concurrency = frameCount / framesPerLambda。尺に応じて75〜150並列が自動で選ばれ、上限は200"
              delay={BADGE_AT}
            />
            <Badge
              accent={COLORS.blue}
              text="どのchunkから終わってもいい。順序に依存しないので、遅い1台が全体を止めない"
              delay={BADGE_AT + 34}
            />
            <Badge
              accent={COLORS.teal}
              text="進捗はWebSocketではなく、S3上のprogress.jsonをクライアントがポーリングして読む"
              delay={BADGE_AT + 68}
            />
          </div>
        </div>
      </div>
    </SceneRoot>
  );
};

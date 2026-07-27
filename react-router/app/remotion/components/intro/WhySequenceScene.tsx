import React from "react";
import { interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { CodeBlock } from "./CodeBlock";
import { Headline, SceneRoot } from "./SceneLayout";
import { COLORS, RADIUS } from "./theme";
import { fontFamily, monoFontFamily } from "./fonts";
import { cm, fn, kw, num, pl, type CodeLine } from "./tokens";

const LOOP = 300;
const ASK_AT = 100;
const EDIT_AT = 150;
const COST_AT = 168;

/** 前のシーンを +60 フレーム伸ばしたときの、絶対フレーム指定側のズレ量 */
const SHIFT = 60;

const absoluteLines = (shift: number, numColor: string): CodeLine[] => {
  const n = (v: number) => ({ text: String(v + shift), c: numColor });

  return [
    [cm(`// FrameScene は ${1350 + shift}f から始まる`)],
    [kw("const"), pl(" frame = "), fn("useCurrentFrame"), pl("();")],
    [],
    [kw("const"), pl(" opacity = "), fn("interpolate"), pl("(frame,")],
    [pl("  ["), n(1350), pl(", "), n(1380), pl(", "), n(1470), pl(", "), n(1500), pl("],")],
    [pl("  ["), num("0"), pl(", "), num("1"), pl(", "), num("1"), pl(", "), num("0"), pl("]);")],
    [],
    [kw("const"), pl(" x = "), fn("interpolate"), pl("(frame,")],
    [pl("  ["), n(1350), pl(", "), n(1500), pl("], ["), num("-140"), pl(", "), num("140"), pl("]);")],
  ];
};

const localLines: CodeLine[] = [
  [cm("// FrameScene は自分の位置を知らない")],
  [kw("const"), pl(" frame = "), fn("useCurrentFrame"), pl("();")],
  [],
  [kw("const"), pl(" opacity = "), fn("interpolate"), pl("(frame,")],
  [pl("  ["), num("0"), pl(", "), num("30"), pl(", "), num("120"), pl(", "), num("150"), pl("],")],
  [pl("  ["), num("0"), pl(", "), num("1"), pl(", "), num("1"), pl(", "), num("0"), pl("]);")],
  [],
  [kw("const"), pl(" x = "), fn("interpolate"), pl("(frame,")],
  [pl("  ["), num("0"), pl(", "), num("150"), pl("], ["), num("-140"), pl(", "), num("140"), pl("]);")],
];

const CHIPS = [
  {
    title: "原点をずらす",
    desc: "子のuseCurrentFrame()が0起点になる",
    color: COLORS.blue,
  },
  {
    title: "範囲外はアンマウント",
    desc: "出番前のVideo・Audioが鳴り出さない",
    color: COLORS.mauve,
  },
  {
    title: "重ねられる",
    desc: "2シーンが同時に存在するからクロスフェードが成立する",
    color: COLORS.teal,
  },
];

const ColumnLabel: React.FC<{ text: string; color: string; delay: number }> = ({
  text,
  color,
  delay,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
        opacity: progress,
      }}
    >
      <div style={{ width: 34, height: 5, borderRadius: 3, backgroundColor: color }} />
      <div style={{ fontFamily, fontWeight: 700, fontSize: 25, color }}>{text}</div>
    </div>
  );
};

const CostBadge: React.FC<{ text: string; color: string; visible: number }> = ({
  text,
  color,
  visible,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginTop: 16,
      padding: "14px 20px",
      borderRadius: 12,
      backgroundColor: COLORS.panel,
      border: `2px solid ${color}`,
      opacity: visible,
      transform: `translateY(${(1 - visible) * 12}px)`,
    }}
  >
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
    <div style={{ fontFamily, fontSize: 21, color: COLORS.text }}>{text}</div>
  </div>
);

const EditBanner: React.FC<{ opacity: number; edited: boolean }> = ({ opacity, edited }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      marginTop: 26,
      padding: "16px 26px",
      borderRadius: RADIUS,
      backgroundColor: COLORS.panelAlt,
      opacity,
    }}
  >
    <div style={{ fontFamily, fontSize: 23, color: COLORS.subtext }}>
      前のシーンの尺を伸ばしたい:
    </div>
    <div style={{ fontFamily: monoFontFamily, fontSize: 23, color: COLORS.text }}>
      durationInFrames=
      <span style={{ color: edited ? COLORS.subtext : COLORS.peach }}>{"{540}"}</span>
      <span style={{ color: COLORS.subtext }}> → </span>
      <span style={{ color: edited ? COLORS.green : COLORS.subtext }}>{"{600}"}</span>
    </div>
  </div>
);

const Chip: React.FC<{ chip: (typeof CHIPS)[number]; delay: number }> = ({ chip, delay }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        flex: 1,
        padding: "18px 22px",
        borderRadius: 14,
        backgroundColor: COLORS.panel,
        opacity: progress,
        transform: `translateY(${(1 - progress) * 16}px)`,
      }}
    >
      <div
        style={{
          fontFamily,
          fontWeight: 700,
          fontSize: 22,
          color: chip.color,
          marginBottom: 8,
        }}
      >
        {chip.title}
      </div>
      <div style={{ fontFamily, fontSize: 19, color: COLORS.subtext, lineHeight: 1.5 }}>
        {chip.desc}
      </div>
    </div>
  );
};

export const WhySequenceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame % LOOP;
  const edited = local >= EDIT_AT;

  // 編集の瞬間、書き換えが必要な数値を赤くフラッシュさせる
  const numColor = edited
    ? interpolateColors(
        interpolate(local, [EDIT_AT, EDIT_AT + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        [0, 1],
        [COLORS.yellow, COLORS.red],
      )
    : COLORS.peach;

  const bannerOpacity = interpolate(local, [ASK_AT, ASK_AT + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const costOpacity = interpolate(local, [COST_AT, COST_AT + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneRoot>
      <Headline sub="if文でも動画は作れる。それでもSequenceを使う理由">
        Sequenceは「時間のローカル座標系」
      </Headline>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "30px 100px 56px",
        }}
      >
        <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <ColumnLabel text="Sequenceなし（絶対フレーム）" color={COLORS.red} delay={6} />
            <CodeBlock
              lines={absoluteLines(edited ? SHIFT : 0, numColor)}
              fontSize={21}
              delay={12}
            />
            <CostBadge
              text="以降のシーン全部の数値を書き換え"
              color={COLORS.red}
              visible={costOpacity}
            />
          </div>
          <div style={{ flex: 1 }}>
            <ColumnLabel text="Sequenceあり（0起点）" color={COLORS.green} delay={16} />
            <CodeBlock lines={localLines} fontSize={21} delay={22} />
            <CostBadge text="シーンのコードは無変更" color={COLORS.green} visible={costOpacity} />
          </div>
        </div>
        <EditBanner opacity={bannerOpacity} edited={edited} />
        <div style={{ display: "flex", gap: 24, marginTop: 26 }}>
          {CHIPS.map((chip, i) => (
            <Chip key={chip.title} chip={chip} delay={210 + i * 14} />
          ))}
        </div>
      </div>
    </SceneRoot>
  );
};

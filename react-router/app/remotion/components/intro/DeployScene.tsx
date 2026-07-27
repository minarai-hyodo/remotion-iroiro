import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Headline, SceneRoot } from "./SceneLayout";
import { COLORS, RADIUS } from "./theme";
import { fontFamily, monoFontFamily } from "./fonts";

const FUNCTION_AT = 10;
const ARROW_AT = 96;
const SITE_AT = 132;
const BUCKET_AT = 206;
const WHY_AT = 250;
const TABLE_AT = 320;
const TRAP_AT = 436;
const FOOT_AT = 500;
const SPECULATE_AT = 552;

const useReveal = (delay: number, duration = 16) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

const DeployBox: React.FC<{
  call: string;
  color: string;
  title: string;
  items: string[];
  delay: number;
}> = ({ call, color, title, items, delay }) => {
  const progress = useReveal(delay);

  return (
    <div
      style={{
        backgroundColor: COLORS.panel,
        borderRadius: RADIUS,
        border: `2px solid ${color}`,
        padding: "22px 26px",
        opacity: progress,
        transform: `translateY(${(1 - progress) * 16}px)`,
        boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontFamily: monoFontFamily, fontSize: 19, color, marginBottom: 10 }}>{call}</div>
      <div style={{ fontFamily, fontWeight: 700, fontSize: 26, color: COLORS.text, marginBottom: 12 }}>
        {title}
      </div>
      {items.map((item) => (
        <div
          key={item}
          style={{
            display: "flex",
            gap: 10,
            fontFamily,
            fontSize: 19,
            color: COLORS.subtext,
            lineHeight: 1.5,
            marginTop: 4,
          }}
        >
          <span style={{ color }}>·</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
};

const Arrow: React.FC<{ label: string; delay: number }> = ({ label, delay }) => {
  const progress = useReveal(delay);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 0",
        opacity: progress,
      }}
    >
      <div style={{ width: 2, height: 30, backgroundColor: COLORS.mauve, marginLeft: 30 }} />
      <div style={{ fontFamily, fontSize: 19, color: COLORS.mauve }}>{label}</div>
    </div>
  );
};

const TABLE_ROWS = [
  { change: "動画コードを変えた", fn: false, site: true },
  { change: "Remotionをバージョンアップした", fn: true, site: true },
  { change: "RAM / DISK / TIMEOUT を変えた", fn: true, site: false },
];

const Cell: React.FC<{ on: boolean }> = ({ on }) => (
  <div
    style={{
      width: 110,
      textAlign: "center",
      fontFamily: monoFontFamily,
      fontSize: 20,
      color: on ? COLORS.green : COLORS.subtext,
      opacity: on ? 1 : 0.5,
    }}
  >
    {on ? "必要" : "—"}
  </div>
);

const RedeployTable: React.FC = () => {
  const headerProgress = useReveal(TABLE_AT);

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          paddingBottom: 10,
          borderBottom: `1px solid ${COLORS.panelAlt}`,
          opacity: headerProgress,
        }}
      >
        <div style={{ flex: 1, fontFamily, fontSize: 18, color: COLORS.subtext }}>変更したもの</div>
        <div
          style={{
            width: 110,
            textAlign: "center",
            fontFamily: monoFontFamily,
            fontSize: 17,
            color: COLORS.mauve,
          }}
        >
          function
        </div>
        <div
          style={{
            width: 110,
            textAlign: "center",
            fontFamily: monoFontFamily,
            fontSize: 17,
            color: COLORS.blue,
          }}
        >
          site
        </div>
      </div>
      {TABLE_ROWS.map((row, i) => (
        <Row key={row.change} row={row} delay={TABLE_AT + 22 + i * 26} />
      ))}
    </div>
  );
};

const Row: React.FC<{ row: (typeof TABLE_ROWS)[number]; delay: number }> = ({ row, delay }) => {
  const progress = useReveal(delay, 14);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: `1px solid ${COLORS.panelAlt}`,
        opacity: progress,
        transform: `translateX(${(1 - progress) * -12}px)`,
      }}
    >
      <div style={{ flex: 1, fontFamily, fontSize: 20, color: COLORS.text }}>{row.change}</div>
      <Cell on={row.fn} />
      <Cell on={row.site} />
    </div>
  );
};

export const DeployScene: React.FC = () => {
  const whyProgress = useReveal(WHY_AT);
  const bucketProgress = useReveal(BUCKET_AT);
  const trapProgress = useReveal(TRAP_AT);
  const footProgress = useReveal(FOOT_AT);
  const speculateProgress = useReveal(SPECULATE_AT);

  return (
    <SceneRoot>
      <Headline sub="デプロイされるのは2つ。汎用レンダラーのLambda関数と、S3に置かれた動画サイト">
        Lambda関数に、動画コードは入っていない
      </Headline>
      <div style={{ flex: 1, display: "flex", gap: 44, padding: "26px 100px 50px" }}>
        <div style={{ flex: 1.04 }}>
          <DeployBox
            call="deployFunction()"
            color={COLORS.mauve}
            title="Lambda関数 = 汎用レンダラー"
            items={["レンダリングエンジン + ヘッドレスChrome", "あなたの動画コードは1行も入っていない"]}
            delay={FUNCTION_AT}
          />
          <Arrow label="serveUrl を開いて、1フレームずつ撮る" delay={ARROW_AT} />
          <DeployBox
            call='deploySite({ entryPoint: "app/remotion/index.ts" })'
            color={COLORS.blue}
            title="S3上の静的サイト"
            items={["バンドルされた、あなたの動画コード", "レンダラーはこのURLをブラウザで開く"]}
            delay={SITE_AT}
          />
          <div
            style={{
              marginTop: 18,
              padding: "14px 20px",
              borderRadius: 12,
              backgroundColor: COLORS.panelAlt,
              fontFamily,
              fontSize: 18,
              color: COLORS.subtext,
              lineHeight: 1.5,
              opacity: bucketProgress,
            }}
          >
            <span style={{ fontFamily: monoFontFamily, color: COLORS.teal }}>getOrCreateBucket()</span>
            {" — 同じS3バケットが、サイトの置き場所であり、出力mp4の保存先でもある"}
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "18px 22px",
              borderRadius: 14,
              backgroundColor: COLORS.panel,
              borderLeft: `4px solid ${COLORS.mauve}`,
              opacity: speculateProgress,
              transform: `translateY(${(1 - speculateProgress) * 12}px)`,
            }}
          >
            <div style={{ fontFamily, fontWeight: 700, fontSize: 22, color: COLORS.text }}>
              関数名を保存しなくていい理由
            </div>
            <div
              style={{
                fontFamily,
                fontSize: 19,
                color: COLORS.subtext,
                lineHeight: 1.55,
                marginTop: 8,
              }}
            >
              汎用品だから、関数名はRAM / DISK / TIMEOUTだけで決まる。だから
              <span style={{ fontFamily: monoFontFamily, color: COLORS.mauve }}>
                {" speculateFunctionName() "}
              </span>
              で逆算できる。
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              padding: "18px 22px",
              borderRadius: 14,
              backgroundColor: COLORS.panel,
              borderLeft: `4px solid ${COLORS.teal}`,
              opacity: whyProgress,
              transform: `translateY(${(1 - whyProgress) * 12}px)`,
            }}
          >
            <div style={{ fontFamily, fontWeight: 700, fontSize: 23, color: COLORS.text }}>
              なぜ分けるのか
            </div>
            <div style={{ fontFamily, fontSize: 19, color: COLORS.subtext, lineHeight: 1.55, marginTop: 8 }}>
              一体化すると、動画を1行直すたびにLambdaの再デプロイが要る。分けておけば、動画側の変更はS3に上げ直すだけで済む。
            </div>
          </div>

          <RedeployTable />

          <div
            style={{
              display: "flex",
              gap: 14,
              marginTop: 24,
              padding: "18px 22px",
              borderRadius: 14,
              backgroundColor: COLORS.panel,
              border: `2px solid ${COLORS.red}`,
              opacity: trapProgress,
              transform: `translateY(${(1 - trapProgress) * 12}px)`,
            }}
          >
            <div style={{ fontFamily, fontSize: 22, color: COLORS.red, flexShrink: 0 }}>⚠</div>
            <div>
              <div style={{ fontFamily, fontWeight: 700, fontSize: 22, color: COLORS.text }}>
                最頻出の罠：直したのに、結果が古い
              </div>
              <div
                style={{
                  fontFamily,
                  fontSize: 19,
                  color: COLORS.subtext,
                  lineHeight: 1.55,
                  marginTop: 8,
                }}
              >
                プレビューが見ているのは手元のコード。Lambdaが見ているのはS3にデプロイ済みのサイト。
                <span style={{ fontFamily: monoFontFamily, color: COLORS.peach }}> deploySite() </span>
                を忘れると、この2つがズレる。
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily,
              fontSize: 18,
              color: COLORS.subtext,
              lineHeight: 1.5,
              marginTop: 18,
              opacity: footProgress,
            }}
          >
            このリポジトリでは、
            <span style={{ fontFamily: monoFontFamily, color: COLORS.text }}> sst deploy </span>
            が app/remotion のハッシュ変化を検知して自動で流し直すようにしてある。
          </div>
        </div>
      </div>
    </SceneRoot>
  );
};

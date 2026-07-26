import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CodeBlock } from "./CodeBlock";
import { Headline, SceneRoot, SplitPanel } from "./SceneLayout";
import { COLORS, RADIUS } from "./theme";
import { kw, tag, str, num, pl, fn, type CodeLine } from "./tokens";

const lines: CodeLine[] = [
  [kw("import"), pl(" { Composition } "), kw("from"), pl(" "), str('"remotion"'), pl(";")],
  [],
  [kw("export"), pl(" "), kw("const"), pl(" RemotionRoot = () => (")],
  [pl("  <"), tag("Composition")],
  [pl("    id="), str('"MyVideo"')],
  [pl("    component={"), fn("MyVideo"), pl("}")],
  [pl("    durationInFrames={"), num("150"), pl("}")],
  [pl("    fps={"), num("30"), pl("}")],
  [pl("  />")],
  [pl(");")],
];

const VideoMock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 24, delay: 4 });

  return (
    <div
      style={{
        width: 440,
        aspectRatio: "16 / 9",
        borderRadius: RADIUS,
        backgroundColor: COLORS.panel,
        transform: `scale(${scale})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 40px 80px rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: "26px solid transparent",
          borderBottom: "26px solid transparent",
          borderLeft: `40px solid ${COLORS.mauve}`,
          marginLeft: 8,
        }}
      />
    </div>
  );
};

export const ConceptScene: React.FC = () => {
  return (
    <SceneRoot>
      <Headline sub="コードがそのまま映像になる">
        Reactの知識だけで、動画を作れる
      </Headline>
      <SplitPanel left={<CodeBlock lines={lines} />} right={<VideoMock />} />
    </SceneRoot>
  );
};

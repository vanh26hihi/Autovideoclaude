import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type HelloVideoProps = {
  title: string;
  subtitle: string;
  accent: string;
};

const Title: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {text.split("").map((char, i) => {
        const progress = spring({ frame: frame - i * 2, fps, config: { damping: 12 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize: 140,
              fontWeight: 800,
              color: "white",
              transform: `translateY(${interpolate(progress, [0, 1], [80, 0])}px)`,
              opacity: progress,
              whiteSpace: "pre",
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

const Subtitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: "clamp" });

  return (
    <div style={{ fontSize: 56, color: "rgba(255,255,255,0.85)", opacity, transform: `translateY(${y}px)` }}>
      {text}
    </div>
  );
};

export const HelloVideo: React.FC<HelloVideoProps> = ({ title, subtitle, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const hue = interpolate(frame, [0, durationInFrames], [0, 60]);
  const lineWidth = interpolate(frame, [30, 60], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #0f0c29, ${accent})`,
        filter: `hue-rotate(${hue}deg)`,
        fontFamily: "Inter, system-ui, sans-serif",
        justifyContent: "center",
        alignItems: "center",
        opacity: fadeOut,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        <Title text={title} />
        <div style={{ height: 8, width: lineWidth, borderRadius: 4, background: "white" }} />
        <Sequence from={45} layout="none">
          <Subtitle text={subtitle} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};

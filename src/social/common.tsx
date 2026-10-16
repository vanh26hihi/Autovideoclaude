import { AbsoluteFill, Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";

export const Background: React.FC<{ children: React.ReactNode; tint?: string }> = ({
  children,
  tint = theme.bg2,
}) => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, 600], [120, 160]);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${theme.bg}, ${tint})`,
        fontFamily: theme.font,
        color: theme.text,
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Fades and slides in, starting at `delay` frames. */
export const Reveal: React.FC<{ delay?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay = 0,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div style={{ opacity: p, transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Plays a sound effect from public/audio at the given frame. */
export const Sfx: React.FC<{ name: "pop" | "whoosh" | "ding"; at: number; volume?: number }> = ({
  name,
  at,
  volume = 0.5,
}) => (
  <Sequence from={at} durationInFrames={30} layout="none">
    <Audio src={staticFile(`audio/${name}.mp3`)} volume={volume} />
  </Sequence>
);

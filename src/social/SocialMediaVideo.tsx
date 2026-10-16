import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Audio, interpolate, staticFile } from "remotion";
import { Sfx } from "./common";
import { Effects, Hook, Outro, Quote, Solutions, TimeMath } from "./scenes";

const scenes = [
  { Component: Hook, frames: 200 },
  { Component: TimeMath, frames: 330 },
  { Component: Effects, frames: 480 },
  { Component: Quote, frames: 200 },
  { Component: Solutions, frames: 390 },
  { Component: Outro, frames: 300 },
];

const TRANSITION = 20;

export const SOCIAL_VIDEO_DURATION =
  scenes.reduce((sum, s) => sum + s.frames, 0) - TRANSITION * (scenes.length - 1);

/** Frames where each transition starts, used to place the whoosh effect. */
const transitionStarts = scenes
  .slice(0, -1)
  .map((_, i) => scenes.slice(0, i + 1).reduce((sum, s) => sum + s.frames, 0) - TRANSITION * (i + 1));

export const SocialMediaVideo: React.FC = () => {
  return (
    <>
      <Audio
        src={staticFile("audio/music.mp3")}
        volume={(f) =>
          interpolate(f, [0, 30, SOCIAL_VIDEO_DURATION - 60, SOCIAL_VIDEO_DURATION], [0, 0.55, 0.55, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      {transitionStarts.map((at) => (
        <Sfx key={at} name="whoosh" at={at - 4} volume={0.35} />
      ))}
      <TransitionSeries>
        {scenes.flatMap(({ Component, frames }, i) => {
          const items = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={frames}>
              <Component />
            </TransitionSeries.Sequence>,
          ];
          if (i < scenes.length - 1) {
            items.push(
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={fade()}
                timing={linearTiming({ durationInFrames: TRANSITION })}
              />,
            );
          }
          return items;
        })}
      </TransitionSeries>
    </>
  );
};

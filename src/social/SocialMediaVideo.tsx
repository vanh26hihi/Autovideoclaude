import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
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

export const SocialMediaVideo: React.FC = () => {
  return (
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
  );
};

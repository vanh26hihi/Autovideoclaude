import { Composition } from "remotion";
import { HelloVideo, type HelloVideoProps } from "./HelloVideo";
import { SOCIAL_VIDEO_DURATION, SocialMediaVideo } from "./social/SocialMediaVideo";

const defaultProps: HelloVideoProps = {
  title: "Autovideo Claude",
  subtitle: "Video tạo bằng code với Remotion",
  accent: "#7c5cff",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SocialMedia"
        component={SocialMediaVideo}
        durationInFrames={SOCIAL_VIDEO_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HelloVideo"
        component={HelloVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />
    </>
  );
};

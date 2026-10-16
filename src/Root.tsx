import { Composition } from "remotion";
import { HelloVideo, type HelloVideoProps } from "./HelloVideo";

const defaultProps: HelloVideoProps = {
  title: "Autovideo Claude",
  subtitle: "Video tạo bằng code với Remotion",
  accent: "#7c5cff",
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="HelloVideo"
      component={HelloVideo}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaultProps}
    />
  );
};

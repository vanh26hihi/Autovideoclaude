import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, Reveal } from "./common";
import { theme } from "./theme";

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 70, fps, config: { damping: 10 } });
  return (
    <Background>
      <div style={{ textAlign: "center" }}>
        <Reveal>
          <div style={{ fontSize: 48, color: theme.muted, letterSpacing: 6 }}>CÂU HỎI CHO BẠN</div>
        </Reveal>
        <Reveal delay={15}>
          <div style={{ fontSize: 110, fontWeight: 800, lineHeight: 1.15, marginTop: 30 }}>
            Hôm nay bạn đã lướt
            <br />
            điện thoại <span style={{ color: theme.accent }}>bao lâu</span>?
          </div>
        </Reveal>
        <div style={{ fontSize: 160, marginTop: 30, transform: `scale(${pop})` }}>📱</div>
      </div>
    </Background>
  );
};

const PhoneFeed: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = (frame * 9) % 220;
  const colors = [theme.accent, theme.accent2, theme.good, "#ffcf5c"];
  return (
    <div
      style={{
        width: 360,
        height: 680,
        borderRadius: 48,
        border: `10px solid ${theme.text}`,
        overflow: "hidden",
        position: "relative",
        background: "#000",
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            height: 190,
            top: i * 220 - offset,
            borderRadius: 20,
            background: colors[i % colors.length],
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
};

export const TimeMath: React.FC = () => {
  const frame = useCurrentFrame();
  const hours = Math.round(
    interpolate(frame, [90, 190], [0, 1095], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  return (
    <Background>
      <div style={{ display: "flex", alignItems: "center", gap: 100 }}>
        <PhoneFeed />
        <div style={{ width: 1100 }}>
          <Reveal delay={10}>
            <div style={{ fontSize: 64, color: theme.muted }}>Giả sử mỗi ngày</div>
            <div style={{ fontSize: 120, fontWeight: 800 }}>
              <span style={{ color: theme.accent2 }}>3 giờ</span> lướt mạng
            </div>
          </Reveal>
          <Reveal delay={80} style={{ marginTop: 50 }}>
            <div style={{ fontSize: 64, color: theme.muted }}>Một năm sẽ là</div>
            <div style={{ fontSize: 140, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              {hours.toLocaleString("vi-VN")} giờ
            </div>
          </Reveal>
          <Reveal delay={210} style={{ marginTop: 30 }}>
            <div style={{ fontSize: 72, fontWeight: 700, color: theme.accent }}>≈ 45 ngày không ngủ, không nghỉ</div>
          </Reveal>
        </div>
      </div>
    </Background>
  );
};

const effects = [
  { icon: "😴", title: "Mất ngủ", body: "Ánh sáng màn hình và nội dung vô tận khiến ta thức khuya hơn." },
  { icon: "🪞", title: "So sánh bản thân", body: "Chỉ thấy khoảnh khắc đẹp nhất của người khác, ta dễ tự ti." },
  { icon: "🎯", title: "Giảm tập trung", body: "Video ngắn liên tục làm ta khó đọc, khó học lâu." },
  { icon: "🫥", title: "Cô đơn", body: "Luôn kết nối nhưng ít khi thật sự trò chuyện." },
];

export const Effects: React.FC = () => {
  return (
    <Background tint="#3b1b2f">
      <div style={{ width: "100%" }}>
        <Reveal>
          <div style={{ fontSize: 96, fontWeight: 800, textAlign: "center", marginBottom: 70 }}>
            Cái giá <span style={{ color: theme.accent }}>vô hình</span>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          {effects.map((e, i) => (
            <Reveal key={e.title} delay={40 + i * 75}>
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 28,
                  padding: "36px 44px",
                  display: "flex",
                  gap: 36,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 96 }}>{e.icon}</div>
                <div>
                  <div style={{ fontSize: 58, fontWeight: 800 }}>{e.title}</div>
                  <div style={{ fontSize: 36, color: theme.muted, marginTop: 8 }}>{e.body}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Background>
  );
};

export const Quote: React.FC = () => {
  const frame = useCurrentFrame();
  const words = "Kết nối nhiều hơn, nhưng gần nhau ít hơn?".split(" ");
  return (
    <Background tint="#102a3b">
      <div style={{ fontSize: 120, fontWeight: 800, textAlign: "center", lineHeight: 1.2, maxWidth: 1500 }}>
        {words.map((w, i) => {
          const o = interpolate(frame, [20 + i * 10, 35 + i * 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span key={i} style={{ opacity: o, color: i >= 4 ? theme.accent2 : theme.text }}>
              {w}{" "}
            </span>
          );
        })}
      </div>
    </Background>
  );
};

const tips = [
  "Tắt thông báo không cần thiết",
  "Cất điện thoại 1 giờ trước khi ngủ",
  "Đặt giới hạn thời gian cho từng ứng dụng",
  "Hẹn gặp bạn bè ngoài đời thật",
];

export const Solutions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Background tint="#13331f">
      <div style={{ width: 1400 }}>
        <Reveal>
          <div style={{ fontSize: 96, fontWeight: 800, marginBottom: 60 }}>
            Lấy lại <span style={{ color: theme.good }}>thời gian</span> của bạn
          </div>
        </Reveal>
        {tips.map((t, i) => {
          const start = 50 + i * 70;
          const check = spring({ frame: frame - start - 25, fps, config: { damping: 12 } });
          return (
            <Reveal key={t} delay={start} style={{ display: "flex", alignItems: "center", gap: 40, marginBottom: 36 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  border: `5px solid ${theme.good}`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: 60,
                  color: theme.good,
                }}
              >
                <span style={{ transform: `scale(${check})` }}>✓</span>
              </div>
              <div style={{ fontSize: 64, fontWeight: 600 }}>{t}</div>
            </Reveal>
          );
        })}
      </div>
    </Background>
  );
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <Background>
      <div style={{ textAlign: "center", opacity: fade }}>
        <Reveal>
          <div style={{ fontSize: 100, fontWeight: 800, lineHeight: 1.2 }}>
            Hãy dùng mạng xã hội,
            <br />
            <span style={{ color: theme.accent }}>đừng để nó dùng bạn.</span>
          </div>
        </Reveal>
        <Reveal delay={50}>
          <div style={{ fontSize: 48, color: theme.muted, marginTop: 50 }}>Đặt điện thoại xuống. Nhìn lên. ❤️</div>
        </Reveal>
      </div>
    </Background>
  );
};

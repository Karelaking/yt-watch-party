import { ImageResponse } from "next/og";

export const alt = "WatchParty — Watch YouTube Together in Real-Time Sync";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image(): Promise<ImageResponse> {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #27272a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #27272a 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          color: "white",
          fontFamily: "sans-serif",
          padding: "48px",
          position: "relative",
        }}
      >
        {/* Glow ambient background */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(239,68,68,0.25) 0%, rgba(59,130,246,0.15) 50%, transparent 70%)",
            filter: "blur(60px)",
            top: "140px",
          }}
        />

        {/* Top Logo Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "10px 24px",
            borderRadius: "9999px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "14px",
            }}
          >
            ▶
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "#ffffff",
            }}
          >
            WatchParty
          </span>
          <span
            style={{
              fontSize: "12px",
              backgroundColor: "#22c55e",
              color: "#052e16",
              padding: "3px 10px",
              borderRadius: "9999px",
              fontWeight: 700,
              marginLeft: "4px",
            }}
          >
            SUB-15MS SYNC
          </span>
        </div>

        {/* Main Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "960px",
            lineHeight: 1.15,
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: "58px",
              fontWeight: 900,
              letterSpacing: "-2px",
              color: "#ffffff",
            }}
          >
            Watch YouTube Together
          </span>
          <span
            style={{
              fontSize: "58px",
              fontWeight: 900,
              letterSpacing: "-2px",
              color: "#a1a1aa",
            }}
          >
            in Frame-Perfect Sync 🍿
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "22px",
            color: "#71717a",
            textAlign: "center",
            maxWidth: "760px",
            margin: "0 0 36px 0",
            lineHeight: 1.4,
          }}
        >
          Zero browser extensions. Real-time chat & flying reactions. Instant room sharing for friends and communities.
        </p>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "10px 20px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: 600,
              color: "#e4e4e7",
            }}
          >
            ⚡ Zero Extension Required
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "10px 20px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: 600,
              color: "#e4e4e7",
            }}
          >
            💬 Real-Time Live Chat
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "10px 20px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: 600,
              color: "#e4e4e7",
            }}
          >
            📱 Mobile & Desktop
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

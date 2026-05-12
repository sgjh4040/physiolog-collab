import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1c1c1c",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: 260,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-8px",
            }}
          >
            P
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 52,
              fontWeight: 400,
              letterSpacing: "16px",
            }}
          >
            LOG
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}

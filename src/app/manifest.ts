import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Atlas — 물리치료 차팅",
    short_name: "Atlas",
    description: "정확한 평가는 치료의 가장 정직한 지도가 됩니다.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    // 안드로이드 PWA splash 배경 (iOS는 apple-touch-startup-image로 별도 처리)
    background_color: "#1c1c1c",
    theme_color: "#1c1c1c",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

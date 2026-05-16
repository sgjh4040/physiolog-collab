import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "physiolog — 물리치료 차팅",
    short_name: "physiolog",
    description: "정확한 평가는 치료의 가장 정직한 지도가 됩니다.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    // 안드로이드 PWA splash 배경 (iOS는 apple-touch-startup-image로 별도 처리)
    background_color: "#1c1c1c",
    theme_color: "#1c1c1c",
    icons: [
      // 'any' — iOS는 maskable만 있으면 사용하지 않음. 일반 purpose도 추가해야
      // 홈 화면 아이콘·splash 합성에 사용됨.
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

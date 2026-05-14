import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "physiolog",
    short_name: "physio",
    description: "물리치료사·트레이너용 환자 차팅 앱",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    // PWA cold start system splash 배경 — theme_color와 일치시켜 흰 frame 제거.
    // 흰 → 다크 전환: 사용자가 "흰화면 구간 뒤에 잠시 나오는 로딩"이라고 표현한 깜빡임 방지.
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

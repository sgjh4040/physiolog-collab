import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const withSerwistConfig = withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // dev에서는 Turbopack 충돌 방지를 위해 비활성화
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Next 16부터 dev는 Turbopack 기본. withSerwist가 추가하는 webpack config와
  // Turbopack이 충돌해 첫 요청에서 dev 서버가 crash하는 문제를 막기 위해
  // 빈 turbopack 설정을 명시(Turbopack이 webpack config를 무시하도록 신호).
  // build는 package.json scripts.build의 `--webpack` 플래그로 webpack 강제.
  turbopack: {},
};

export default withSerwistConfig(nextConfig);

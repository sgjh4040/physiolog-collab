import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const withSerwistConfig = withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // dev에서는 Turbopack 충돌 방지를 위해 비활성화
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {};

export default withSerwistConfig(nextConfig);

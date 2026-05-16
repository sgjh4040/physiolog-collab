'use strict';
/* eslint-disable */
/**
 * iOS apple-touch-startup-image PNG 자동 생성.
 *
 * 흐름:
 * 1. dev 서버 (http://localhost:3000) 이미 켜진 상태에서 실행
 * 2. /splash-capture 페이지에 device size별로 navigate
 * 3. PNG 캡처 → public/splash/ 저장
 *
 * 사용: npm run dev (다른 터미널) → node scripts/capture-splash.cjs
 *
 * iOS는 가장 가까운 해상도 매칭이라 4종으로 모든 iPhone 모델 cover.
 */
const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000'
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'splash')

// iOS 디바이스 해상도 매트릭스 — CSS pixels × DPR로 실제 pixel 크기.
// 4종으로 iPhone SE부터 15 Pro Max까지 cover.
const VARIANTS = [
  { name: '1290x2796', width: 1290, height: 2796, dpr: 3 }, // iPhone 15 Pro Max, 14 Pro Max, 15 Plus
  { name: '1179x2556', width: 1179, height: 2556, dpr: 3 }, // iPhone 15 Pro, 15, 14 Pro
  { name: '1170x2532', width: 1170, height: 2532, dpr: 3 }, // iPhone 14, 13, 12
  { name: '1125x2436', width: 1125, height: 2436, dpr: 3 }, // iPhone 11 Pro, X, XS
  { name: '750x1334', width: 750, height: 1334, dpr: 2 },   // iPhone SE
]

;(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })

  for (const v of VARIANTS) {
    const cssWidth = v.width / v.dpr
    const cssHeight = v.height / v.dpr
    const context = await browser.newContext({
      viewport: { width: Math.round(cssWidth), height: Math.round(cssHeight) },
      deviceScaleFactor: v.dpr,
    })
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/splash-capture`, { waitUntil: 'networkidle' })
    // Next.js dev tools overlay/button 제거 + 한 프레임 안정화 대기
    await page.addStyleTag({
      content: `
        button[aria-label*="Next.js Dev Tools"],
        [data-nextjs-dev-overlay],
        [data-nextjs-dialog-overlay],
        [data-nextjs-toast] { display: none !important; }
      `,
    })
    await page.waitForTimeout(600)
    const outPath = path.join(OUTPUT_DIR, `apple-splash-${v.name}.png`)
    await page.screenshot({ path: outPath, fullPage: false, type: 'png' })
    console.log(`Saved: ${outPath} (${v.width}x${v.height})`)
    await context.close()
  }

  await browser.close()
  console.log('Done — 5 splash PNGs saved in public/splash/')
})().catch((err) => {
  console.error('Capture failed:', err)
  process.exit(1)
})

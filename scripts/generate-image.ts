#!/usr/bin/env bun
/**
 * 나노바나나2 (Gemini 3.1 Flash Image) 이미지 생성 스크립트
 *
 * 사용법:
 *   bun scripts/generate-image.ts "프롬프트" [옵션]
 *
 * 예시:
 *   bun scripts/generate-image.ts "리틀버드음악학원 봄 신학기 모집 포스터"
 *   bun scripts/generate-image.ts "피아노 수업 일러스트" --ratio 1:1 --name insta-feed
 *   bun scripts/generate-image.ts "유튜브 썸네일" --ratio 16:9 --resolution 2K
 *
 * 옵션:
 *   --ratio     가로세로 비율 (기본: 1:1) — 1:1, 9:16, 16:9, 4:3, 3:4
 *   --resolution 해상도 (기본: 1K) — 512, 1K, 2K, 4K
 *   --name      저장 파일명 (기본: 타임스탬프)
 *   --out       저장 디렉토리 (기본: images/generated/)
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY가 .env에 없습니다.");
  process.exit(1);
}

// 인자 파싱
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "--help") {
  console.log(`
사용법: bun scripts/generate-image.ts "프롬프트" [옵션]

옵션:
  --ratio      가로세로 비율 (기본: 1:1)
               1:1 (인스타 피드), 9:16 (인스타 스토리), 16:9 (유튜브 썸네일)
               4:3, 3:4, 4:1, 1:4
  --resolution 해상도 (기본: 1K) — 512, 1K, 2K, 4K
  --name       저장 파일명 (기본: 타임스탬프)
  --out        저장 디렉토리 (기본: images/generated/)

예시:
  bun scripts/generate-image.ts "리틀버드음악학원 봄 신학기 모집 포스터"
  bun scripts/generate-image.ts "피아노 수업 일러스트" --ratio 1:1 --name class-promo
  bun scripts/generate-image.ts "발표회 유튜브 썸네일" --ratio 16:9 --resolution 2K
`);
  process.exit(0);
}

function getArg(flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return defaultValue;
}

// 프롬프트 = 첫 번째 non-flag 인자
const prompt = args.find((a) => !a.startsWith("--")) ?? "";
if (!prompt) {
  console.error("❌ 프롬프트를 입력하세요.");
  process.exit(1);
}

const ratio = getArg("--ratio", "1:1");
const resolution = getArg("--resolution", "1K");
const outDir = getArg("--out", "images/generated");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const fileName = getArg("--name", timestamp);

// 출력 디렉토리 생성
const fullOutDir = path.resolve(outDir);
if (!fs.existsSync(fullOutDir)) {
  fs.mkdirSync(fullOutDir, { recursive: true });
}

console.log(`🎨 이미지 생성 중...`);
console.log(`   프롬프트: ${prompt}`);
console.log(`   비율: ${ratio} | 해상도: ${resolution}`);
console.log();

const ai = new GoogleGenAI({ apiKey: API_KEY });

try {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp-image-generation",
    contents: prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      // @ts-ignore — imageConfig might not be in type defs yet
      imageConfig: {
        aspectRatio: ratio,
        imageSize: resolution,
      },
    },
  });

  if (!response.candidates?.[0]?.content?.parts) {
    console.error("❌ 응답이 비어있습니다.");
    process.exit(1);
  }

  let imageCount = 0;
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(`💬 ${part.text}`);
    } else if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data!, "base64");
      const ext = part.inlineData.mimeType === "image/jpeg" ? "jpg" : "png";
      const filePath = path.join(
        fullOutDir,
        `${fileName}${imageCount > 0 ? `-${imageCount}` : ""}.${ext}`
      );
      fs.writeFileSync(filePath, buffer);
      imageCount++;
      console.log(`✅ 저장: ${filePath} (${(buffer.length / 1024).toFixed(0)}KB)`);
    }
  }

  if (imageCount === 0) {
    console.error("❌ 이미지가 생성되지 않았습니다. 프롬프트를 수정해보세요.");
  } else {
    console.log(`\n🎉 ${imageCount}장 생성 완료!`);
  }
} catch (err: any) {
  if (err.message?.includes("API key")) {
    console.error("❌ API 키가 유효하지 않습니다. .env 파일을 확인하세요.");
  } else if (err.message?.includes("SAFETY")) {
    console.error("❌ 안전 필터에 의해 차단되었습니다. 프롬프트를 수정해보세요.");
  } else {
    console.error(`❌ 에러: ${err.message}`);
  }
  process.exit(1);
}

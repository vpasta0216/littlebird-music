# 리틀버드음악학원 (littlebird-music)

## 프로젝트 개요
리틀버드음악학원 홈페이지. 정적 웹사이트.

## 기술 스택
- 순수 HTML/CSS/JS (빌드 도구 없음)
- Vercel 배포

## 프로젝트 구조
```
index.html          # 메인 페이지 (단일 파일)
images/             # 로고, 사진
GUIDE/              # 마케팅/운영 가이드 문서
docs/               # PSW 문서 (PROJECT-STATUS, PRD, plans)
vercel.json         # Vercel 설정
```

## 주의사항
- 정적 사이트: 빌드/번들러 없음. index.html 직접 수정
- 연락처, 주소 등 실제 학원 정보 포함 — 외부 노출 주의
- GUIDE/ 폴더: 마케팅 운영 가이드 (SNS, 블로그, 유튜브 등)
- 한글 파일명 다수 존재 (학원로고/, 새 폴더/ 등)

# Corea Hoy — Backend

한국 뉴스를 스페인어권 사용자에게 전달하는 AI 기반 뉴스 큐레이션 플랫폼의 백엔드 서버입니다.

<br>

## 🛠 기술 스택

[![skills](https://skillicons.dev/icons?i=ts,express,prisma,supabase,postgres,eslint,git,github)](https://skillicons.dev)

![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)

<br>

## ⚙️ 초기 세팅

```bash
# 1. 패키지 설치
npm install

# 2. 환경변수 파일 생성
cp .env.example .env
# .env 파일 열어서 값 채우기

# 3. Prisma 클라이언트 생성
npm run db:generate

# 4. DB 테이블 생성 (Supabase 연결 후)
npm run db:migrate
```

<br>

## 🚀 실행

```bash
# 개발 서버 실행
npm run dev

# 서버 확인
http://localhost:4000/health

# Swagger API 문서
http://localhost:4000/api-docs
```

<br>

## 📦 주요 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # TypeScript 컴파일
npm run lint         # ESLint 검사
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 포맷팅
npm run db:generate  # Prisma 클라이언트 생성
npm run db:migrate   # DB 마이그레이션
npm run db:studio    # Prisma Studio (DB GUI)
```

<br>

## 🌿 브랜치 규칙

```
feat/기능명       feat/login-api
fix/버그명        fix/token-error
refactor/내용     refactor/article-service
chore/내용        chore/eslint-setup
```

> **이슈에서 브랜치 생성하기**
> GitHub 이슈 → 오른쪽 `Development` → `Create a branch`

<br>

## ✏️ 커밋 규칙

```
feat: 새 기능
fix: 버그 수정
docs: 문서 수정
style: 포맷팅 (로직 변경 없음)
refactor: 리팩토링
chore: 패키지, 설정 변경
```

```bash
# 예시
git commit -m "feat: 로그인 API 구현"
git commit -m "fix: 토큰 만료 오류 수정"
```

> 규칙에 맞지 않으면 커밋이 자동으로 거절됩니다 (Husky + commitlint)

<br>

## 📋 이슈 & PR

**이슈 생성**
- `[feat]` 기능 개발 / `[fix]` 버그 수정 템플릿 사용

**PR 생성**
- `closes #이슈번호` 반드시 포함
- 팀원 1명 승인 후 merge 가능

<br>

## 📁 폴더 구조

```
src/
├── controllers/   # req, res 처리
├── services/      # 비즈니스 로직
├── middlewares/   # JWT 검증, 에러 핸들링
├── routes/        # API 엔드포인트 정의
├── lib/           # Prisma 클라이언트, Swagger 설정
└── types/         # TypeScript 타입 정의
prisma/
└── schema.prisma  # DB 스키마
```

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

## 🌐 배포 (Render)

운영 서버: `https://corea-hoy-be-us.onrender.com`

### 슬립 방지 (cron-job.org)

Render 무료 플랜은 **15분간 요청이 없으면 인스턴스가 슬립**되고, 다음 요청에서 콜드 스타트로 30초 이상 지연됩니다.
[cron-job.org](https://cron-job.org)의 무료 크론잡으로 `/health`를 주기적으로 호출해 깨어있는 상태를 유지합니다.

| 항목 | 값 |
| --- | --- |
| URL | `https://corea-hoy-be-us.onrender.com/health` |
| Method | `GET` |
| 실행 주기 | 10분 |
| 실행 시간대 | 월~토 07:00 ~ 23:50 KST (일요일 제외) |
| 타임존 | `Asia/Seoul` |
| 크론 표현식 | `*/10 7-23 * * 1-6` |

**설정 방법**
1. cron-job.org 가입 → `Settings`에서 Default timezone을 `Asia/Seoul`로 먼저 지정
   (이 값은 새로 만드는 잡에만 적용되므로 잡 생성 전에 설정)
2. `Create cronjob` → Title `Render keep-alive`, URL에 위 주소 입력
3. Execution schedule에서 프리셋 대신 `Custom` 선택 후 격자를 아래처럼 체크

   | 격자 | 선택 |
   | --- | --- |
   | Months / Days of month | 전체 |
   | Days of week | `Mon`~`Sat` (Sun 해제) |
   | Hours | `7` ~ `23` |
   | Minutes | `0, 10, 20, 30, 40, 50` |

4. `Notify me when...`에서 알림 설정

   | 항목 | 설정 |
   | --- | --- |
   | execution of the cronjob fails | ON (Notify after `2`) |
   | execution succeeds after it failed before | ON |
   | the cronjob will be disabled because of too many failures | ON (기본값 유지) |
   | the server TLS certificate is about to expire | OFF (Render가 자동 갱신) |

5. 저장 후 `TEST RUN`으로 200 / `{"status":"ok"}` 응답 확인

> **실패 알림을 2회로 둔 이유**
> 슬립 상태에서 첫 핑이 나가면 콜드 스타트로 20초 이상 걸려 요청 타임아웃에 걸칠 수 있습니다.
> 1회로 두면 이런 일시적 건으로도 알림이 와서 결국 무시하게 됩니다.
>
> **`too many failures` 알림은 끄지 마세요.**
> cron-job.org는 실패가 누적되면 잡을 자동 비활성화합니다. 이 알림이 없으면 핑이 멈춘 것을 아무도 모르게 되어, GitHub Actions에서 겪은 것과 같은 상황이 반복됩니다.

> **간격을 10분으로 둔 이유**
> 슬립 기준이 15분이라 12분은 여유가 3분뿐입니다. 핑 간격은 인스턴스 사용 시간에 영향을 주지 않으므로(비용은 "깨어있는 시간"으로만 계산됨) 간격을 줄이는 데 드는 비용이 없습니다.

> **시간대를 제한하는 이유**
> Render 무료 플랜은 계정당 **750 인스턴스-시간/월** 한도가 있고, 소진하면 남은 기간 동안 서비스가 정지됩니다.
> 24시간 내내 깨워두면 31일 달 기준 744시간으로 여유가 6시간뿐입니다.
> 현재 설정(하루 17시간 × 월 약 26일)은 **월 약 445시간**으로 300시간 이상 여유가 있습니다.

> **설정 위치 주의**
> 이 설정의 실체는 저장소가 아니라 cron-job.org 대시보드에 있습니다. 위 표는 기록용이므로 대시보드에서 값을 바꾸면 이 문서도 함께 수정해야 합니다.

> **GitHub Actions를 쓰지 않는 이유**
> `schedule` 트리거는 best-effort로 동작해 피크 시간대에 10~60분씩 밀립니다. 슬립 기준(15분)을 넘겨 깨우기에 실패하고, 저장소에 60일간 커밋이 없으면 스케줄이 자동 비활성화됩니다.

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

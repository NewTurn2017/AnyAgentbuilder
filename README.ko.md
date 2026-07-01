[English](README.md) · [한국어](README.ko.md)

# AnyAgentbuilder

실제 서비스 워크플로 — 예약, 대출/반납, 좌석 배정, 진료 예약 — 를 구체적인 멀티 에이전트 챗 시스템으로 바꿔주는 Claude Code 스킬입니다. 트리아지 + 전문 에이전트, 핸드오프, 가드레일, 공개 컨텍스트, 위젯, 그리고 검증 가능한 스타터 구현까지 설계합니다.

이 저장소는 세 가지를 담고 있습니다:

- **`skills/agentic-system-builder/`** — 스킬 본체(`SKILL.md`, 방법론은 `REFERENCE.md`, 도메인 팩은 `EXAMPLES.md`)와 스캐폴드/검증 스크립트, 템플릿.
- **`generated/library-reservation-demo/`** — 템플릿에서 생성된 동작하는 데모: FastAPI mock 백엔드 + 한국어 React 챗 UI. `OPENAI_API_KEY` 없이 완전히 오프라인으로 동작합니다.
- **`.omo/`** — 빌드 당시의 작업 계획과 검증 증거(브라우저 스크린샷, QA 로그).

## 빠른 시작

[skills CLI](https://github.com/vercel-labs/skills)로 한 줄 설치 — Claude Code, Codex, Cursor 등 70개 이상의 에이전트를 지원합니다:

```bash
npx skills add newTurn2017/AnyAgentbuilder
```

그다음 에이전트에게 운영형 에이전트 시스템을 만들어 달라고 요청하세요(예: "스터디룸 예약 에이전트 시스템 만들어줘"). 스킬이 도메인 스펙 설계, 에이전트/핸드오프/가드레일 분해, mock 우선 구현 계획을 안내합니다.

## 데모 실행

명령 하나로 전체 QA 파이프라인(검증 → 스캐폴드 → 백엔드 curl 체크 → 브라우저 QA → 정리)이 실행됩니다. Node 18+ 와 Python 3 가 필요합니다.

```bash
git clone https://github.com/newTurn2017/AnyAgentbuilder.git
cd AnyAgentbuilder
env -u OPENAI_API_KEY AGENT_RUNTIME=mock npm run qa:generated-demo
```

수동 실행은 [`generated/library-reservation-demo/README.md`](generated/library-reservation-demo/README.md)에서 백엔드(`uvicorn`, 8000 포트)와 프론트엔드(`vite`) 단계를 참고하세요.

## 스크립트

모든 스크립트는 Node 내장 모듈만 사용합니다 — 저장소 루트에서 `npm install`이 필요 없습니다.

| 명령 | 설명 |
|---|---|
| `npm run validate:skill` | 스킬 패키지 구조 검사 (`SKILL.md` frontmatter, 1단계 참조 규칙) |
| `npm run validate:examples` | `EXAMPLES.md`의 airline / library / pcbang / generic 도메인 팩 검증 |
| `npm run scaffold:library-demo` | `skills/agentic-system-builder/templates/`에서 도서관 데모 재생성 |
| `npm run qa:generated-demo` | 생성된 데모의 mock 모드 end-to-end QA |

## 프로젝트 구조

```
skills/agentic-system-builder/
  SKILL.md          # 스킬 진입점 (fast path)
  REFERENCE.md      # 재사용 가능한 방법론: 도메인 스펙 → 에이전트 → 증명 계획
  EXAMPLES.md       # 도메인 팩: airline, library, pcbang, generic
  scripts/          # validate-domain-spec, scaffold-agent-system, qa-generated-demo
  templates/        # 백엔드(FastAPI) + 프론트엔드(React/Vite) 스캐폴드 템플릿
generated/
  library-reservation-demo/   # 생성된 동작 데모 (mock 런타임)
.omo/               # 빌드 계획 + 검증 증거
```

## 상태

Mock 모드가 기본이자 유일하게 검증된 경로입니다: 생성된 백엔드는 OpenAI를 import하거나 호출하지 않습니다. 실제 OpenAI Agents SDK 연동은 `AGENT_RUNTIME=openai` 뒤의 opt-in 확장으로 문서화만 되어 있고 구현되어 있지 않습니다.

## 라이선스

[License — 아직 지정되지 않음]

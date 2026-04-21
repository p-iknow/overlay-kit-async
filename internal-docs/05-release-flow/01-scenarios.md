# 시나리오별 릴리스 플로우

## 시나리오 1: 일반적인 기능 개발 → 배포

가장 흔한 케이스입니다. 개발자가 라이브러리 소스를 변경하고 배포까지 이어지는 전체 흐름입니다.

### 1-1. 개발자: 코드 변경 + changeset 생성

```bash
git checkout -b feat/new-close-option
# ... packages/src/ 코드 수정

pnpm changeset
# 🦋 Which packages? → overlay-kit-async
# 🦋 What bump?     → minor
# 🦋 Summary?       → feat: add new close option
```

결과물:

```
.changeset/funny-dogs-dance.md   ← changeset 파일 생성
packages/src/event.ts            ← 코드 변경
```

### 1-2. PR 올림

```bash
git add .
git commit -m "feat: add new close option"
git push origin feat/new-close-option
# GitHub에서 PR 생성
```

### 1-3. CI 자동 실행

```
✅ ci.yml          → 테스트, 린트, 빌드 통과
✅ changeset-check → packages/src/ 변경 있음 + .changeset/*.md 있음 → Pass
```

### 1-4. 메인테이너: PR 리뷰 후 머지

```
PR #10 → Merge to main
```

### 1-5. release.yml 자동 실행 (version 모드)

`release.yml`이 발화하고 `changesets/action`이 main의 `.changeset/*.md` 파일을 감지 → **version 모드**로 진입해 자동으로 Version PR을 생성합니다:

```
PR #11: "chore: version packages"
├── packages/package.json    (1.9.0 → 1.10.0)
├── packages/CHANGELOG.md    (새 엔트리 추가)
└── .changeset/funny-dogs-dance.md  (삭제됨)
```

### 1-6. 메인테이너: Version PR 머지

```
PR #11 "chore: version packages" → Merge to main
```

### 1-7. release.yml 재실행 (publish 모드)

Version PR 머지로 main이 push되면 `release.yml`이 다시 발화. 이번에는 `.changeset/*.md`가 모두 소비되어 없으므로 `changesets/action`이 **publish 모드**로 진입:

```
1. pnpm changeset:publish 실행
2. npm에 이미 1.10.0이 있는지 체크 → 없으면 publish
3. npm publish --provenance → overlay-kit-async@1.10.0 배포
4. git tag 생성 (overlay-kit-async@1.10.0, v1.10.0) + push
```

**사용자가 `pnpm add overlay-kit-async@1.10.0`으로 설치 가능.**

---

## 시나리오 2: 여러 PR이 쌓인 후 한 번에 릴리스

여러 개발자가 동시에 작업할 때 흔한 케이스입니다.

### 2-1. 여러 PR 머지 (월요일 ~ 수요일)

```
PR #10 (feat: A)  → .changeset/aaa.md (minor)  → 머지
PR #11 (fix: B)   → .changeset/bbb.md (patch)  → 머지
PR #12 (fix: C)   → .changeset/ccc.md (patch)  → 머지
```

### 2-2. release.yml이 매 머지마다 Version PR을 갱신

```
PR #10 머지 → release.yml (version 모드) → Version PR 생성 (1.9.0 → 1.10.0, minor 기준)
PR #11 머지 → release.yml (version 모드) → Version PR 업데이트 (fix B 내용 추가)
PR #12 머지 → release.yml (version 모드) → Version PR 업데이트 (fix C 내용 추가)
```

Version PR 내용:

```markdown
## 1.10.0

### Minor Changes
- feat: A

### Patch Changes
- fix: B
- fix: C
```

### 2-3. 메인테이너가 적절한 시점에 Version PR 머지

```
Version PR 머지 → 1.10.0 배포 (3개 변경사항 한 번에)
```

**핵심: changeset이 여러 개 쌓여도 가장 높은 bump 타입이 적용됩니다 (minor > patch → minor).**

---

## 시나리오 3: docs, CI 등 라이브러리 소스 외 변경

`packages/src/` 외의 변경은 changeset이 필요 없습니다.

### 3-1. 문서만 수정

```bash
git checkout -b docs/update-readme
# docs/ 파일만 수정 (packages/src/ 변경 없음)
```

### 3-2. changeset 없이 PR 올림

```bash
git add .
git commit -m "docs: update README"
git push origin docs/update-readme
```

### 3-3. CI 실행 결과

```
✅ ci.yml          → 통과
✅ changeset-check → packages/src/ 변경 없음 → Skip (changeset 불필요)
```

### 3-4. 머지 후

```
PR 머지 → release.yml 실행
        → .changeset/*.md 없음 → changesets/action이 할 일 없음
        → 아무 일도 안 일어남 ✅
```

---

## 시나리오 4: PR 프리뷰 배포 (머지 전 테스트)

PR을 머지하기 전에 미리 패키지를 설치해서 테스트하고 싶을 때 사용합니다.

### 4-1. PR이 올라간 상태

```
PR #15: feat/experimental-animation (아직 머지 안 함)
```

### 4-2. PR에 코멘트

```
/publish
```

### 4-3. publish-comment.yml 자동 실행

```
1. PR 브랜치 체크아웃
2. 빌드
3. 버전: 1.10.0-pr15
4. npm publish → npm에 배포
5. PR에 자동 코멘트:
   📦 Published overlay-kit-async@1.10.0-pr15
   pnpm add overlay-kit-async@1.10.0-pr15
```

### 4-4. 테스트

```bash
pnpm add overlay-kit-async@1.10.0-pr15
# 실제 서비스에서 테스트 후 피드백
```

**프리뷰 버전은 `latest` 태그에 영향 없음. 안전합니다.**

---

## 시나리오 5: (실수) changeset 없이 소스 변경 PR

`changeset-check.yml`이 실수를 잡아줍니다.

### 5-1. 개발자가 changeset을 깜빡함

```bash
# packages/src/ 수정했는데 pnpm changeset 안 함
git push origin fix/typo
```

### 5-2. CI 결과

```
✅ ci.yml          → 테스트 통과
❌ changeset-check → packages/src/ 변경 있는데 .changeset/*.md 없음 → Fail
```

### 5-3. 개발자가 changeset 추가

```bash
pnpm changeset     # patch 선택, "fix: typo in event handler"
git add .changeset/
git commit -m "chore: add changeset"
git push
```

### 5-4. CI 재실행

```
✅ changeset-check → .changeset/*.md 존재 → Pass
```

---

## 시나리오 6: (실수) 수동으로 version bump 실행

봇이 자동화하는 영역을 수동으로 건드리면 충돌이 발생합니다.

### 6-1. 메인테이너가 옛날 습관대로 수동 실행

```bash
pnpm changeset:version   # 수동으로 버전 올림
git commit -m "chore: version packages"
git push origin main
```

### 6-2. 결과

```
1. release.yml → .changeset/*.md 소비됨 → publish 모드 → 배포됨 (여기까진 OK)
2. 기존 Version PR이 열려 있었다면 → conflict 발생 ❌ (같은 파일을 수정)
3. 다음 feature PR 머지 시 release.yml이 version 모드로 Version PR rebase 시도 → 실패 가능
```

### 6-3. 복구

```
기존 Version PR 닫기 → 새 changeset이 쌓이면 release.yml이 새로 생성
```

**규칙: 수동 `changeset:version`을 실행하지 않습니다. Version PR 머지로만 릴리스합니다.**

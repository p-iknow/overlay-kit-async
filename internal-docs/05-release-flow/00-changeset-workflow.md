# Changeset 기본 워크플로우

## Changeset이란

Changeset은 **"이 PR이 어떤 버전 변경을 의도하는지"** 를 선언하는 파일입니다.

코드 변경과 버전 의도를 분리함으로써:
- 개발자는 **코드 변경에만** 집중
- 버전 결정은 **changeset 파일**로 명시적으로 관리
- 릴리스 시점은 **메인테이너가 Version PR 머지**로 결정

## Changeset 파일 구조

`pnpm changeset` 실행 시 `.changeset/` 디렉토리에 랜덤 이름의 `.md` 파일이 생성됩니다:

```markdown
# .changeset/funny-dogs-dance.md
---
'overlay-kit-async': minor
---

feat: resolve openAsync on external close with defaultValue option
```

| 구성 요소 | 설명 |
|-----------|------|
| YAML frontmatter | 패키지명 + bump 타입 (`patch` / `minor` / `major`) |
| 본문 | CHANGELOG에 들어갈 설명 텍스트 |

## Bump 타입

| 타입 | 언제 | 버전 변화 예시 |
|------|------|---------------|
| `patch` | 버그 수정, 리팩토링, 문서 수정 | `1.9.0` → `1.9.1` |
| `minor` | 새 기능 추가 (하위 호환) | `1.9.0` → `1.10.0` |
| `major` | Breaking change | `1.9.0` → `2.0.0` |

여러 changeset이 쌓이면 **가장 높은 bump 타입**이 적용됩니다:

```
.changeset/aaa.md → minor
.changeset/bbb.md → patch
.changeset/ccc.md → patch
→ 최종: minor (1.9.0 → 1.10.0)
```

## 프로젝트 설정

### `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.2/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "p-iknow/overlay-kit-async" }],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

| 설정 | 값 | 설명 |
|------|-----|------|
| `changelog` | `@changesets/changelog-github` | CHANGELOG에 PR 링크, 커밋 해시, 작성자 GitHub 프로필 포함 |
| `commit` | `false` | `changeset version` 후 자동 커밋 안 함 (changesets/action이 처리) |
| `access` | `public` | 공개 npm 패키지 |
| `baseBranch` | `main` | 릴리스 대상 브랜치 |

### 루트 `package.json` 스크립트

```json
{
  "scripts": {
    "changeset:version": "pnpm changeset version",
    "changeset:publish": "pnpm changeset publish"
  },
  "devDependencies": {
    "@changesets/changelog-github": "^0.5.2",
    "@changesets/cli": "^2.29.8"
  }
}
```

## CHANGELOG 자동 생성

`changeset version` 실행 시 `packages/CHANGELOG.md`에 엔트리가 자동 추가됩니다:

```markdown
## 1.10.0

### Minor Changes

- [#10](https://github.com/p-iknow/overlay-kit-async/pull/10) [`abc1234`](https://github.com/p-iknow/overlay-kit-async/commit/abc1234) - feat: add new close option

### Patch Changes

- [#11](https://github.com/p-iknow/overlay-kit-async/pull/11) [`def5678`](https://github.com/p-iknow/overlay-kit-async/commit/def5678) Thanks [@developer-a](https://github.com/developer-a)! - fix: handle edge case
```

`@changesets/changelog-github` 플러그인이 GitHub API를 통해 PR 번호, 커밋 해시, 작성자 정보를 자동으로 채웁니다.

## 관련 워크플로우

| 워크플로우 파일 | 역할 |
|----------------|------|
| `.github/workflows/changeset-check.yml` | PR에서 `packages/src/` 변경 시 changeset 파일 필수 체크 |
| `.github/workflows/release.yml` | main push 시 changesets/action 실행 — `.changeset/*.md` 존재 여부로 Version PR 생성(version 모드) 또는 npm publish(publish 모드) 자동 분기 |
| `.github/workflows/publish-comment.yml` | PR 코멘트 `/publish`로 프리뷰 배포 (`x.y.z-prN`) |

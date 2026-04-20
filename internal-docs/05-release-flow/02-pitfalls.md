# 주의사항 및 함정

## 🔴 치명적: GITHUB_TOKEN 캐스케이드 블록

### 문제

GitHub는 **GITHUB_TOKEN으로 만든 커밋이 다른 워크플로우를 트리거하지 못하게** 차단합니다 (무한 루프 방지 정책).

```
changesets/action이 GITHUB_TOKEN으로 Version PR 생성
  → 머지하면 main에 push 발생
  → publish-internal.yml이 트리거되지 않음 ❌
  → 배포가 안 됨
```

### 해결

`changesets/action`에 PAT(Personal Access Token)를 사용합니다:

```yaml
# release.yml
- uses: changesets/action@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GH_ACCESS_TOKEN }}  # PAT 사용
```

이 프로젝트에서는 이미 `secrets.GH_ACCESS_TOKEN`이 설정되어 있으므로 이를 사용합니다.

---

## 🟡 주의: 수동 version bump 충돌

### 문제

봇이 자동으로 Version PR을 관리하는데, 누군가 습관적으로 수동 `pnpm changeset:version`을 실행하면:

```
봇이 Version PR 관리 중 (1.9.0 → 1.10.0)
개발자가 수동으로 changeset:version 실행 (1.9.0 → 1.10.0)
  → 수동 커밋이 먼저 main에 들어감
  → 봇의 Version PR이 conflict 발생
  → CHANGELOG가 꼬임
```

### 해결

**팀 규칙: `pnpm changeset:version`을 수동으로 실행하지 않습니다.**

Version bump은 오직 Version PR 머지로만 수행합니다.

---

## 요약

| 위험도 | 문제 | 해결 |
|--------|------|------|
| 🔴 치명적 | GITHUB_TOKEN으로 배포 트리거 안 됨 | `GH_ACCESS_TOKEN` PAT 사용 |
| 🟡 주의 | 수동 version bump 충돌 | 팀 규칙: 수동 version bump 금지 |

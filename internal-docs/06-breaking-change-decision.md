# openAsync에 Breaking Change 걸까요?

> `openAsync`의 `defaultValue` 관련해서 breaking change를 걸지 말지 의견 나눠보고 싶어서 정리했습니다.

---

## 무슨 문제인지 먼저 짚고 갈게요

`overlay.openAsync()`로 모달을 열고, 사용자가 **backdrop 클릭이나 ESC** 같은 걸로 닫으면 Promise가 영원히 안 끝납니다.

```tsx
const result = await overlay.openAsync<boolean>(({ isOpen, close }) => (
  <Dialog open={isOpen} onConfirm={() => close(true)} onClose={() => close(false)} />
));
// 👆 사용자가 backdrop 클릭하면 이 await가 영원히 안 끝남
// → 뒤에 있는 코드 안 돌아감, 메모리 누수
```

이건 토스 원본에도 있는 버그예요 ([toss/overlay-kit#169](https://github.com/toss/overlay-kit/issues/169)).

우리가 이 문제를 해결하려고 `defaultValue`라는 옵션을 추가해뒀는데요:

```tsx
// defaultValue를 넘기면 → 외부 close 시 null로 resolve됨
const result = await overlay.openAsync<UserSelection | null>(
  ({ isOpen, close }) => <UserPicker open={isOpen} onSelect={(user) => close(user)} />,
  { defaultValue: null }
);

// defaultValue 안 넘기면 → 여전히 pending (토스 원본이랑 똑같이 동작)
const result = await overlay.openAsync<boolean>(
  ({ isOpen, close }) => <Dialog open={isOpen} onConfirm={() => close(true)} />
);
```

**문제는**, `defaultValue`가 optional이라서 이걸 넣어야 한다는 걸 모르면 그냥 당한다는 거예요. TypeScript도 아무 경고를 안 해주고요.

---

## 두 가지 선택지

| | A: 지금 그대로 두기 | B: Breaking Change 걸기 |
|---|---|---|
| **핵심** | `defaultValue`는 optional로 유지 | `defaultValue` 없으면 반환 타입이 `T \| undefined` |
| **toss 호환** | 좋음 | 안 좋음 |
| **개발자 안전** | 알아서 넣어야 함 | TypeScript가 알아서 가이드 |

---

## A. 지금 그대로 두면

```typescript
// 현재 openAsync 시그니처 (두 개의 overload)
function openAsync<T>(controller, options: { defaultValue: T }): Promise<T>;
function openAsync<T>(controller, options?: { overlayId?: string }): Promise<T>;
```

- `defaultValue`를 전달하면 → 외부 close 시 `defaultValue`로 resolve
- `defaultValue`를 전달하지 않으면 → 토스 원본이랑 똑같이 pending

**좋은 점**

- 토스 원본이랑 호환이 돼서, 나중에 토스로 돌아가거나 upstream 변경사항 가져오기 쉬움
- 기존 코드 건드릴 필요 없음
- 새 코드 작성할 때부터 `defaultValue` 쓰면 됨

**아쉬운 점**

- `defaultValue` 안 넣으면 여전히 pending 버그 발생. 이 옵션이 있다는 걸 모르면 그냥 당함
- TypeScript가 아무 경고도 안 해줌 — `defaultValue` 없어도 `Promise<T>`로 멀쩡해 보임
- 결국 코드 리뷰에서 "defaultValue 넣었나요?" 매번 사람이 체크해야 함
- 문서 아무리 잘 써놔도 다 읽진 않잖아요

**이런 일이 생길 수 있어요:**

```tsx
// 새로 온 분이 토스 공식 문서 보고 작성한 코드
const confirmed = await overlay.openAsync<boolean>(({ isOpen, close }) => (
  <ConfirmDialog open={isOpen} onConfirm={() => close(true)} onCancel={() => close(false)} />
));

// 사용자가 backdrop 클릭하면?
// → confirmed가 영원히 안 끝남
// → 뒤에 있는 결제, 폼 제출 같은 로직이 안 돌아감
```

---

## B. Breaking Change를 걸면

`defaultValue` 없이 호출하면 반환 타입이 `T | undefined`로 바뀝니다.

```typescript
// 변경 후 시그니처
function openAsync<T>(controller, options: { defaultValue: T }): Promise<T>;
function openAsync<T>(controller, options?): Promise<T | undefined>;  // 👈 여기가 달라짐
```

기존 코드를 고칠 필요가 없어요. 호출부는 그대로 두면 됩니다. 다만 `result`를 쓰는 쪽에서 TypeScript가 `undefined` 가능성을 알려줘서, 자연스럽게 대응하게 됩니다.

**런타임 동작도 바뀝니다**: `defaultValue` 안 넣어도 외부 close 시 `undefined`로 resolve돼요. 더 이상 pending 안 됨.

### 이런 식으로 쓰게 돼요

```tsx
// 방법 1: defaultValue 넘겨서 타입 좁히기 (권장)
const result = await overlay.openAsync<boolean>(
  ({ isOpen, close }) => <Dialog open={isOpen} onConfirm={() => close(true)} />,
  { defaultValue: false }
);
// result: boolean — 깔끔

// 방법 2: defaultValue 안 넘기면 → T | undefined
const result = await overlay.openAsync<boolean>(
  ({ isOpen, close }) => <Dialog open={isOpen} onConfirm={() => close(true)} />
);
// result: boolean | undefined
// → TypeScript가 "undefined일 수 있어" 하고 알려줌

if (result === undefined) {
  // 외부에서 닫힌 경우
  return;
}
// 여기부턴 result: boolean으로 안전하게 쓸 수 있음
```

### "기존 코드가 안 깨진다면서 왜 breaking change?"

| 뭐가 달라지나 | 설명 |
|---|---|
| **런타임** | 전에는 pending이던 Promise가 이제 `undefined`로 resolve됨 → 동작이 달라짐 |
| **타입** | `Promise<T>` → `Promise<T \| undefined>` → 기존에 result 쓰던 곳에서 타입 에러 날 수 있음 |
| **호출부** | 호출 자체는 그대로인데, result 사용하는 곳에서 `undefined` 체크 필요 |

개발자 입장에서는 두 가지 중 하나만 하면 됩니다:

```tsx
// 선택 1: defaultValue 넘기기 (권장 — 타입이 정확해짐)
const result = await overlay.openAsync<boolean>(ctrl, { defaultValue: false });
// result: boolean

// 선택 2: undefined 체크 추가
const result = await overlay.openAsync<boolean>(ctrl);
if (result === undefined) return;
// result: boolean
```

### 이 방식의 진짜 좋은 점

- **Pending Promise가 사라져요.** `defaultValue` 유무 상관없이 모든 `openAsync`가 항상 resolve됨. 메모리 누수도 없음
- **타입이 정직해요.** 지금은 `Promise<T>`라고 해놓고 실제로는 pending 될 수 있거든요. `Promise<T | undefined>`가 현실에 맞는 타입이에요
- **사람이 안 챙겨도 돼요.** TypeScript가 `undefined` 가능성을 알려주니까, 개발자가 자연스럽게 `defaultValue`를 쓰거나 분기 처리하게 됨

### 아쉬운 점

- **토스 원본이랑 호환 안 됨.** 반환 타입이 달라지니까 나중에 토스로 돌아가기 어려움
- **upstream 변경사항 반영이 좀 귀찮아질 수 있음.** 토스에서 `openAsync` 건드리면 merge conflict 날 수 있음
- **major 버전 올려야 함.** 반환 타입 변경은 semver 기준 breaking change

> 참고로, 우리 내부에 `openAsync` 쓰는 기존 코드가 아직 없어서 **마이그레이션 비용은 0**이에요.
> 처음 쓰는 코드부터 타입 안전하게 시작할 수 있습니다.

---

## 토스 쪽 상황

현재 토스 쪽 상태를 좀 정리해봤어요:

| 항목 | 상태 |
|------|------|
| 원본 이슈 | [#169](https://github.com/toss/overlay-kit/issues/169) — open |
| 첫 번째 PR | [#214](https://github.com/toss/overlay-kit/pull/214) — `onDismiss` 방식, close됨 (머지 안 됨) |
| 두 번째 PR | [#215](https://github.com/toss/overlay-kit/pull/215) — `defaultValue` 방식, open, 1 approval |
| 메인테이너 입장 | "문제에 동의. **breaking change 없이** 해결하겠다" |

메인테이너(jungpaeng)가 이슈 #169에서 이렇게 말했어요:

> "openAsync 만들 때 unmount 없이 close만 하는 게 의도였는데, 지금 문서가 unmount를 쓰도록 안내하고 있으니 Promise가 resolve되는 게 맞다. **breaking change 없이** 어떻게 해결할지 고민해보겠다."

즉, 토스는 `defaultValue`를 **optional로 유지**할 가능성이 높습니다.

### 토스가 앞으로 어떻게 하느냐에 따라

**PR #215를 머지한다면:**
- A: 우리 코드랑 거의 같아져서 upstream으로 돌아갈 수 있음
- B: 우리가 한 단계 더 나간 상태. 돌아가려면 롤백 필요

**다른 방식으로 고친다면:**
- A: 토스 방식을 반영하기 상대적으로 쉬움
- B: 충돌할 수 있어서 merge 작업 필요

**아무것도 안 한다면 (제일 가능성 높음):**
- A: opt-in 솔루션은 있는데, 모르면 당하는 함정 API 문제는 남음
- B: 완전한 솔루션, 개발자 안전도 보장됨

솔직히 PR #215에 1개 approval은 있지만 코어 메인테이너의 최종 결정이 없고, PR #214는 이미 close됐어요. 토스가 이걸 그대로 받아줄지도 모르겠고요. **토스 호환성을 위해 우리 개발자 안전을 계속 양보할 건지**가 핵심 질문인 것 같아요.

---

## 우리가 직접 유지보수할 수 있나?

breaking change를 가져가려면 우리가 이 라이브러리를 직접 잘 관리할 수 있어야 하잖아요. 현재 상태를 보면:

| 항목 | 상태 | 비고 |
|------|------|------|
| 유닛 테스트 | ✅ 9개 전용 테스트 | openAsync + defaultValue 시나리오 완전 커버 |
| 브라우저 테스트 | ✅ React 18/19 각 12개 | Vitest Browser Mode + Playwright |
| 내부 문서 | ✅ 5개 상세 문서 | 문제 분석, 구현, 안전장치, 아키텍처 |
| CI | ✅ | 테스트, 린트, 빌드, ATTW, publint, 예제 빌드+테스트 |
| 릴리스 | ✅ Changesets | 자동 Version PR, GitHub Packages 배포 |
| 아키텍처 이해도 | ✅ | 레이어 구조, 라이프사이클, 의존성 그래프 다 문서화해둠 |

테스트 33개, 문서 5개, CI/CD 파이프라인, 릴리스 자동화 다 갖춰져 있어서 유지보수할 만한 상태라고 생각합니다.

---

## 정리

| 기준 | A: 그대로 두기 | B: Breaking Change |
|------|---|---|
| **개발자 안전** | ⚠️ 알아서 챙겨야 함 | ✅ TypeScript가 `T \| undefined`로 알려줌 |
| **Pending Promise** | ⚠️ 여전히 발생 가능 | ✅ 원천 차단 (항상 resolve) |
| **기존 호출부** | ✅ 변경 없음 | ✅ 호출부 수정 불필요 (타입만 바뀜) |
| **toss 호환** | ✅ 좋음 | ❌ 안 좋음 |
| **마이그레이션** | ✅ 없음 | ✅ 없음 (기존 코드 없으니까) |
| **유지보수** | ⚠️ 코드 리뷰에서 사람이 체크 | ✅ 도구가 강제 |
| **타입 정직성** | ❌ `Promise<T>`인데 실제론 pending 가능 | ✅ `Promise<T \| undefined>`로 현실 반영 |
| **semver** | patch/minor | major |

---

## 8. 영창 의견

**B (Breaking Change)를 거는 게 낫다고 봅니다.**

1. **타입이 거짓말하면 안 된다고 생각해요.** 지금 `Promise<T>`라고 해놓고 실제로는 pending될 수 있는 건 타입이 현실을 반영 못 하는 거예요. `Promise<T | undefined>`가 맞는 타입이에요.

2. **우리 내부에 기존 코드가 없어서 지금이 가장 좋은 타이밍이에요.** 나중에 코드가 쌓이고 나서 바꾸면 진짜 마이그레이션 비용이 생기는데, 지금은 0이에요.

3. **토스 호환성 지키는 실익이 크지 않다고 봐요.** PR이 계속 리뷰 안 되고 있고, 토스가 같은 방향으로 고칠 보장도 없고, 설사 고치더라도 다른 접근법일 수 있어요. "나중에 토스로 돌아가기 쉽게" 하려고 지금 우리 개발자 안전을 양보하는 건 좀 아깝다고 봐요.

4. **라이브러리 관리 체계가 갖춰져 있어요.** 테스트, 문서, CI, 릴리스 다 있어서 자체 유지보수 충분히 가능해요.

### 하기로 하면 이렇게 진행하면 될 것 같아요

1. `defaultValue` 없는 overload의 반환 타입을 `Promise<T>` → `Promise<T | undefined>`로 변경
2. `defaultValue` 안 넘겨도 외부 close 시 `undefined`로 resolve하도록 구현 수정
3. 기존 테스트에서 "defaultValue 미전달 시 pending" 케이스를 "undefined로 resolve" 동작으로 전환
4. changeset에 major bump 등록
5. 마이그레이션 가이드 작성

어떻게 생각하시나요?

---

---

## 결정: B안 채택 ✅

**2026-02-12 — B안 (Breaking Change)으로 구현 완료.**

### 구현 내용

1. ✅ `defaultValue` 없는 overload의 반환 타입을 `Promise<T>` → `Promise<T | undefined>`로 변경
2. ✅ `defaultValue` 안 넘겨도 외부 close 시 `undefined`로 resolve하도록 구현 수정
3. ✅ 기존 테스트에서 "defaultValue 미전달 시 pending" 케이스를 "undefined로 resolve" 동작으로 전환
4. ✅ changeset에 major bump 등록
5. ✅ 마이그레이션 가이드 작성 (changeset에 포함)

### 주요 변경

- **조건부 구독 제거**: `hasDefaultValue` 분기와 `noop` 패턴을 제거하고, 항상 4개 이벤트(`close`, `closeAll`, `unmount`, `unmountAll`)를 구독
- **반환 타입 변경**: `defaultValue` 없이 호출하면 `Promise<T | undefined>` 반환 — TypeScript가 `undefined` 가능성을 알려줌
- **Pending Promise 원천 차단**: 모든 `openAsync` 호출이 항상 resolve됨

### 브랜치

- `feat/open-async-infer-undefined`

---

## 관련 문서

- [문제 분석](./04-fork-rationale/00-problem-analysis.md)
- [subscribeEvent 구현](./04-fork-rationale/01-subscribe-event.md)
- [overload 구조 (B안 반영)](./04-fork-rationale/02-open-async-overloads.md)
- [안전장치](./04-fork-rationale/03-safety-mechanisms.md)
- 토스 이슈: [toss/overlay-kit#169](https://github.com/toss/overlay-kit/issues/169)
- 토스 PR: [toss/overlay-kit#215](https://github.com/toss/overlay-kit/pull/215)

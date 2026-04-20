# overlay-kit-async — 포크

> `toss/overlay-kit`을 포크하여 `overlay-kit-async`로 별도 배포하게 된 배경과, 업스트림 대비 아키텍처 변경점을 설명합니다.

## 왜 별도로 만들었는가

### 배경

`overlay-kit`은 토스에서 만든 오픈소스 라이브러리로, React에서 오버레이(모달, 다이얼로그 등)를 선언적으로 관리할 수 있게 해줍니다. 실무에서 적극적으로 사용하던 중 `overlay.openAsync`에서 **Promise가 영원히 resolve되지 않는** 치명적인 버그를 발견했습니다 ([toss/overlay-kit#169](https://github.com/toss/overlay-kit/issues/169)).

### 오픈소스 기여 시도

이 문제를 해결하기 위해 [toss/overlay-kit#215](https://github.com/toss/overlay-kit/pull/215) PR을 제출했으나, **메인테이너의 리뷰가 이루어지지 않았습니다**.

### 포크 결정

| 이유 | 설명 |
|------|------|
| **리뷰 대기 불가** | 프로덕션 버그를 오픈소스 리뷰 일정에 맞출 수 없음 |
| **타입 안전성 향상** | function overload를 통해 `defaultValue` 유무에 따른 반환 타입 분기 |
| **Pending Promise 원천 차단** | `defaultValue` 없이 호출해도 외부 close 시 `undefined`로 resolve |

`overlay-kit-async`라는 별도 패키지를 만들어 공개 npm에 배포하게 되었습니다.

---

## 업스트림 대비 변경 요약

| 변경 영역 | 업스트림 (`toss/overlay-kit`) | 포크 (`overlay-kit-async`) | 상세 문서 |
|-----------|------------------------------|----------------------------|-----------|
| `openAsync` 외부 close | Promise 영원히 pending | 항상 resolve — `defaultValue` 전달 시 해당 값, 미전달 시 `undefined` | [00-problem-analysis.md](./00-problem-analysis.md) |
| `create-use-external-events.ts` | 반환값 2개 (Hook, 디스패처) | 반환값 3개 (+`subscribeEvent`) | [01-subscribe-event.md](./01-subscribe-event.md) |
| `openAsync` 시그니처 | 단일 시그니처 `Promise<T>` | Function overload — `defaultValue` 전달 시 `Promise<T>`, 미전달 시 `Promise<T \| undefined>` (**Breaking Change**) | [02-open-async-overloads.md](./02-open-async-overloads.md) |
| 안전장치 | 없음 | 이중 resolve 방지, cleanup, 무조건 구독 | [03-safety-mechanisms.md](./03-safety-mechanisms.md) |

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `packages/src/event.ts` | `openAsync` function overload + emitter 구독을 통한 외부 close 해소 |
| `packages/src/utils/create-use-external-events.ts` | `subscribeEvent` 함수 추가 (반환 튜플 3번째 요소) |
| `packages/src/event.test.tsx` | 외부 close 관련 9개 신규 테스트 (객체 타입 + null defaultValue 포함) + 전체 BDD 주석 |

## 사용 예시

```typescript
type UserSelection = { id: number; name: string };

// 방법 1: defaultValue 전달 → Promise<T>, 외부 close 시 null로 resolve
const result = await overlay.openAsync<UserSelection | null>(
  ({ isOpen, close }) => (
    <UserPicker open={isOpen} onSelect={(user) => close(user)} />
  ),
  { defaultValue: null }
);
// result: UserSelection | null
// 사용자 선택 → UserSelection 객체
// 외부 close → null

// 방법 2: defaultValue 미전달 → Promise<T | undefined>, 외부 close 시 undefined로 resolve
const result2 = await overlay.openAsync<boolean>(
  ({ isOpen, close }) => (
    <Dialog open={isOpen} onConfirm={() => close(true)} onClose={() => close(false)} />
  )
);
// result2: boolean | undefined
// 내부 close(true) → true
// 외부 close → undefined (더 이상 pending 안 됨)

if (result2 === undefined) {
  // 외부에서 닫힌 경우 처리
  return;
}
```

## 관련 링크

- 원본 이슈: [toss/overlay-kit#169](https://github.com/toss/overlay-kit/issues/169)
- 업스트림 PR (미리뷰): [toss/overlay-kit#215](https://github.com/toss/overlay-kit/pull/215)
- 패키지 레지스트리: npm (`overlay-kit-async`)

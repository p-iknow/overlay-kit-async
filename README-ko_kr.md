# overlay-kit-async &middot; [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/p-iknow/overlay-kit-async/blob/main/LICENSE)

[English](https://github.com/p-iknow/overlay-kit-async/blob/main/README.md) | 한국어

`overlay-kit-async`는 [toss/overlay-kit](https://github.com/toss/overlay-kit)의 포크로, 오버레이가 외부에서 닫힐 때의 `overlay.openAsync` 동작을 수정한 라이브러리예요. 공개 API와 인터페이스는 업스트림과 **동일하기 때문에**, 드롭인 대체(drop-in replacement)로 사용할 수 있어요.

## 왜 포크했나요?

업스트림 `overlay-kit`에서는 `overlay.close()`, `closeAll()`, `unmount()`, `unmountAll()` 등으로 오버레이가 닫힐 때 `overlay.openAsync`가 **영원히 resolve되지 않아요.** 이로 인해 다음 문제가 발생해요:

- **메모리 누수** — resolve되지 않은 Promise와 그 클로저가 GC되지 않아요.
- **교착 상태의 코드 경로** — `openAsync`를 `await`하는 모든 코드가 멈춰요.
- **예상치 못한 UX** — 페이지 전환이나 전역 "close all" 플로우가 조용히 깨져요.

원본 이슈는 [toss/overlay-kit#169](https://github.com/toss/overlay-kit/issues/169), 머지되지 않은 수정 PR은 [toss/overlay-kit#215](https://github.com/toss/overlay-kit/pull/215)를 참고해주세요.

`overlay-kit-async`는 `openAsync`가 항상 resolve되는 것을 보장해요:

- `defaultValue`가 있을 때 → 외부에서 닫히면 해당 값으로 resolve돼요. 반환 타입은 `Promise<T>`.
- `defaultValue`가 없을 때 → 외부에서 닫히면 `undefined`로 resolve돼요. 반환 타입은 `Promise<T | undefined>`.

## 설치

```sh
npm install overlay-kit-async
```

## 예제

먼저, `OverlayProvider`를 추가해주세요:

```tsx
import { OverlayProvider } from 'overlay-kit-async';

const app = createRoot(document.getElementById('root')!);
app.render(
  <OverlayProvider>
    <App />
  </OverlayProvider>
);
```

### 간단한 오버레이 열기

`overlay.open`을 사용하면 오버레이를 간단하게 열고 닫을 수 있어요.

```tsx
import { overlay } from 'overlay-kit-async';

<Button
  onClick={() => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog open={isOpen} onClose={close} onExit={unmount} />
    ))
  }}
>
  Open
</Button>
```

### 비동기 오버레이 열기

`overlay.openAsync`를 사용하면 오버레이의 결과를 `Promise`로 처리할 수 있어요. 업스트림과 달리, 외부에서 닫혀도 Promise는 **항상 resolve돼요**.

```tsx
import { overlay } from 'overlay-kit-async';

<Button
  onClick={async () => {
    const result = await overlay.openAsync<boolean>(({ isOpen, close, unmount }) => (
      <Dialog
        open={isOpen}
        onConfirm={() => close(true)}
        onClose={() => close(false)}
        onExit={unmount}
      />
    ));

    // result: boolean | undefined
    //   사용자 confirm  → true
    //   사용자 dismiss  → false
    //   외부에서 닫힘   → undefined (pending 상태 아님)
    if (result === undefined) {
      return;
    }
  }}
>
  Open
</Button>
```

null을 허용하지 않는 반환 타입이 필요하면, `defaultValue`를 넘기면 돼요:

```tsx
const result = await overlay.openAsync<boolean>(
  ({ isOpen, close }) => (
    <Dialog open={isOpen} onConfirm={() => close(true)} onClose={() => close(false)} />
  ),
  { defaultValue: false }
);
// result: boolean — 외부에서 닫히면 이제 `undefined` 대신 `false`로 resolve돼요.
```

## 업스트림 호환성

외부로 노출되는 API(`overlay`, `OverlayProvider`, 훅, 타입)는 `toss/overlay-kit`과 **동일해요**. 업스트림에서의 마이그레이션은 대개 아래처럼 import만 바꾸면 돼요:

```diff
- import { overlay, OverlayProvider } from 'overlay-kit';
+ import { overlay, OverlayProvider } from 'overlay-kit-async';
```

유일한 동작상의 차이는 `openAsync`입니다:

| | Upstream | overlay-kit-async |
|---|---|---|
| 내부 `close(value)` | `value`로 resolve | `value`로 resolve |
| 외부 close / closeAll / unmount | **영원히 pending** ❌ | `defaultValue` 또는 `undefined`로 resolve ✅ |
| 반환 타입 (`defaultValue` 없음) | `Promise<T>` | `Promise<T \| undefined>` |

## overlay-kit(과 이 포크)을 사용하는 이유

### 기존 오버레이 관리의 문제점

1. 상태 관리의 복잡성
   - useState나 전역 상태를 사용해 직접 오버레이 상태를 관리해야 했어요.
   - 상태 관리와 UI 로직이 섞여 코드가 복잡해지고 가독성이 떨어졌어요.
2. 이벤트 핸들링의 반복
   - 열기, 닫기, 결과 반환 같은 이벤트 핸들링 코드를 반복해서 작성해야 했어요.
   - 이는 중복 코드를 유발하고 개발 경험을 저하시키는 주요 원인이 되었어요.
3. 재사용성 부족
   - 오버레이에서 값을 반환하려면 callback 함수 등으로 UI와 로직이 강하게 결합되었어요.
   - 이로 인해 컴포넌트를 재사용하기 어려웠어요.

### 목표

1. React 철학을 따르는 설계
   - React는 선언적인 코드를 지향해요.
   - overlay-kit은 오버레이를 선언적으로 관리할 수 있게 도와줘요.
2. 개발 생산성 향상
   - 상태 관리와 이벤트 핸들링을 캡슐화해, 개발자는 UI와 비즈니스 로직에만 집중할 수 있어요.
3. 확장성과 재사용성 강화
   - UI와 동작을 분리하고, Promise를 반환하는 방식으로 오버레이의 재사용성을 높였어요.

## License

MIT © Viva Republica, Inc. (원본) · [@p-iknow](https://github.com/p-iknow)이 포크하고 유지보수해요. 자세한 내용은 [LICENSE](./LICENSE)를 참고하세요.

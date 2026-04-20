# 코어 모듈 상세

각 소스 파일의 역할과 구현을 설명합니다.

## 1. `emitter.ts` — 경량 pub/sub

mitt 라이브러리와 유사한 타입 안전한 이벤트 에미터입니다.

```typescript
export function createEmitter<Events>(all?: EventHandlerMap<Events>): Emitter<Events>
```

- `on(type, handler)` — 핸들러 등록
- `off(type, handler)` — 핸들러 제거 (`>>>0` 으로 not-found 안전 처리)
- `emit(type, event)` — 핸들러들을 `slice()` 복사 후 순회 실행 (실행 중 off 안전)
- `'*'` 와일드카드 타입 지원 — 모든 이벤트를 수신 가능

**중요: 모듈 레벨 싱글턴**

`create-use-external-events.ts`에서 `const emitter = createEmitter()`로 **하나의 인스턴스**가 모듈 스코프에 생성됩니다. 모든 overlay 인스턴스가 이 하나의 emitter를 공유하며, **prefix 기반 네임스페이싱**으로 충돌을 방지합니다.

---

## 2. `create-use-external-events.ts` — 이벤트 브릿지

React와 명령형 코드를 연결하는 핵심 모듈입니다.

```typescript
export function createUseExternalEvents<EventHandlers>(prefix: string)
  → [useExternalEvents, createEvent, subscribeEvent]
```

| 반환값 | 역할 | 호출 위치 |
|--------|------|----------|
| `useExternalEvents(events)` | React Hook — emitter에 핸들러 등록/해제 | `OverlayProvider` 내부 |
| `createEvent(eventKey)` | 이벤트 디스패처 생성 함수 | `event.ts`의 open/close/unmount 등 |
| `subscribeEvent(event, handler)` | React 바깥에서 emitter 이벤트를 구독. unsubscribe 함수 반환 | `event.ts`의 `openAsync` 내부 |

### `subscribeEvent` — 명령형 이벤트 구독

```typescript
function subscribeEvent<EventKey extends keyof EventHandlers>(
  event: EventKey,
  handler: EventHandlers[EventKey]
): () => void
```

React 라이프사이클 바깥에서 emitter 이벤트를 구독할 수 있게 해줍니다. `useExternalEvents`가 React Hook이라 컴포넌트 내부에서만 사용 가능한 것과 달리, `subscribeEvent`는 일반 함수에서 호출 가능합니다.

반환값은 unsubscribe 함수로, 호출하면 해당 리스너가 즉시 해제됩니다. `openAsync`에서 외부 close/unmount 이벤트를 감지하여 Promise를 resolve하는 데 사용됩니다.

**prefix 네임스페이싱**: 각 overlay 인스턴스는 고유 prefix를 갖습니다 (`overlay-kit-abc123/overlay-kit`). 같은 emitter를 공유하더라도 `${prefix}:open`, `${prefix}:close` 형태로 이벤트 키를 구분하여 인스턴스 간 충돌을 방지합니다.

**useClientLayoutEffect**: SSR 환경(`typeof document === 'undefined'`)에서는 `useLayoutEffect`를 실행하지 않는 안전 래퍼입니다.

---

## 3. `event.ts` — 명령형 API 팩토리

`createOverlay(overlayId)`가 사용자에게 노출되는 `overlay` 객체를 생성합니다.

```typescript
export function createOverlay(overlayId: string) → {
  open, openAsync, close, unmount, closeAll, unmountAll, useOverlayEvent
}
```

### 타입 정의

```typescript
type OpenOverlayOptions = {
  overlayId?: string;
};

type OpenAsyncOverlayOptions<T> = OpenOverlayOptions & {
  defaultValue: T;     // 외부 close 시 resolve될 기본값
};
```

### `open(controller, options?)`

1. `overlayId` 생성 (옵션으로 지정 가능, 기본은 `randomId()`)
2. `componentKey` 생성 (React key 용도)
3. `createEvent('open')`으로 디스패처 생성
4. emitter에 `{ controller, overlayId, componentKey }` 발행
5. 생성된 `overlayId` 반환

### `openAsync<T>(controller, options?)` — Function Overloads

두 가지 시그니처를 제공합니다. 둘 다 `Promise<T>`를 반환하며, `defaultValue` 유무에 따라 외부 close 시 동작이 달라집니다:

```typescript
// 시그니처 1: defaultValue 전달 → Promise<T> (항상 resolve)
function openAsync<T>(
  controller: OverlayAsyncControllerComponent<T>,
  options: OpenAsyncOverlayOptions<T>
): Promise<T>;

// 시그니처 2: defaultValue 미전달 → Promise<T> (기존 동작 유지, 외부 close 시 pending)
function openAsync<T>(
  controller: OverlayAsyncControllerComponent<T>,
  options?: OpenOverlayOptions
): Promise<T>;
```

#### 내부 동작

```typescript
return new Promise<T>((_resolve, _reject) => {
  let resolved = false;
  const hasDefaultValue = options != null && 'defaultValue' in options;

  // 1. cleanup: 모든 emitter 구독 해제
  const cleanup = () => { /* unsubscribe all */ };

  // 2. resolve/reject 래퍼: 이중 호출 방지 + 자동 cleanup
  const resolve = (value) => {
    if (resolved) return;
    resolved = true;
    cleanup();
    _resolve(value);
  };

  // 3. subscribeEvent로 외부 close 감지 (hasDefaultValue일 때만)
  const unsubscribeClose = hasDefaultValue
    ? subscribeEvent('close', (id) => { if (id === currentOverlayId) resolve(defaultValue); })
    : noop;
  const unsubscribeCloseAll = hasDefaultValue
    ? subscribeEvent('closeAll', () => resolve(defaultValue))
    : noop;
  // ... unmount, unmountAll도 동일

  // 4. open()에 래핑된 controller 전달
  open((overlayProps) => {
    const close = (param: T) => { resolve(param); overlayProps.close(); };
    const reject = (reason?) => { reject(reason); overlayProps.close(); };
    return controller({ ...overlayProps, close, reject });
  }, { overlayId: currentOverlayId });
});
```

#### 안전장치

| 장치 | 설명 |
|------|------|
| `resolved` 플래그 | 내부 `close(value)`와 외부 close가 동시에 발생해도 Promise 한 번만 settle |
| `cleanup()` | Promise settle 시 모든 emitter 구독 즉시 해제 → 메모리 누수 방지 |
| 조건부 구독 | `hasDefaultValue`가 true일 때만 subscribeEvent 활성화. 기존 동작(defaultValue 없이 호출)에는 영향 없음 |

### `close` / `unmount` / `closeAll` / `unmountAll`

각각 `createEvent('close')` 등으로 생성된 이벤트 디스패처입니다.
호출하면 emitter를 통해 Provider의 `useOverlayEvent`로 전달됩니다.

**참고**: 이 이벤트들은 동시에 `openAsync` 내부의 `subscribeEvent` 리스너에도 전달됩니다 (같은 emitter를 공유하므로). 이것이 외부 close 감지의 핵심 메커니즘입니다.

---

## 4. `reducer.ts` — 상태 관리

### 상태 구조 (`OverlayData`)

```typescript
type OverlayData = {
  current: OverlayId | null;         // 현재 최상위 오버레이
  overlayOrderList: OverlayId[];     // 열린 순서대로 정렬된 ID 목록
  overlayData: Record<OverlayId, OverlayItem>;  // 각 오버레이의 상세 데이터
};

type OverlayItem = {
  id: string;
  componentKey: string;    // React key (리렌더링 제어)
  isOpen: boolean;         // 열림 상태 (CSS transition 제어)
  isMounted: boolean;      // 마운트 완료 여부 (2-phase open 제어)
  controller: OverlayControllerComponent;  // 렌더링할 컴포넌트
};
```

### 액션 (OverlayReducerAction)

| 액션 | 트리거 | 동작 |
|------|--------|------|
| `ADD` | `overlay.open()` | 새 오버레이 추가. `isOpen: false`, `isMounted: false`로 시작. 이미 닫힌 상태로 존재하면 재오픈. 같은 ID로 이미 열려있으면 에러. |
| `OPEN` | `ContentOverlayController`의 `rAF` | `isOpen: true`, `isMounted: true`로 전환. 이미 open이면 무시. |
| `CLOSE` | `close()` 호출 | `isOpen: false`로 전환. DOM에서 제거하지 않음 (애니메이션 유지 가능). `current`를 `determineCurrentOverlayId`로 재계산. |
| `REMOVE` | `unmount()` 호출 | 오버레이를 `overlayData`와 `overlayOrderList`에서 완전 삭제. |
| `CLOSE_ALL` | `overlay.closeAll()` | 모든 오버레이의 `isOpen`을 false로. `current`를 null로. |
| `REMOVE_ALL` | `overlay.unmountAll()` 또는 Provider unmount | 상태를 초기값으로 리셋. |

### `determineCurrentOverlayId`

닫거나 제거할 때 **어떤 오버레이가 current가 되어야 하는지** 결정합니다:

- 마지막 오버레이를 닫으면 → 그 이전 오버레이가 current
- 중간 오버레이를 닫으면 → 마지막 오버레이가 current 유지
- 모두 닫으면 → null

---

## 5. `context/context.ts` — Context 래퍼

```typescript
export function createOverlaySafeContext() → {
  OverlayContextProvider,
  useCurrentOverlay,   // () => overlayState.current
  useOverlayData       // () => overlayState.overlayData
}
```

내부적으로 `createSafeContext`를 사용하여, Provider 없이 Hook을 호출하면 명확한 에러 메시지를 던집니다.

---

## 6. `create-safe-context.ts` — 안전한 Context

```typescript
export function createSafeContext<T>(displayName?) → [Provider, useSafeContext]
```

`NullSymbol`을 기본값으로 사용하여, Context가 Provider 밖에서 소비될 때 `[overlay-kit/OverlayContext]: Provider not found.` 에러를 발생시킵니다. `undefined`나 `null`이 합법적인 값인 경우와 구분하기 위해 Symbol을 사용합니다.

---

## 7. `provider/index.tsx` — 전체 조립

`createOverlayProvider()`가 모든 것을 연결합니다:

```typescript
export function createOverlayProvider() → {
  overlay,             // 명령형 API (event.ts에서 생성)
  OverlayProvider,     // React 컴포넌트
  useCurrentOverlay,   // Hook
  useOverlayData       // Hook
}
```

### OverlayProvider 내부 동작

1. **상태 관리**: `useReducer(overlayReducer, initialState)`
2. **이벤트 수신**: `useOverlayEvent({ open, close, unmount, closeAll, unmountAll })`로 emitter 이벤트를 dispatch로 변환
3. **2-phase open 감지**: `prevOverlayState` ref로 이전 상태를 추적하여, 이미 마운트된 오버레이가 재오픈될 때 `rAF → OPEN` 디스패치
4. **클린업**: Provider unmount 시 `REMOVE_ALL` 디스패치
5. **렌더링**: `overlayOrderList`를 순회하며 `ContentOverlayController` 렌더

```tsx
<OverlayContextProvider value={overlayState}>
  {children}
  {overlayState.overlayOrderList.map((item) => (
    <ContentOverlayController
      key={componentKey}
      isOpen={isOpen}
      controller={Controller}
      overlayId={currentOverlayId}
      overlayDispatch={overlayDispatch}
    />
  ))}
</OverlayContextProvider>
```

---

## 8. `content-overlay-controller.tsx` — 개별 오버레이 렌더링

```typescript
export const ContentOverlayController = memo(({ isOpen, overlayId, overlayDispatch, controller: Controller }) => {
  useEffect(() => {
    requestAnimationFrame(() => {
      overlayDispatch({ type: 'OPEN', overlayId });
    });
  }, []);

  return (
    <Controller
      isOpen={isOpen}
      overlayId={overlayId}
      close={() => overlayDispatch({ type: 'CLOSE', overlayId })}
      unmount={() => overlayDispatch({ type: 'REMOVE', overlayId })}
    />
  );
});
```

**2-phase open 패턴**: 오버레이는 `isOpen: false`로 마운트된 후, `useEffect → rAF → OPEN` 디스패치로 `isOpen: true`가 됩니다. 이렇게 하면 CSS transition/animation이 첫 렌더에서도 정상 동작합니다 (mount → paint → state change → transition trigger).

사용자의 Controller 컴포넌트에 전달되는 props:

| Prop | 타입 | 설명 |
|------|------|------|
| `isOpen` | `boolean` | 열림 상태. CSS transition 제어에 사용 |
| `overlayId` | `string` | 이 오버레이의 고유 ID |
| `close` | `() => void` | `CLOSE` 디스패치 — isOpen을 false로 (DOM 유지) |
| `unmount` | `() => void` | `REMOVE` 디스패치 — DOM에서 완전 제거 |

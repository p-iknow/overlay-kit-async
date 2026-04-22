import {
  type OverlayAsyncControllerProps,
  type OverlayAsyncControllerComponent,
  type OverlayControllerComponent,
} from './context/provider/content-overlay-controller';
import { createUseExternalEvents, promiseWithResolver } from './utils';
import { randomId } from './utils/random-id';

export type OverlayEvent = {
  open: (args: { controller: OverlayControllerComponent; overlayId: string; componentKey: string }) => void;
  close: (overlayId: string) => void;
  unmount: (overlayId: string) => void;
  closeAll: () => void;
  unmountAll: () => void;
};

type OpenOverlayOptions = {
  overlayId?: string;
};

type OpenAsyncOverlayOptions<T> = OpenOverlayOptions & {
  defaultValue: T;
};

type SubscribeOverlayEvent = <K extends keyof OverlayEvent>(event: K, handler: OverlayEvent[K]) => () => void;

function subscribeOverlayEnd<T>(
  subscribe: SubscribeOverlayEvent,
  overlayId: string,
  defaultValue: T | undefined,
  onEnd: (value: T | undefined) => void
): () => void {
  const unsubs = [
    subscribe('close', (closedOverlayId) => {
      if (closedOverlayId === overlayId) onEnd(defaultValue);
    }),
    subscribe('closeAll', () => onEnd(defaultValue)),
    subscribe('unmount', (unmountedOverlayId) => {
      if (unmountedOverlayId === overlayId) onEnd(defaultValue);
    }),
    subscribe('unmountAll', () => onEnd(defaultValue)),
  ];
  return () => unsubs.forEach((u) => u());
}

export function createOverlay(overlayId: string) {
  const [useOverlayEvent, createEvent, subscribeEvent] = createUseExternalEvents<OverlayEvent>(
    `${overlayId}/overlay-kit`
  );

  const open = (controller: OverlayControllerComponent, options?: OpenOverlayOptions) => {
    const overlayId = options?.overlayId ?? randomId();
    const componentKey = randomId();
    const dispatchOpenEvent = createEvent('open');

    dispatchOpenEvent({ controller, overlayId, componentKey });
    return overlayId;
  };

  function openAsync<T>(
    controller: OverlayAsyncControllerComponent<T>,
    options: OpenAsyncOverlayOptions<T>
  ): Promise<T>;
  function openAsync<T>(
    controller: OverlayAsyncControllerComponent<T>,
    options?: OpenOverlayOptions
  ): Promise<T | undefined>;
  function openAsync<T>(
    controller: OverlayAsyncControllerComponent<T>,
    options?: OpenOverlayOptions | OpenAsyncOverlayOptions<T>
  ): Promise<T | undefined> {
    const currentOverlayId = options?.overlayId ?? randomId();
    const hasDefaultValue = options != null && 'defaultValue' in options;
    const defaultValue = hasDefaultValue ? (options as OpenAsyncOverlayOptions<T>).defaultValue : undefined;

    const { promise, resolve, reject } = promiseWithResolver<T | undefined>();
    const cleanup = subscribeOverlayEnd(subscribeEvent, currentOverlayId, defaultValue, resolve);

    open(
      (overlayProps, ...deprecatedLegacyContext) => {
        const props: OverlayAsyncControllerProps<T> = {
          ...overlayProps,
          close: (param: T) => {
            resolve(param);
            overlayProps.close();
          },
          reject: (reason?: unknown) => {
            reject(reason);
            overlayProps.close();
          },
        };
        return controller(props, ...deprecatedLegacyContext);
      },
      { overlayId: currentOverlayId }
    );

    return promise.finally(cleanup);
  }

  const close = createEvent('close');
  const unmount = createEvent('unmount');
  const closeAll = createEvent('closeAll');
  const unmountAll = createEvent('unmountAll');

  return { open, openAsync, close, unmount, closeAll, unmountAll, useOverlayEvent };
}

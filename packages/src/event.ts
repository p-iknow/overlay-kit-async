import {
  type OverlayAsyncControllerProps,
  type OverlayAsyncControllerComponent,
  type OverlayControllerComponent,
} from './context/provider/content-overlay-controller';
import { createUseExternalEvents } from './utils';
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
  function openAsync<T>(controller: OverlayAsyncControllerComponent<T>, options?: OpenOverlayOptions): Promise<T>;
  function openAsync<T>(
    controller: OverlayAsyncControllerComponent<T>,
    options?: OpenOverlayOptions | OpenAsyncOverlayOptions<T>
  ): Promise<T> {
    return new Promise<T>((_resolve, _reject) => {
      let resolved = false;
      const hasDefaultValue = options != null && 'defaultValue' in options;

      const cleanup = () => {
        unsubscribeClose();
        unsubscribeCloseAll();
        unsubscribeUnmount();
        unsubscribeUnmountAll();
      };

      const resolve = (value: T) => {
        if (resolved) {
          return;
        }
        resolved = true;
        cleanup();
        _resolve(value);
      };

      const reject = (reason?: unknown) => {
        if (resolved) {
          return;
        }
        resolved = true;
        cleanup();
        _reject(reason);
      };

      const currentOverlayId = options?.overlayId ?? randomId();
      const defaultValue = hasDefaultValue ? (options as OpenAsyncOverlayOptions<T>).defaultValue : undefined;

      const noop = () => {};
      const unsubscribeClose = hasDefaultValue
        ? subscribeEvent('close', (closedOverlayId: string) => {
            if (closedOverlayId === currentOverlayId) {
              resolve(defaultValue as T);
            }
          })
        : noop;

      const unsubscribeCloseAll = hasDefaultValue
        ? subscribeEvent('closeAll', () => {
            resolve(defaultValue as T);
          })
        : noop;

      const unsubscribeUnmount = hasDefaultValue
        ? subscribeEvent('unmount', (unmountedOverlayId: string) => {
            if (unmountedOverlayId === currentOverlayId) {
              resolve(defaultValue as T);
            }
          })
        : noop;

      const unsubscribeUnmountAll = hasDefaultValue
        ? subscribeEvent('unmountAll', () => {
            resolve(defaultValue as T);
          })
        : noop;

      open(
        (overlayProps, ...deprecatedLegacyContext) => {
          const close = (param: T) => {
            resolve(param);
            overlayProps.close();
          };

          const props: OverlayAsyncControllerProps<T> = {
            ...overlayProps,
            close,
            reject: (reason?: unknown) => {
              reject(reason);
              overlayProps.close();
            },
          };
          return controller(props, ...deprecatedLegacyContext);
        },
        { overlayId: currentOverlayId }
      );
    });
  }

  const close = createEvent('close');
  const unmount = createEvent('unmount');
  const closeAll = createEvent('closeAll');
  const unmountAll = createEvent('unmountAll');

  return { open, openAsync, close, unmount, closeAll, unmountAll, useOverlayEvent };
}

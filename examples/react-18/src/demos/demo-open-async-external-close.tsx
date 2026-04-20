import { overlay } from 'overlay-kit';
import { useState } from 'react';
import { AlertDialogModal } from '../components/alert-dialog';
import { DemoSection } from '../components/demo-section';

const BUTTON_PRIMARY =
  'rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700';
const BUTTON_OUTLINE = 'rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100';

type DialogResult = { confirmed: boolean };

export function DemoOpenAsyncWithoutDefaultValue() {
  const [result, setResult] = useState<string>('No action yet');
  const overlayId = 'no-default-overlay';

  return (
    <DemoSection title="openAsync without defaultValue (외부 close → undefined)">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className={BUTTON_PRIMARY}
          onClick={async () => {
            setResult('Waiting...');
            const value = await overlay.openAsync<DialogResult>(
              ({ isOpen, close, unmount }) => (
                <AlertDialogModal
                  isOpen={isOpen}
                  onClose={() => overlay.close(overlayId)}
                  onExited={unmount}
                  title="Delete? (no defaultValue)"
                  description="외부 close 시 undefined로 resolve됩니다."
                  onConfirm={() => close({ confirmed: true })}
                  onCancel={() => close({ confirmed: false })}
                >
                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                    <button type="button" className={BUTTON_OUTLINE} onClick={() => overlay.close(overlayId)}>
                      close (no defaultValue)
                    </button>
                    <button type="button" className={BUTTON_OUTLINE} onClick={() => overlay.unmount(overlayId)}>
                      unmount (no defaultValue)
                    </button>
                    <button type="button" className={BUTTON_OUTLINE} onClick={() => overlay.closeAll()}>
                      closeAll (no defaultValue)
                    </button>
                    <button type="button" className={BUTTON_OUTLINE} onClick={() => overlay.unmountAll()}>
                      unmountAll (no defaultValue)
                    </button>
                  </div>
                </AlertDialogModal>
              ),
              { overlayId }
            );
            setResult(`Resolved: ${JSON.stringify(value)}`);
          }}
        >
          open (no defaultValue)
        </button>
        <span className="text-sm text-gray-600">
          Result: <strong>{result}</strong>
        </span>
      </div>
    </DemoSection>
  );
}

export function DemoOpenAsyncWithDefaultValue() {
  const [result, setResult] = useState<string>('No action yet');
  const overlayId = 'with-default-overlay';

  return (
    <DemoSection title="openAsync with defaultValue (외부 close → resolve)">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className={BUTTON_PRIMARY}
          onClick={async () => {
            setResult('Waiting...');
            const value = await overlay.openAsync<DialogResult | null>(
              ({ isOpen, close, unmount }) => (
                <AlertDialogModal
                  isOpen={isOpen}
                  onClose={() => overlay.close(overlayId)}
                  onExited={unmount}
                  title="Delete? (with defaultValue)"
                  description="외부 close 시 defaultValue(null)로 resolve됩니다."
                  onConfirm={() => close({ confirmed: true })}
                  onCancel={() => close({ confirmed: false })}
                >
                  <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                    <button type="button" className={BUTTON_OUTLINE} onClick={() => overlay.close(overlayId)}>
                      close (with defaultValue)
                    </button>
                    <button type="button" className={BUTTON_OUTLINE} onClick={() => overlay.unmount(overlayId)}>
                      unmount (with defaultValue)
                    </button>
                    <button type="button" className={BUTTON_OUTLINE} onClick={() => overlay.closeAll()}>
                      closeAll (with defaultValue)
                    </button>
                    <button type="button" className={BUTTON_OUTLINE} onClick={() => overlay.unmountAll()}>
                      unmountAll (with defaultValue)
                    </button>
                  </div>
                </AlertDialogModal>
              ),
              { overlayId, defaultValue: null }
            );
            setResult(`Resolved: ${JSON.stringify(value)}`);
          }}
        >
          open (with defaultValue)
        </button>
        <span className="text-sm text-gray-600">
          Result: <strong>{result}</strong>
        </span>
      </div>
    </DemoSection>
  );
}

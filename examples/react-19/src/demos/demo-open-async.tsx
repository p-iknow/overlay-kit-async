import { overlay } from 'overlay-kit';
import { useState } from 'react';
import { AlertDialogModal } from '../components/alert-dialog';
import { DemoSection } from '../components/demo-section';

type DialogResult = { confirmed: boolean };

export function DemoAlertDialogWithOpenAsync() {
  const [result, setResult] = useState<string>('No result yet');

  return (
    <DemoSection title="AlertDialog with overlay.openAsync">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          onClick={async () => {
            const value = await overlay.openAsync<DialogResult>(
              ({ isOpen, close, unmount }) => {
                return (
                  <AlertDialogModal
                    isOpen={isOpen}
                    onClose={() => close({ confirmed: false })}
                    onExited={unmount}
                    title="Delete this item?"
                    description="This action cannot be undone."
                    onConfirm={() => close({ confirmed: true })}
                    onCancel={() => close({ confirmed: false })}
                  />
                );
              },
              { defaultValue: { confirmed: false } }
            );

            setResult(value.confirmed ? 'Confirmed!' : 'Cancelled');
          }}
        >
          open alert dialog (openAsync)
        </button>
        <span className="text-sm text-gray-600">
          Result: <strong>{result}</strong>
        </span>
      </div>
    </DemoSection>
  );
}

import { overlay } from 'overlay-kit';
import { useState } from 'react';
import { AlertDialogModal } from '../components/alert-dialog';
import { DemoSection } from '../components/demo-section';

export function DemoAlertDialogWithState() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DemoSection title="AlertDialog with useState">
      <button
        type="button"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        onClick={() => setIsOpen(true)}
      >
        open alert dialog (useState)
      </button>
      <AlertDialogModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Discard changes?"
        description="You can't undo this action."
      />
    </DemoSection>
  );
}

export function DemoAlertDialogWithOverlay() {
  return (
    <DemoSection title="AlertDialog with overlay.open">
      <button
        type="button"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        onClick={() => {
          overlay.open(({ isOpen, close, unmount }) => {
            return (
              <AlertDialogModal
                isOpen={isOpen}
                onClose={close}
                onExited={unmount}
                title="Discard changes?"
                description="You can't undo this action."
              />
            );
          });
        }}
      >
        open alert dialog (overlay-kit)
      </button>
    </DemoSection>
  );
}

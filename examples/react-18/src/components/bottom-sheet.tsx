import { Dialog } from '@base-ui/react/dialog';
import { type ReactNode, useRef } from 'react';

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  onExited?: () => void;
  title: string;
  children: ReactNode;
};

export function BottomSheet({ isOpen, onClose, onExited, title, children }: BottomSheetProps) {
  const hasOpenedRef = useRef(false);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (open === false) {
          onClose();
        }
      }}
      onOpenChangeComplete={(open: boolean) => {
        if (open === true) {
          hasOpenedRef.current = true;
        }

        if (open === false && hasOpenedRef.current === true) {
          onExited?.();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed bottom-0 left-0 right-0 w-full rounded-t-2xl bg-white p-6 pb-8 shadow-xl transition-all duration-300 ease-out data-[starting-style]:translate-y-full data-[starting-style]:opacity-0 data-[ending-style]:translate-y-full data-[ending-style]:opacity-0">
          <div className="relative mx-auto w-full max-w-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />
            <Dialog.Close className="absolute right-0 top-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
              <span aria-hidden="true">✕</span>
              <span className="sr-only">Close</span>
            </Dialog.Close>
            <Dialog.Title className="pr-10 text-xl font-semibold text-gray-900">{title}</Dialog.Title>
            <div className="mt-4 space-y-4 text-gray-700">{children}</div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

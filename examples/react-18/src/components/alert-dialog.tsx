import { AlertDialog } from '@base-ui/react/alert-dialog';
import { type ReactNode, useRef } from 'react';

type AlertDialogModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onExited?: () => void;
  title: string;
  description: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: ReactNode;
};

export function AlertDialogModal({
  isOpen,
  onClose,
  onExited,
  title,
  description,
  onConfirm,
  onCancel,
  children,
}: AlertDialogModalProps) {
  const confirmLabel = title.startsWith('Delete') ? 'Delete' : 'Discard';
  const hasOpenedRef = useRef(false);

  return (
    <AlertDialog.Root
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
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-black/50 transition-opacity duration-200 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl transition-all duration-200 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
          <div className="space-y-2">
            <AlertDialog.Title className="text-xl font-semibold text-gray-900">{title}</AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-gray-600">{description}</AlertDialog.Description>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Close
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              onClick={() => onCancel?.()}
            >
              Cancel
            </AlertDialog.Close>
            <AlertDialog.Close
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              onClick={() => onConfirm?.()}
            >
              {confirmLabel}
            </AlertDialog.Close>
          </div>
          {children}
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

import { overlay } from 'overlay-kit';
import { AlertDialogModal } from '../components/alert-dialog';
import { BottomSheet } from '../components/bottom-sheet';
import { DemoSection } from '../components/demo-section';

export function DemoCloseByOverlayId() {
  return (
    <DemoSection title="Close by overlayId">
      <button
        type="button"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        onClick={() => {
          overlay.open(({ isOpen, overlayId, unmount }) => {
            return (
              <BottomSheet
                isOpen={isOpen}
                onClose={() => overlay.close(overlayId)}
                onExited={unmount}
                title="Close by ID"
              >
                <p className="text-sm text-gray-600">This overlay will be closed using its overlayId.</p>
                <button
                  type="button"
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  onClick={() => overlay.close(overlayId)}
                >
                  close with overlayId
                </button>
              </BottomSheet>
            );
          });
        }}
      >
        open overlay (close by overlayId)
      </button>
    </DemoSection>
  );
}

export function DemoCloseAll() {
  return (
    <DemoSection title="Close all overlays">
      <button
        type="button"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        onClick={() => {
          overlay.open(({ isOpen, close, unmount }) => {
            return (
              <BottomSheet isOpen={isOpen} onClose={close} onExited={unmount} title="Overlay 1">
                <p className="text-sm text-gray-600">First overlay</p>
              </BottomSheet>
            );
          });
          overlay.open(({ isOpen, close, unmount }) => {
            return (
              <BottomSheet isOpen={isOpen} onClose={close} onExited={unmount} title="Overlay 2">
                <p className="text-sm text-gray-600">Second overlay</p>
                <button
                  type="button"
                  className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                  onClick={() => overlay.closeAll()}
                >
                  close all
                </button>
              </BottomSheet>
            );
          });
        }}
      >
        open two overlays
      </button>
    </DemoSection>
  );
}

export function DemoStackedOverlays() {
  return (
    <DemoSection title="Stacked overlays with overlay.open">
      <button
        type="button"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        onClick={() => {
          overlay.open(({ isOpen, close, unmount }) => {
            return (
              <BottomSheet isOpen={isOpen} onClose={close} onExited={unmount} title="Item Details">
                <p className="text-sm text-gray-600">This bottom sheet stays open behind the alert dialog.</p>
                <button
                  type="button"
                  className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                  onClick={() => {
                    overlay.open(({ isOpen: isAlertOpen, close: closeAlert, unmount: unmountAlert }) => {
                      return (
                        <AlertDialogModal
                          isOpen={isAlertOpen}
                          onClose={closeAlert}
                          onExited={unmountAlert}
                          title="Delete this item?"
                          description="This action cannot be undone."
                        />
                      );
                    });
                  }}
                >
                  Delete item
                </button>
              </BottomSheet>
            );
          });
        }}
      >
        open bottom sheet (stacked overlays)
      </button>
    </DemoSection>
  );
}

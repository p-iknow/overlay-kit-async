import { OverlayProvider } from 'overlay-kit';
import { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { DemoCloseByOverlayId, DemoCloseAll, DemoStackedOverlays } from './demo-overlay-control';

function renderWithProvider(ui: ReactElement) {
  return render(<OverlayProvider>{ui}</OverlayProvider>);
}

describe('DemoOverlayControl', () => {
  it('closes overlay using overlayId', async () => {
    // Given: overlayId로 닫기 데모가 렌더링되어 있다
    renderWithProvider(<DemoCloseByOverlayId />);

    // When: overlayId로 닫기 방식의 버튼을 클릭한다
    await page.getByRole('button', { name: 'open overlay (close by overlayId)' }).click();

    // Then: bottom sheet가 표시된다
    await expect.element(page.getByText('Close by ID')).toBeVisible();

    // When: overlayId로 닫기 버튼을 클릭한다
    (page.getByRole('button', { name: 'close with overlayId' }).element() as HTMLElement).click();

    // Then: overlay가 사라진다
    await expect.element(page.getByText('Close by ID')).not.toBeInTheDocument();
  });

  it('closes all overlays with overlay.closeAll', async () => {
    // Given: closeAll 데모가 렌더링되어 있다
    renderWithProvider(<DemoCloseAll />);

    // When: 두 개의 overlay를 동시에 연다
    await page.getByRole('button', { name: 'open two overlays' }).click();

    // Then: 두 overlay 모두 표시된다
    await expect.element(page.getByText('First overlay')).toBeInTheDocument();
    await expect.element(page.getByText('Second overlay')).toBeInTheDocument();

    // When: 두 번째 overlay 안의 close all 버튼을 클릭한다
    (page.getByText('close all', { exact: true }).element() as HTMLElement).click();

    // Then: 모든 overlay가 사라진다
    await expect.element(page.getByText('First overlay')).not.toBeInTheDocument();
    await expect.element(page.getByText('Second overlay')).not.toBeInTheDocument();
  });

  it('stacks bottom sheet and alert dialog overlays', async () => {
    // Given: stacked overlays 데모가 렌더링되어 있다
    renderWithProvider(<DemoStackedOverlays />);

    // When: stacked overlays 방식의 bottom sheet 열기 버튼을 클릭한다
    await page.getByRole('button', { name: 'open bottom sheet (stacked overlays)' }).click();

    // Then: bottom sheet가 표시된다
    await expect.element(page.getByText('Item Details')).toBeVisible();

    // When: bottom sheet 위에서 Delete item 버튼을 클릭한다
    (page.getByRole('button', { name: 'Delete item' }).element() as HTMLElement).click();

    // Then: bottom sheet 위에 alert dialog가 겹쳐서 표시된다
    await expect.element(page.getByText('Item Details')).toBeVisible();
    await expect.element(page.getByText('Delete this item?')).toBeVisible();

    // When: alert dialog의 Cancel 버튼을 클릭한다
    (page.getByRole('button', { name: 'Cancel' }).element() as HTMLElement).click();

    // Then: alert dialog만 사라지고, bottom sheet는 그대로 유지된다
    await expect.element(page.getByText('Delete this item?')).not.toBeInTheDocument();
    await expect.element(page.getByText('Item Details')).toBeVisible();

    // When: bottom sheet의 Close 버튼을 클릭한다
    (page.getByRole('button', { name: 'Close' }).element() as HTMLElement).click();

    // Then: bottom sheet도 완전히 사라진다
    await expect.element(page.getByText('Item Details')).not.toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Delete item' })).not.toBeInTheDocument();
  });
});

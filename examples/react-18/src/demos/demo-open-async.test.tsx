import { OverlayProvider } from 'overlay-kit';
import { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { DemoAlertDialogWithOpenAsync } from './demo-open-async';

function renderWithProvider(ui: ReactElement) {
  return render(<OverlayProvider>{ui}</OverlayProvider>);
}

describe('DemoOpenAsync', () => {
  it('confirm → resolves with { confirmed: true }', async () => {
    // Given: openAsync 방식의 데모가 렌더링되어 있다
    renderWithProvider(<DemoAlertDialogWithOpenAsync />);

    // Then: 초기 상태에서 결과가 "No result yet"이다
    await expect.element(page.getByText('No result yet')).toBeVisible();

    // When: openAsync 방식의 alert dialog 열기 버튼을 클릭한다
    await page.getByRole('button', { name: 'open alert dialog (openAsync)' }).click();

    // Then: 다이얼로그가 표시된다
    await expect.element(page.getByText('Delete this item?')).toBeVisible();

    // When: Delete 버튼을 클릭하여 confirm한다
    (page.getByRole('button', { name: 'Delete' }).element() as HTMLElement).click();

    // Then: 다이얼로그가 사라지고, 결과가 "Confirmed!"로 표시된다
    await expect.element(page.getByText('Delete this item?')).not.toBeInTheDocument();
    await expect.element(page.getByText('Confirmed!')).toBeVisible();
  });

  it('cancel → resolves with { confirmed: false }', async () => {
    // Given: openAsync 방식의 데모가 렌더링되어 있다
    renderWithProvider(<DemoAlertDialogWithOpenAsync />);

    // When: openAsync 방식의 alert dialog 열기 버튼을 클릭한다
    await page.getByRole('button', { name: 'open alert dialog (openAsync)' }).click();

    // Then: 다이얼로그가 표시된다
    await expect.element(page.getByText('Delete this item?')).toBeVisible();

    // When: Cancel 버튼을 클릭한다
    (page.getByRole('button', { name: 'Cancel' }).element() as HTMLElement).click();

    // Then: 다이얼로그가 사라지고, 결과가 "Cancelled"로 표시된다
    await expect.element(page.getByText('Delete this item?')).not.toBeInTheDocument();
    await expect.element(page.getByText('Cancelled')).toBeVisible();
  });
});

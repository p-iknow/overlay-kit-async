import { OverlayProvider } from 'overlay-kit';
import { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { DemoAlertDialogWithState, DemoAlertDialogWithOverlay } from './demo-basic';

function renderWithProvider(ui: ReactElement) {
  return render(<OverlayProvider>{ui}</OverlayProvider>);
}

describe('DemoBasic', () => {
  it('opens and closes alert dialog with useState', async () => {
    // Given: useState 방식의 AlertDialog 데모가 렌더링되어 있다
    renderWithProvider(<DemoAlertDialogWithState />);

    // When: alert dialog 열기 버튼을 클릭한다
    await page.getByRole('button', { name: 'open alert dialog (useState)' }).click();

    // Then: 다이얼로그가 표시된다
    await expect.element(page.getByText('Discard changes?').first()).toBeVisible();

    // When: Cancel 버튼을 클릭한다
    (page.getByRole('button', { name: 'Cancel' }).element() as HTMLElement).click();

    // Then: 다이얼로그가 사라진다
    await expect.element(page.getByText('Discard changes?').first()).not.toBeInTheDocument();
  });

  it('opens and closes alert dialog with overlay.open', async () => {
    // Given: overlay.open 방식의 AlertDialog 데모가 렌더링되어 있다
    renderWithProvider(<DemoAlertDialogWithOverlay />);

    // When: overlay-kit 방식의 alert dialog 열기 버튼을 클릭한다
    await page.getByRole('button', { name: 'open alert dialog (overlay-kit)' }).click();

    // Then: 다이얼로그가 표시된다
    await expect.element(page.getByText('Discard changes?').first()).toBeVisible();

    // When: Cancel 버튼을 클릭한다
    (page.getByRole('button', { name: 'Cancel' }).element() as HTMLElement).click();

    // Then: 다이얼로그가 사라진다
    await expect.element(page.getByText('Discard changes?').first()).not.toBeInTheDocument();
  });
});

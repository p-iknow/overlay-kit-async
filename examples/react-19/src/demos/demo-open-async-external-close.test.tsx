import { OverlayProvider } from 'overlay-kit';
import { type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { DemoOpenAsyncWithoutDefaultValue, DemoOpenAsyncWithDefaultValue } from './demo-open-async-external-close';

function renderWithProvider(ui: ReactElement) {
  return render(<OverlayProvider>{ui}</OverlayProvider>);
}

describe('DemoOpenAsyncExternalClose', () => {
  describe('without defaultValue', () => {
    it('external close → Promise resolves with undefined', async () => {
      // Given: defaultValue 없는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithoutDefaultValue />);
      await expect.element(page.getByText('No action yet')).toBeVisible();

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (no defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (no defaultValue)')).toBeVisible();
      await expect.element(page.getByText('Waiting...')).toBeVisible();

      // When: 모달 내부의 close 버튼을 클릭한다
      (page.getByRole('button', { name: 'close (no defaultValue)' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 사라지고, Promise가 undefined로 resolve된다
      await expect.element(page.getByText('Delete? (no defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: undefined')).toBeVisible();
    });

    it('external unmount → Promise resolves with undefined', async () => {
      // Given: defaultValue 없는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithoutDefaultValue />);

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (no defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (no defaultValue)')).toBeVisible();

      // When: 모달 내부의 unmount 버튼을 클릭한다
      (page.getByRole('button', { name: 'unmount (no defaultValue)' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 즉시 사라지고, Promise가 undefined로 resolve된다
      await expect.element(page.getByText('Delete? (no defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: undefined')).toBeVisible();
    });

    it('external closeAll → Promise resolves with undefined', async () => {
      // Given: defaultValue 없는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithoutDefaultValue />);

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (no defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (no defaultValue)')).toBeVisible();

      // When: 모달 내부의 closeAll 버튼을 클릭한다
      (page.getByRole('button', { name: 'closeAll (no defaultValue)' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 사라지고, Promise가 undefined로 resolve된다
      await expect.element(page.getByText('Delete? (no defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: undefined')).toBeVisible();
    });

    it('external unmountAll → Promise resolves with undefined', async () => {
      // Given: defaultValue 없는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithoutDefaultValue />);

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (no defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (no defaultValue)')).toBeVisible();

      // When: 모달 내부의 unmountAll 버튼을 클릭한다
      (page.getByRole('button', { name: 'unmountAll (no defaultValue)' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 즉시 사라지고, Promise가 undefined로 resolve된다
      await expect.element(page.getByText('Delete? (no defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: undefined')).toBeVisible();
    });

    it('internal confirm → Promise resolves with { confirmed: true }', async () => {
      // Given: defaultValue 없는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithoutDefaultValue />);

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (no defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (no defaultValue)')).toBeVisible();

      // When: 내부 Delete 버튼을 클릭하여 confirm한다
      (page.getByRole('button', { name: 'Delete' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 사라지고, Promise가 { confirmed: true }로 resolve된다
      await expect.element(page.getByText('Delete? (no defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: {"confirmed":true}')).toBeVisible();
    });

    it('internal cancel → Promise resolves with { confirmed: false }', async () => {
      // Given: defaultValue 없는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithoutDefaultValue />);

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (no defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (no defaultValue)')).toBeVisible();

      // When: Cancel 버튼을 클릭한다
      (page.getByRole('button', { name: 'Cancel' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 사라지고, Promise가 { confirmed: false }로 resolve된다
      await expect.element(page.getByText('Delete? (no defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: {"confirmed":false}')).toBeVisible();
    });
  });

  describe('with defaultValue', () => {
    it('external close → Promise resolves with null', async () => {
      // Given: defaultValue가 있는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithDefaultValue />);
      await expect.element(page.getByText('No action yet')).toBeVisible();

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (with defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (with defaultValue)')).toBeVisible();
      await expect.element(page.getByText('Waiting...')).toBeVisible();

      // When: 모달 내부의 close 버튼을 클릭한다
      (page.getByRole('button', { name: 'close (with defaultValue)' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 사라지고, Promise가 null로 resolve된다
      await expect.element(page.getByText('Delete? (with defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: null')).toBeVisible();
    });

    it('external unmount → Promise resolves with null', async () => {
      // Given: defaultValue가 있는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithDefaultValue />);

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (with defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (with defaultValue)')).toBeVisible();

      // When: 모달 내부의 unmount 버튼을 클릭한다
      (page.getByRole('button', { name: 'unmount (with defaultValue)' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 즉시 사라지고, Promise가 null로 resolve된다
      await expect.element(page.getByText('Delete? (with defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: null')).toBeVisible();
    });

    it('external closeAll → Promise resolves with null', async () => {
      // Given: defaultValue가 있는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithDefaultValue />);

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (with defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (with defaultValue)')).toBeVisible();

      // When: 모달 내부의 closeAll 버튼을 클릭한다
      (page.getByRole('button', { name: 'closeAll (with defaultValue)' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 사라지고, Promise가 null로 resolve된다
      await expect.element(page.getByText('Delete? (with defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: null')).toBeVisible();
    });

    it('external unmountAll → Promise resolves with null', async () => {
      // Given: defaultValue가 있는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithDefaultValue />);

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (with defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (with defaultValue)')).toBeVisible();

      // When: 모달 내부의 unmountAll 버튼을 클릭한다
      (page.getByRole('button', { name: 'unmountAll (with defaultValue)' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 즉시 사라지고, Promise가 null로 resolve된다
      await expect.element(page.getByText('Delete? (with defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: null')).toBeVisible();
    });

    it('internal confirm → Promise resolves with { confirmed: true }', async () => {
      // Given: defaultValue가 있는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithDefaultValue />);

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (with defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (with defaultValue)')).toBeVisible();

      // When: 내부 Delete 버튼을 클릭하여 confirm한다
      (page.getByRole('button', { name: 'Delete' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 사라지고, Promise가 { confirmed: true }로 resolve된다
      await expect.element(page.getByText('Delete? (with defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: {"confirmed":true}')).toBeVisible();
    });

    it('internal cancel → Promise resolves with { confirmed: false }', async () => {
      // Given: defaultValue가 있는 openAsync 데모가 렌더링되어 있다
      renderWithProvider(<DemoOpenAsyncWithDefaultValue />);

      // When: overlay를 열고
      await page.getByRole('button', { name: 'open (with defaultValue)' }).click();
      await expect.element(page.getByText('Delete? (with defaultValue)')).toBeVisible();

      // When: Cancel 버튼을 클릭한다
      (page.getByRole('button', { name: 'Cancel' }).element() as HTMLElement).click();

      // Then: 다이얼로그가 사라지고, Promise가 { confirmed: false }로 resolve된다
      await expect.element(page.getByText('Delete? (with defaultValue)')).not.toBeInTheDocument();
      await expect.element(page.getByText('Resolved: {"confirmed":false}')).toBeVisible();
    });
  });
});

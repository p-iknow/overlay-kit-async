import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useEffect, type PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { OverlayProvider, overlay, useCurrentOverlay, useOverlayData } from './utils/create-overlay-context';

function wrapper({ children }: PropsWithChildren) {
  return <OverlayProvider>{children}</OverlayProvider>;
}

/**
 *
 * @description Utility functions to perform render and userEvent.setup
 */
function renderWithUser<T extends React.JSX.Element>(component: T, options?: Parameters<typeof render>[1]) {
  const user = userEvent.setup();

  return { ...render(component, { wrapper, ...options }), user };
}

describe('overlay object', () => {
  it('should be able to close an open overlay using overlay.unmount', async () => {
    // given: an overlay is opened with a button that calls overlay.unmount on click
    const overlayDialogContent = 'context-modal-overlay-dialog-content';

    function Component() {
      useEffect(() => {
        overlay.open(({ isOpen, overlayId }) => {
          return isOpen && <button onClick={() => overlay.unmount(overlayId)}>{overlayDialogContent}</button>;
        });
      }, []);

      return <div>Empty</div>;
    }

    const { user } = renderWithUser(<Component />);

    // when: user clicks the overlay button to unmount
    await user.click(await screen.findByRole('button', { name: overlayDialogContent }));

    // then: the overlay is removed from the DOM
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: overlayDialogContent })).not.toBeInTheDocument();
    });
  });

  it('should be able to open multiple overlays via overlay.open', async () => {
    // given: a component that opens 4 overlays on mount
    const testContent1 = 'context-modal-test-content-1';
    const testContent2 = 'context-modal-test-content-2';
    const testContent3 = 'context-modal-test-content-3';
    const testContent4 = 'context-modal-test-content-4';

    function Component() {
      useEffect(() => {
        overlay.open(({ isOpen }) => {
          return isOpen && <p>{testContent1}</p>;
        });
        overlay.open(({ isOpen }) => {
          return isOpen && <p>{testContent2}</p>;
        });
        overlay.open(({ isOpen }) => {
          return isOpen && <p>{testContent3}</p>;
        });
        overlay.open(({ isOpen }) => {
          return isOpen && <p>{testContent4}</p>;
        });
      }, []);

      return <div>Empty</div>;
    }

    // when: the component is rendered
    render(<Component />, { wrapper });

    // then: all 4 overlays are visible in the DOM
    await waitFor(() => {
      expect(screen.queryByText(testContent1)).toBeInTheDocument();
      expect(screen.queryByText(testContent2)).toBeInTheDocument();
      expect(screen.queryByText(testContent3)).toBeInTheDocument();
      expect(screen.queryByText(testContent4)).toBeInTheDocument();
    });
  });

  it('The value passed as an argument to close is passed to resolve. overlay.openAsync', async () => {
    // given: an openAsync overlay that closes with true when the dialog button is clicked
    const overlayDialogContent = 'context-modal-dialog-content';
    const overlayTriggerContent = 'context-modal-overlay-trigger-content';
    const mockFn = vi.fn();

    function Component() {
      return (
        <button
          onClick={async () => {
            const result = await overlay.openAsync<boolean>(
              ({ isOpen, close }) => isOpen && <button onClick={() => close(true)}>{overlayDialogContent}</button>
            );

            if (result) {
              mockFn(result);
            }
          }}
        >
          {overlayTriggerContent}
        </button>
      );
    }

    const { user } = renderWithUser(<Component />);

    // when: user opens the overlay and clicks the dialog button
    await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));
    await user.click(await screen.findByRole('button', { name: overlayDialogContent }));

    // then: the promise resolves with the value passed to close
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith(true);
    });
  });

  it('should be able to turn off overlay through close overlay.openAsync', async () => {
    // given: an openAsync overlay with a close button
    const overlayTriggerContent = 'context-modal-test-content';
    const overlayDialogContent = 'context-modal-dialog-content';

    function Component() {
      return (
        <button
          onClick={async () => {
            overlay.openAsync<boolean>(
              ({ isOpen, close }) => isOpen && <button onClick={() => close(true)}>{overlayDialogContent}</button>
            );
          }}
        >
          {overlayTriggerContent}
        </button>
      );
    }

    const { user } = renderWithUser(<Component />, { wrapper });

    // when: user opens the overlay and clicks close
    await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));
    await user.click(await screen.findByRole('button', { name: overlayDialogContent }));

    // then: the overlay is removed from the DOM
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: overlayDialogContent })).not.toBeInTheDocument();
    });
  });

  it('The reason passed as an argument to reject is passed to reject. overlay.openAsync', async () => {
    // given: an openAsync overlay that rejects with a reason when the dialog button is clicked
    const overlayDialogContent = 'context-modal-dialog-content';
    const overlayTriggerContent = 'context-modal-overlay-trigger-content';
    const rejectedReason = 'rejected';
    const mockFn = vi.fn();

    function Component() {
      return (
        <button
          onClick={async () => {
            try {
              await overlay.openAsync<boolean>(
                ({ isOpen, reject }) =>
                  isOpen && <button onClick={() => reject(rejectedReason)}>{overlayDialogContent}</button>
              );
            } catch (error) {
              mockFn(error);
            }
          }}
        >
          {overlayTriggerContent}
        </button>
      );
    }

    const { user } = renderWithUser(<Component />);

    // when: user opens the overlay and clicks the reject button
    await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));
    await user.click(await screen.findByRole('button', { name: overlayDialogContent }));

    // then: the promise rejects with the reason passed to reject
    await waitFor(() => {
      expect(mockFn).toHaveBeenCalledWith(rejectedReason);
    });
  });

  it('should be able to turn off overlay through reject overlay.openAsync', async () => {
    // given: an openAsync overlay with a reject button
    const overlayTriggerContent = 'context-modal-test-content';
    const overlayDialogContent = 'context-modal-dialog-content';

    function Component() {
      return (
        <button
          onClick={async () => {
            try {
              await overlay.openAsync<boolean>(
                ({ isOpen, reject }) =>
                  isOpen && <button onClick={() => reject('rejected')}>{overlayDialogContent}</button>
              );
            } catch (error) {
              //
            }
          }}
        >
          {overlayTriggerContent}
        </button>
      );
    }

    const { user } = renderWithUser(<Component />, { wrapper });

    // when: user opens the overlay and clicks the reject button
    await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));
    await user.click(await screen.findByRole('button', { name: overlayDialogContent }));

    // then: the overlay is removed from the DOM
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: overlayDialogContent })).not.toBeInTheDocument();
    });
  });

  it('should handle current overlay correctly when unmounting overlays in different orders', async () => {
    // given: 4 overlays are opened sequentially
    const contents = {
      first: 'overlay-content-1',
      second: 'overlay-content-2',
      third: 'overlay-content-3',
      fourth: 'overlay-content-4',
    };

    let overlayIds: string[] = [];

    function Component() {
      useEffect(() => {
        overlayIds = [
          overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-1">{contents.first}</div>),
          overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-2">{contents.second}</div>),
          overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-3">{contents.third}</div>),
          overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-4">{contents.fourth}</div>),
        ];
      }, []);

      return <div>Base Component</div>;
    }

    render(<Component />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeInTheDocument();
      expect(screen.getByTestId('overlay-2')).toBeInTheDocument();
      expect(screen.getByTestId('overlay-3')).toBeInTheDocument();
      expect(screen.getByTestId('overlay-4')).toBeInTheDocument();
    });

    // when: unmount middle overlay (2)
    // then: overlay 2 is removed, others remain visible
    overlay.unmount(overlayIds[1]);
    await waitFor(() => {
      expect(screen.queryByTestId('overlay-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('overlay-1')).toBeVisible();
      expect(screen.getByTestId('overlay-3')).toBeVisible();
      expect(screen.getByTestId('overlay-4')).toBeVisible();
    });

    // when: unmount last overlay (4)
    // then: overlays 2 and 4 are removed, 1 and 3 remain
    overlay.unmount(overlayIds[3]);
    await waitFor(() => {
      expect(screen.queryByTestId('overlay-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('overlay-4')).not.toBeInTheDocument();
      expect(screen.getByTestId('overlay-1')).toBeVisible();
      expect(screen.getByTestId('overlay-3')).toBeVisible();
    });

    // when: unmount overlay 3
    // then: only overlay 1 remains
    overlay.unmount(overlayIds[2]);
    await waitFor(() => {
      expect(screen.queryByTestId('overlay-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('overlay-3')).not.toBeInTheDocument();
      expect(screen.queryByTestId('overlay-4')).not.toBeInTheDocument();
      expect(screen.getByTestId('overlay-1')).toBeVisible();
    });

    // when: unmount overlay 1
    // then: no overlays remain
    overlay.unmount(overlayIds[0]);
    await waitFor(() => {
      expect(screen.queryByTestId(/^overlay-/)).not.toBeInTheDocument();
    });
  });

  it('should track current overlay state correctly', async () => {
    // given: a component that displays the current overlay id via useCurrentOverlay
    const overlayIdMap = {
      first: 'overlay-content-1',
      second: 'overlay-content-2',
    };

    function Component() {
      const current = useCurrentOverlay();

      useEffect(() => {
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-1">{overlayIdMap.first}</div>, {
          overlayId: overlayIdMap.first,
        });
      }, []);

      return <div data-testid="current-overlay">{current}</div>;
    }

    render(<Component />, { wrapper });

    // when: first overlay is opened
    // then: current overlay reflects the first overlay id
    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeVisible();
      expect(screen.getByTestId('current-overlay')).toHaveTextContent(overlayIdMap.first);
    });

    // when: first overlay is closed
    // then: current overlay is cleared
    overlay.close(overlayIdMap.first);
    await waitFor(() => {
      expect(screen.queryByTestId('overlay-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('current-overlay')).toHaveTextContent('');
    });

    // when: second overlay is opened
    // then: current overlay reflects the second overlay id
    overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-2">{overlayIdMap.second}</div>, {
      overlayId: overlayIdMap.second,
    });
    await waitFor(() => {
      expect(screen.getByTestId('overlay-2')).toBeVisible();
      expect(screen.getByTestId('current-overlay')).toHaveTextContent(overlayIdMap.second);
    });

    // when: second overlay is unmounted
    // then: current overlay is cleared
    overlay.unmount(overlayIdMap.second);
    await waitFor(() => {
      expect(screen.queryByTestId('overlay-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('current-overlay')).toHaveTextContent('');
    });
  });

  it('should be able to close all overlays', async () => {
    // given: 2 overlays are opened
    const contents = {
      first: 'overlay-content-1',
      second: 'overlay-content-2',
    };

    function Component() {
      const data = useOverlayData();
      const overlays = Object.values(data);
      const hasOpenOverlay = overlays.some((overlay) => overlay.isOpen);

      useEffect(() => {
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-1">{contents.first}</div>);
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-2">{contents.second}</div>);
      }, []);

      return <div>{hasOpenOverlay && 'has Open overlay'}</div>;
    }

    render(<Component />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeInTheDocument();
      expect(screen.getByTestId('overlay-2')).toBeInTheDocument();
    });

    // when: closeAll is called
    // then: all overlays are closed and can be reopened
    overlay.closeAll();
    await waitFor(() => {
      expect(screen.queryByTestId(/^overlay-/)).not.toBeInTheDocument();
      expect(screen.queryByText('has Open overlay')).not.toBeInTheDocument();
    });

    overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-1">{contents.first}</div>);
    overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-2">{contents.second}</div>);
    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeInTheDocument();
      expect(screen.getByTestId('overlay-2')).toBeInTheDocument();
    });
  });

  it('should not be able to get current overlay when all overlays are closed', async () => {
    // given: 2 overlays are opened and a component displays current overlay
    const contents = {
      first: 'overlay-content-1',
      second: 'overlay-content-2',
    };

    function Component() {
      const current = useCurrentOverlay();

      useEffect(() => {
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-1">{contents.first}</div>);
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-2">{contents.second}</div>);
      }, []);

      return <div data-testid="current-overlay">{current}</div>;
    }

    render(<Component />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeInTheDocument();
      expect(screen.getByTestId('overlay-2')).toBeInTheDocument();
    });

    // when: closeAll is called
    // then: current overlay is empty
    overlay.closeAll();
    await waitFor(() => {
      expect(screen.getByTestId('current-overlay')).toHaveTextContent('');
    });
  });

  it('should be able to unmount all overlays', async () => {
    // given: 2 overlays are opened
    const contents = {
      first: 'overlay-content-1',
      second: 'overlay-content-2',
    };

    function Component() {
      const data = useOverlayData();
      const overlays = Object.values(data);
      const hasOverlay = overlays.length !== 0;

      useEffect(() => {
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-1">{contents.first}</div>);
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-2">{contents.second}</div>);
      }, []);

      return <div>{hasOverlay && 'has overlay'}</div>;
    }

    render(<Component />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeInTheDocument();
      expect(screen.getByTestId('overlay-2')).toBeInTheDocument();
    });

    // when: unmountAll is called
    // then: all overlays are removed from the DOM entirely
    overlay.unmountAll();
    await waitFor(() => {
      expect(screen.queryByTestId(/^overlay-/)).not.toBeInTheDocument();
      expect(screen.queryByText('has overlay')).not.toBeInTheDocument();
    });
  });

  it("Can't create overlay with the same overlayId", async () => {
    // given: an overlay is opened with a specific overlayId
    const sameOverlayId = 'same-overlay-id';

    function Component() {
      useEffect(() => {
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-1" />, { overlayId: sameOverlayId });
      }, []);

      return <div>Base Component</div>;
    }

    render(<Component />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeInTheDocument();
    });

    // when: another overlay is opened with the same overlayId
    // then: it throws an error
    expect(() => {
      act(() => {
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-2" />, { overlayId: sameOverlayId });
      });
    }).toThrowError(
      "You can't open the multiple overlays with the same overlayId(same-overlay-id). Please set a different id."
    );
  });

  describe('openAsync with defaultValue option', () => {
    it('resolves with close(value) when called internally (backward compatible)', async () => {
      // given: an openAsync overlay with defaultValue: false
      const overlayDialogContent = 'openasync-dialog-content';
      const overlayTriggerContent = 'openasync-trigger-content';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<boolean>(
                ({ isOpen, close }) => isOpen && <button onClick={() => close(true)}>{overlayDialogContent}</button>,
                { defaultValue: false }
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);

      // when: user clicks close(true) from inside the overlay
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));
      await user.click(await screen.findByRole('button', { name: overlayDialogContent }));

      // then: promise resolves with true (not the defaultValue)
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith(true);
      });
    });

    it('resolves with defaultValue when closed externally via overlay.close()', async () => {
      // given: an openAsync overlay with overlayId and defaultValue: false
      const overlayTriggerContent = 'openasync-external-close-trigger';
      const testOverlayId = 'test-external-close-overlay';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<boolean>(
                ({ isOpen }) => isOpen && <div data-testid="overlay-content">Dialog</div>,
                { overlayId: testOverlayId, defaultValue: false }
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));

      await waitFor(() => {
        expect(screen.getByTestId('overlay-content')).toBeInTheDocument();
      });

      // when: overlay is closed externally via overlay.close()
      act(() => {
        overlay.close(testOverlayId);
      });

      // then: promise resolves with the defaultValue (false)
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith(false);
      });
    });

    it('resolves with defaultValue when closed via overlay.closeAll()', async () => {
      // given: an openAsync overlay with defaultValue: 'cancelled'
      const overlayTriggerContent = 'openasync-closeall-trigger';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<string>(
                ({ isOpen }) => isOpen && <div data-testid="overlay-closeall">Dialog</div>,
                { defaultValue: 'cancelled' }
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));

      await waitFor(() => {
        expect(screen.getByTestId('overlay-closeall')).toBeInTheDocument();
      });

      // when: all overlays are closed via overlay.closeAll()
      act(() => {
        overlay.closeAll();
      });

      // then: promise resolves with the defaultValue ('cancelled')
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith('cancelled');
      });
    });

    it('resolves with defaultValue when unmounted externally via overlay.unmount()', async () => {
      // given: an openAsync overlay with overlayId and defaultValue: false
      const overlayTriggerContent = 'openasync-unmount-trigger';
      const testOverlayId = 'test-unmount-overlay';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<boolean>(
                ({ isOpen }) => isOpen && <div data-testid="overlay-unmount">Dialog</div>,
                { overlayId: testOverlayId, defaultValue: false }
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));

      await waitFor(() => {
        expect(screen.getByTestId('overlay-unmount')).toBeInTheDocument();
      });

      // when: overlay is unmounted externally via overlay.unmount()
      act(() => {
        overlay.unmount(testOverlayId);
      });

      // then: promise resolves with the defaultValue (false)
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith(false);
      });
    });

    it('resolves with defaultValue when unmounted via overlay.unmountAll()', async () => {
      // given: an openAsync overlay with defaultValue: 'unmounted'
      const overlayTriggerContent = 'openasync-unmountall-trigger';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<string>(
                ({ isOpen }) => isOpen && <div data-testid="overlay-unmountall">Dialog</div>,
                { defaultValue: 'unmounted' }
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));

      await waitFor(() => {
        expect(screen.getByTestId('overlay-unmountall')).toBeInTheDocument();
      });

      // when: all overlays are unmounted via overlay.unmountAll()
      act(() => {
        overlay.unmountAll();
      });

      // then: promise resolves with the defaultValue ('unmounted')
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith('unmounted');
      });
    });

    it('resolves with null defaultValue for object type when closed externally', async () => {
      // given: an openAsync overlay that returns an object or null, with defaultValue: null
      type UserSelection = { id: number; name: string };
      const overlayTriggerContent = 'openasync-object-trigger';
      const testOverlayId = 'test-object-overlay';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<UserSelection | null>(
                ({ isOpen, close }) =>
                  isOpen && (
                    <div data-testid="overlay-object">
                      <button onClick={() => close({ id: 1, name: 'Alice' })}>Select Alice</button>
                    </div>
                  ),
                { overlayId: testOverlayId, defaultValue: null }
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));

      await waitFor(() => {
        expect(screen.getByTestId('overlay-object')).toBeInTheDocument();
      });

      // when: overlay is closed externally
      act(() => {
        overlay.close(testOverlayId);
      });

      // then: promise resolves with null (the defaultValue), not the object
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith(null);
      });
    });

    it('resolves with selected object when closed internally for object type', async () => {
      // given: an openAsync overlay that returns an object or null, with defaultValue: null
      type UserSelection = { id: number; name: string };
      const overlayTriggerContent = 'openasync-object-internal-trigger';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<UserSelection | null>(
                ({ isOpen, close }) =>
                  isOpen && (
                    <div data-testid="overlay-object-internal">
                      <button onClick={() => close({ id: 1, name: 'Alice' })}>Select Alice</button>
                    </div>
                  ),
                { defaultValue: null }
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));
      await user.click(await screen.findByRole('button', { name: 'Select Alice' }));

      // then: promise resolves with the selected object (not null)
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith({ id: 1, name: 'Alice' });
      });
    });

    it('resolves with undefined without defaultValue when closed externally via overlay.close()', async () => {
      // given: an openAsync overlay without defaultValue
      const overlayTriggerContent = 'openasync-no-default-trigger';
      const testOverlayId = 'test-no-default-overlay';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<boolean>(
                ({ isOpen }) => isOpen && <div data-testid="overlay-no-default">Dialog</div>,
                { overlayId: testOverlayId }
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));

      await waitFor(() => {
        expect(screen.getByTestId('overlay-no-default')).toBeInTheDocument();
      });

      // when: overlay is closed externally without defaultValue
      act(() => {
        overlay.close(testOverlayId);
      });

      // then: promise resolves with undefined (no longer pending)
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith(undefined);
      });
    });

    it('resolves with undefined without defaultValue when closed via overlay.closeAll()', async () => {
      // given: an openAsync overlay without defaultValue
      const overlayTriggerContent = 'openasync-no-default-closeall-trigger';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<boolean>(
                ({ isOpen }) => isOpen && <div data-testid="overlay-no-default-closeall">Dialog</div>
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));

      await waitFor(() => {
        expect(screen.getByTestId('overlay-no-default-closeall')).toBeInTheDocument();
      });

      // when: all overlays are closed via overlay.closeAll()
      act(() => {
        overlay.closeAll();
      });

      // then: promise resolves with undefined
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith(undefined);
      });
    });

    it('resolves with undefined without defaultValue when unmounted externally via overlay.unmount()', async () => {
      // given: an openAsync overlay without defaultValue
      const overlayTriggerContent = 'openasync-no-default-unmount-trigger';
      const testOverlayId = 'test-no-default-unmount-overlay';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<boolean>(
                ({ isOpen }) => isOpen && <div data-testid="overlay-no-default-unmount">Dialog</div>,
                { overlayId: testOverlayId }
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));

      await waitFor(() => {
        expect(screen.getByTestId('overlay-no-default-unmount')).toBeInTheDocument();
      });

      // when: overlay is unmounted externally
      act(() => {
        overlay.unmount(testOverlayId);
      });

      // then: promise resolves with undefined
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith(undefined);
      });
    });

    it('resolves with undefined without defaultValue when unmounted via overlay.unmountAll()', async () => {
      // given: an openAsync overlay without defaultValue
      const overlayTriggerContent = 'openasync-no-default-unmountall-trigger';
      const mockFn = vi.fn();

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<boolean>(
                ({ isOpen }) => isOpen && <div data-testid="overlay-no-default-unmountall">Dialog</div>
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));

      await waitFor(() => {
        expect(screen.getByTestId('overlay-no-default-unmountall')).toBeInTheDocument();
      });

      // when: all overlays are unmounted
      act(() => {
        overlay.unmountAll();
      });

      // then: promise resolves with undefined
      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith(undefined);
      });
    });

    it('prevents double resolution when close is called after external close', async () => {
      // given: an openAsync overlay with defaultValue and a captured close reference
      const overlayTriggerContent = 'openasync-double-resolve-trigger';
      const testOverlayId = 'test-double-resolve-overlay';
      const mockFn = vi.fn();
      let closeRef: ((value: string) => void) | null = null;

      function Component() {
        return (
          <button
            onClick={async () => {
              const result = await overlay.openAsync<string>(
                ({ isOpen, close }) => {
                  closeRef = close;
                  return isOpen && <div data-testid="overlay-double-resolve">Dialog</div>;
                },
                { overlayId: testOverlayId, defaultValue: 'dismissed' }
              );
              mockFn(result);
            }}
          >
            {overlayTriggerContent}
          </button>
        );
      }

      const { user } = renderWithUser(<Component />);
      await user.click(await screen.findByRole('button', { name: overlayTriggerContent }));

      await waitFor(() => {
        expect(screen.getByTestId('overlay-double-resolve')).toBeInTheDocument();
      });

      // when: overlay is closed externally first
      act(() => {
        overlay.close(testOverlayId);
      });

      await waitFor(() => {
        expect(mockFn).toHaveBeenCalledWith('dismissed');
      });

      // when: internal close is called after external close
      act(() => {
        closeRef?.('internal-value');
      });

      // then: mockFn is only called once (double resolution prevented)
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  it('unmount function requires the exact id to be provided', async () => {
    // given: an overlay is opened with a specific overlayId
    const overlayIdMap = {
      first: 'overlay-content-1',
      second: 'overlay-content-2',
    };

    function Component() {
      useEffect(() => {
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-1">{overlayIdMap.first}</div>, {
          overlayId: overlayIdMap.first,
        });
      }, []);

      return <div>Base Component</div>;
    }

    render(<Component />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeInTheDocument();
    });

    // when: unmount is called with a different overlayId
    overlay.unmount(overlayIdMap.second);

    // then: the original overlay remains in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeInTheDocument();
    });
  });

  it('should be able to open an overlay after closing it', async () => {
    // given: an overlay is opened with a specific overlayId
    const overlayId = 'overlay-content-1';

    function Component() {
      const current = useCurrentOverlay();

      useEffect(() => {
        overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-1">{overlayId}</div>, {
          overlayId: overlayId,
        });
      }, []);

      return <div data-testid="current-overlay">{current}</div>;
    }

    render(<Component />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeVisible();
      expect(screen.getByTestId('current-overlay')).toHaveTextContent(overlayId);
    });

    // when: the overlay is closed and then reopened with the same overlayId
    overlay.close(overlayId);
    await waitFor(() => {
      expect(screen.queryByTestId('overlay-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('current-overlay')).toHaveTextContent('');
    });

    overlay.open(({ isOpen }) => isOpen && <div data-testid="overlay-1">{overlayId}</div>, { overlayId });

    // then: the overlay is visible again with the correct current state
    await waitFor(() => {
      expect(screen.getByTestId('overlay-1')).toBeVisible();
      expect(screen.getByTestId('current-overlay')).toHaveTextContent(overlayId);
    });
  });
});

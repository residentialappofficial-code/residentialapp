import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

describe('useIsMobile Hook', () => {
  const originalInnerWidth = window.innerWidth;
  let addListenerMock;
  let removeListenerMock;

  beforeEach(() => {
    addListenerMock = vi.fn();
    removeListenerMock = vi.fn();
    
    // Mock window.matchMedia
    vi.stubGlobal('matchMedia', vi.fn((query) => ({
      matches: window.innerWidth < 768,
      media: query,
      onchange: null,
      addListener: addListenerMock,
      removeListener: removeListenerMock,
      addEventListener: addListenerMock,
      removeEventListener: removeListenerMock,
      dispatchEvent: vi.fn(),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.innerWidth = originalInnerWidth;
  });

  it('returns true when window width is less than 768px', () => {
    window.innerWidth = 375; // Mobile screen

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  it('returns false when window width is 768px or greater', () => {
    window.innerWidth = 1024; // Desktop screen

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('correctly registers change event listener on mount', () => {
    renderHook(() => useIsMobile());
    expect(addListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

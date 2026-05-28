import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from './usePermissions';
import { useAuth } from '../contexts/AuthContext';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('usePermissions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves all permissions for super_admin role', () => {
    useAuth.mockReturnValue({
      profile: { role: 'super_admin' },
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isOwner).toBe(true);
    expect(result.current.can('biling', 'write')).toBe(true);
    expect(result.current.can('warga', 'delete')).toBe(true);
  });

  it('resolves all permissions for admin role', () => {
    useAuth.mockReturnValue({
      profile: { role: 'admin' },
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isOwner).toBe(true);
    expect(result.current.can('forum', 'edit')).toBe(true);
  });

  it('resolves all permissions for perumahan owner (pengurus.is_owner)', () => {
    useAuth.mockReturnValue({
      profile: {
        role: 'staff',
        pengurus: { is_owner: true },
      },
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isOwner).toBe(true);
    expect(result.current.can('tagihan', 'generate')).toBe(true);
  });

  it('resolves permissions from profile.permissions list correctly', () => {
    useAuth.mockReturnValue({
      profile: {
        role: 'staff',
        permissions: {
          warga: ['view', 'edit'],
          iuran: ['view'],
        },
      },
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isOwner).toBe(false);
    expect(result.current.can('warga', 'view')).toBe(true);
    expect(result.current.can('warga', 'edit')).toBe(true);
    expect(result.current.can('warga', 'delete')).toBe(false);
    expect(result.current.can('iuran', 'view')).toBe(true);
    expect(result.current.can('iuran', 'edit')).toBe(false);
  });

  it('resolves permissions from profile.pengurus.role.permissions correctly', () => {
    useAuth.mockReturnValue({
      profile: {
        role: 'staff',
        pengurus: {
          role: {
            permissions: {
              complaints: ['view', 'resolve'],
            },
          },
        },
      },
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isOwner).toBe(false);
    expect(result.current.can('complaints', 'view')).toBe(true);
    expect(result.current.can('complaints', 'resolve')).toBe(true);
    expect(result.current.can('complaints', 'delete')).toBe(false);
  });

  it('denies all permissions for simple resident (warga) role without permission fields', () => {
    useAuth.mockReturnValue({
      profile: { role: 'warga' },
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isOwner).toBe(false);
    expect(result.current.can('blocks', 'view')).toBe(false);
    expect(result.current.can('warga', 'edit')).toBe(false);
  });
});

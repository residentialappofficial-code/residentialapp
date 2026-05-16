import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import React from 'react';

// Wrapper for Provider
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Note: In real app, useEffect runs immediately, but let's check initial logic
    expect(result.current.loading).toBe(true);
  });

  it('handles signOut correctly', async () => {
    supabase.auth.signOut.mockResolvedValueOnce({ error: null });
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('handles signIn correctly', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: '123', email: 'test@test.com' } },
      error: null
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@test.com', 'password');
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password'
    });
  });

  it('switches perumahan correctly', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.switchPerumahan('perumahan-123');
    });

    expect(result.current.selectedPerumahanId).toBe('perumahan-123');
  });
});

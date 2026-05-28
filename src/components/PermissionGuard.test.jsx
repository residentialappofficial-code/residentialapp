import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermissionGuard } from './PermissionGuard';
import { usePermissions } from '../hooks/usePermissions';

// Mock usePermissions hook
vi.mock('../hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}));

describe('PermissionGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when the user has access permission', () => {
    usePermissions.mockReturnValue({
      can: vi.fn(() => true),
    });

    render(
      <PermissionGuard module="warga" action="view">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    const element = screen.getByTestId('protected-content');
    expect(element).toBeInTheDocument();
    expect(element.textContent).toBe('Protected Content');
  });

  it('renders null when the user does not have permission and no fallback is provided', () => {
    usePermissions.mockReturnValue({
      can: vi.fn(() => false),
    });

    const { container } = render(
      <PermissionGuard module="iuran" action="delete">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId('protected-content')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('renders fallback content when the user does not have permission and fallback is provided', () => {
    usePermissions.mockReturnValue({
      can: vi.fn(() => false),
    });

    render(
      <PermissionGuard 
        module="iuran" 
        action="delete"
        fallback={<div data-testid="fallback-content">Access Denied</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId('protected-content')).toBeNull();
    const fallback = screen.getByTestId('fallback-content');
    expect(fallback).toBeInTheDocument();
    expect(fallback.textContent).toBe('Access Denied');
  });
});

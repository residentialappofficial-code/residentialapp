import { usePermissions } from '../hooks/usePermissions';

export const PermissionGuard = ({ module, action, children, fallback = null }) => {
  const { can } = usePermissions();

  if (can(module, action)) {
    return children;
  }

  return fallback;
};

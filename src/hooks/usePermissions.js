import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { profile } = useAuth();

  const permissions = useMemo(() => {
    // Super Admin or Complex Admin has all permissions
    if (profile?.role === 'super_admin' || profile?.role === 'admin') {
      return { isOwner: true, all: true };
    }

    // Owner of the complex has all permissions
    if (profile?.pengurus?.is_owner) {
      return { isOwner: true, all: true };
    }

    // Otherwise, use the permissions from the role or profile
    const matrix = {
      ...(profile?.permissions || {}),
      ...(profile?.pengurus?.role?.permissions || {})
    };

    return {
      isOwner: false,
      all: false,
      matrix
    };
  }, [profile]);

  const can = (module, action) => {
    if (permissions.all) return true;
    
    const modulePerms = permissions.matrix[module];
    if (!modulePerms) return false;
    
    return modulePerms.includes(action);
  };

  return { can, isOwner: permissions.isOwner };
};

'use client';
import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { UserRole, hasPermission, canAccessRoute, Permission } from './rbac';

export type RoleState = {
  role: UserRole | null;
  loading: boolean;
  orgId: string;
  userId: string;
  userName: string;
};

export function useRole(): RoleState & {
  can: (permission: Permission) => boolean;
  canAccess: (route: string) => boolean;
} {
  const [state, setState] = useState<RoleState>({
    role: null, loading: true, orgId: '', userId: '', userName: '',
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setState(s => ({ ...s, loading: false })); return; }
      const { data: userData } = await supabase
        .from('users')
        .select('org_id, role, full_name')
        .eq('id', data.session.user.id)
        .single();
      setState({
        role: (userData?.role as UserRole) || 'volunteer',
        loading: false,
        orgId: userData?.org_id || '',
        userId: data.session.user.id,
        userName: userData?.full_name || '',
      });
    });
  }, []);

  return {
    ...state,
    can: (permission: Permission) => state.role ? hasPermission(state.role, permission) : false,
    canAccess: (route: string) => state.role ? canAccessRoute(state.role, route) : false,
  };
}

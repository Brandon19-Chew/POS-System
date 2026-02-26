import { useAuthContext } from "@/contexts/AuthContext";
import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/" } = options ?? {};
  const { user, token, isAuthenticated, isLoading, logout: contextLogout } = useAuthContext();
  const utils = trpc.useUtils();

  const logout = useCallback(async () => {
    contextLogout();
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [contextLogout, utils]);

  // Redirect if needed
  if (
    redirectOnUnauthenticated &&
    !isLoading &&
    !isAuthenticated &&
    typeof window !== "undefined" &&
    window.location.pathname !== redirectPath
  ) {
    window.location.href = redirectPath;
  }

  return {
    user: user ? {
      id: user.id,
      openId: user.email,
      name: user.name,
      email: user.email,
      role: user.role,
      loginMethod: "email_password",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      branchId: null,
    } : null,
    loading: isLoading,
    error: null,
    isAuthenticated,
    logout,
    token,
  };
}

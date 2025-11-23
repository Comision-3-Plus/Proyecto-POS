"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { LoginCredentials, AuthResponse, User } from "@/types";
import { apiClient } from "@/lib/api-client";
import { useStore } from "@/store/use-store";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, clearStore } = useStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<AuthResponse>(
        "/api/v1/auth/login",
        credentials
      );
      return response;
    },
    onSuccess: async (data) => {
      // Guardar token en localStorage
      localStorage.setItem("token", data.access_token);
      // Guardar cookie para middleware
      document.cookie = `token=${data.access_token}; path=/; max-age=86400`;
      queryClient.setQueryData(["user"], data.user);
      
      // ⚡ Sincronizar con Zustand
      setUser(data.user);
      
      // ⚡ PREFETCH: Pre-cargar dashboard antes de navegar (reduce tiempo de carga)
      await queryClient.prefetchQuery({
        queryKey: ["dashboard", "metrics"],
        queryFn: () => apiClient.get("/api/v1/dashboard/resumen"),
      });
      
      // Verificar si necesita onboarding
      if (!data.user.tienda?.rubro) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    },
  });

  const logout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
    queryClient.clear();
    clearStore();
    router.push("/login");
  };

  // ⚡ OPTIMIZACIÓN: staleTime para evitar re-fetches en cada navegación
  const { data: user } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        return await apiClient.get<User>("/api/v1/auth/me");
      } catch {
        return null;
      }
    },
    staleTime: 300000, // ⚡ 5 minutos - datos del usuario no cambian seguido
    gcTime: 600000, // ⚡ 10 minutos en cache
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  // Sincronizar user con Zustand cuando cambie
  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  return {
    user,
    login: loginMutation.mutate,
    logout,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
  };
}

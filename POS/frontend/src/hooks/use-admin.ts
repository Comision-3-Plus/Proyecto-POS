"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Tienda {
  id: string;
  nombre: string;
  rubro: string;
  is_active?: boolean;
}

interface Usuario {
  id: string;
  email: string;
  full_name: string;
  rol: string;
  tienda_id: string;
  is_active: boolean;
}

interface TiendaCreate {
  nombre: string;
  rubro: string;
}

interface UsuarioCreate {
  email: string;
  password: string;
  full_name: string;
  rol: string;
  tienda_id: string;
}

interface OnboardingData {
  nombre_tienda: string;
  rubro: string;
  email: string;
  password: string;
  nombre_completo: string;
  rol?: string;
}

interface OnboardingResponse {
  tienda: Tienda;
  usuario: Usuario;
}

export function useAdmin() {
  const queryClient = useQueryClient();

  // Listar tiendas
  const { data: tiendas = [], isLoading: loadingTiendas } = useQuery({
    queryKey: ["admin", "tiendas"],
    queryFn: () => apiClient.get<Tienda[]>("/api/v1/admin/tiendas"),
    staleTime: 60000,
  });

  // Listar usuarios
  const { data: usuarios = [], isLoading: loadingUsuarios } = useQuery({
    queryKey: ["admin", "usuarios"],
    queryFn: () => apiClient.get<Usuario[]>("/api/v1/admin/usuarios"),
    staleTime: 60000,
  });

  // Crear tienda
  const createTienda = useMutation({
    mutationFn: (data: TiendaCreate) =>
      apiClient.post<Tienda>("/api/v1/admin/tiendas", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tiendas"] });
    },
  });

  // Crear usuario
  const createUsuario = useMutation({
    mutationFn: (data: UsuarioCreate) =>
      apiClient.post<Usuario>("/api/v1/admin/usuarios", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "usuarios"] });
    },
  });

  // Desactivar usuario
  const deleteUsuario = useMutation({
    mutationFn: (usuarioId: string) =>
      apiClient.delete(`/api/v1/admin/usuarios/${usuarioId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "usuarios"] });
    },
  });

  // Activar usuario
  const activateUsuario = useMutation({
    mutationFn: (usuarioId: string) =>
      apiClient.patch(`/api/v1/admin/usuarios/${usuarioId}/activate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "usuarios"] });
    },
  });

  // 🎯 Onboarding: Crear tienda + usuario en un solo paso
  const onboarding = useMutation({
    mutationFn: (data: OnboardingData) =>
      apiClient.post<OnboardingResponse>("/api/v1/admin/onboarding", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tiendas"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "usuarios"] });
    },
  });

  return {
    tiendas,
    usuarios,
    loadingTiendas,
    loadingUsuarios,
    createTienda,
    createUsuario,
    deleteUsuario,
    activateUsuario,
    onboarding, // 🎯 NUEVO
  };
}

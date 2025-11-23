"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Producto } from "@/types";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

export function useProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ⚡ OPTIMIZACIÓN: Cache con staleTime para evitar re-fetches
  const { data: productos = [], isLoading } = useQuery({
    queryKey: ["productos"],
    queryFn: () => apiClient.get<Producto[]>("/api/v1/productos"),
    staleTime: 30000, // ⚡ Datos válidos 30s
    gcTime: 300000, // ⚡ Cache 5 minutos
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Producto>) =>
      apiClient.post<Producto>("/api/productos", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast({
        title: "Producto creado",
        description: "El producto se ha creado exitosamente",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Producto> }) =>
      apiClient.put<Producto>(`/api/productos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast({
        title: "Producto actualizado",
        description: "El producto se ha actualizado exitosamente",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/api/productos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado exitosamente",
      });
    },
  });

  return {
    productos,
    isLoading,
    createProducto: createMutation.mutate,
    updateProducto: updateMutation.mutate,
    deleteProducto: deleteMutation.mutate,
  };
}

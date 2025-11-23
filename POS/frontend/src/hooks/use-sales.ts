"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ItemVenta, Venta } from "@/types";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";

export function useSales() {
  return useQuery({
    queryKey: ["ventas"],
    queryFn: async () => {
      return await apiClient.get<Venta[]>("/api/v1/ventas");
    },
    staleTime: 30000, // 30 segundos
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      items: ItemVenta[];
      metodo_pago: "EFECTIVO" | "MERCADOPAGO" | "TARJETA";
    }) => {
      return await apiClient.post<Venta>("/api/v1/ventas/checkout", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Venta registrada",
        description: "La venta se ha registrado exitosamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

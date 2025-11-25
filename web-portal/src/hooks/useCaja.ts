/**
 * Hooks de React Query para Control de Caja
 * Gestiona el estado global de la caja del usuario
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { cajaService } from '@/services/caja.service';
import type {
  AbrirCajaRequest,
  MovimientoCajaRequest,
  CerrarCajaRequest,
  SesionCaja,
  EstadoCajaResponse,
  CerrarCajaResponse,
  MovimientoCaja,
} from '@/types/caja';
import { toast } from 'sonner';

// Query keys
export const cajaKeys = {
  all: ['caja'] as const,
  estado: () => [...cajaKeys.all, 'estado'] as const,
};

/**
 * Hook para obtener el estado actual de la caja
 * Se actualiza automáticamente en tiempo real
 */
export function useEstadoCaja(): UseQueryResult<EstadoCajaResponse> {
  return useQuery({
    queryKey: cajaKeys.estado(),
    queryFn: () => cajaService.obtenerEstadoCaja(),
    staleTime: 1000 * 30, // 30 segundos - se considera fresco
    refetchInterval: 1000 * 60, // Refetch automático cada 60 segundos
    refetchOnWindowFocus: true, // Refetch al volver a la ventana
  });
}

/**
 * Hook para abrir una nueva sesión de caja
 */
export function useAbrirCaja(): UseMutationResult<SesionCaja, Error, AbrirCajaRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AbrirCajaRequest) => cajaService.abrirCaja(data),
    onSuccess: (data: SesionCaja) => {
      // Invalidar el estado de la caja para forzar refetch
      queryClient.invalidateQueries({ queryKey: cajaKeys.estado() });
      
      toast.success('Caja abierta correctamente', {
        description: `Monto inicial: $${data.monto_inicial.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al abrir la caja', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook para registrar un movimiento de caja
 */
export function useRegistrarMovimiento(): UseMutationResult<MovimientoCaja, Error, MovimientoCajaRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MovimientoCajaRequest) => cajaService.registrarMovimiento(data),
    onSuccess: (data: MovimientoCaja) => {
      // Invalidar el estado de la caja para reflejar el nuevo movimiento
      queryClient.invalidateQueries({ queryKey: cajaKeys.estado() });
      
      const tipoLabel = data.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso';
      toast.success(`${tipoLabel} registrado correctamente`, {
        description: `Monto: $${data.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Error al registrar el movimiento', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook para cerrar la sesión de caja
 */
export function useCerrarCaja(): UseMutationResult<CerrarCajaResponse, Error, CerrarCajaRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CerrarCajaRequest) => cajaService.cerrarCaja(data),
    onSuccess: (data: CerrarCajaResponse) => {
      // Invalidar el estado de la caja
      queryClient.invalidateQueries({ queryKey: cajaKeys.estado() });
      
      const diferencia = data.diferencia;
      const diferenciaAbs = Math.abs(diferencia);
      
      if (diferencia === 0) {
        toast.success('¡Caja cerrada perfectamente!', {
          description: 'El monto real coincide con el esperado.',
        });
      } else if (diferencia > 0) {
        toast.success('Caja cerrada con sobrante', {
          description: `Sobrante: $${diferenciaAbs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        });
      } else {
        toast.warning('Caja cerrada con faltante', {
          description: `Faltante: $${diferenciaAbs.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
        });
      }
    },
    onError: (error: Error) => {
      toast.error('Error al cerrar la caja', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook helper para verificar si hay caja abierta
 */
export function useTieneCajaAbierta(): boolean {
  const { data } = useEstadoCaja();
  return data?.tiene_caja_abierta ?? false;
}

/**
 * Hook helper para obtener la sesión actual (si existe)
 */
export function useSesionActual(): SesionCaja | null {
  const { data } = useEstadoCaja();
  return data?.sesion ?? null;
}

/**
 * 💡 INSIGHTS - Business Intelligence Feed
 * 
 * Features:
 * - Feed de insights generados por IA
 * - Prioridad visual (crítico/warning/info)
 * - Acciones rápidas (Ver Producto, Pedir Stock)
 * - Dismiss functionality
 * - Auto-refresh
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
  Package,
  DollarSign,
  Clock,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Hooks generados por Orval
import {
  useListarInsightsApiV1InsightsGet,
  useArchivarInsightApiV1InsightsInsightIdDismissPost,
} from '@/api/generated/insights-alertas/insights-alertas';

// ==================== TYPES ====================
type InsightPriority = 'critico' | 'warning' | 'info';

// ==================== PRIORITY CONFIG ====================
const PRIORITY_CONFIG = {
  critico: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    badgeVariant: 'destructive' as const,
    label: 'Crítico',
  },
  warning: {
    icon: TrendingUp,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    badgeVariant: 'secondary' as const,
    label: 'Atención',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeVariant: 'secondary' as const,
    label: 'Info',
  },
};

// ==================== SKELETON ====================
function InsightSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ==================== EMPTY STATE ====================
function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
        <Sparkles className="h-8 w-8 text-indigo-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        Todo en orden
      </h3>
      <p className="text-slate-500 max-w-md mx-auto">
        No hay insights pendientes. La IA está analizando tu negocio y te notificará
        cuando detecte oportunidades de mejora.
      </p>
    </div>
  );
}

// ==================== INSIGHT CARD ====================
function InsightCard({ insight, onDismiss }: any) {
  const priority = insight.prioridad as InsightPriority;
  const config = PRIORITY_CONFIG[priority];
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-l-4 relative hover:shadow-md transition-shadow`}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Icon */}
            <div className={`${config.color} mt-0.5`}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Title & Priority */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900">{insight.titulo}</h3>
                <Badge variant={config.badgeVariant} className="text-xs">
                  {config.label}
                </Badge>
              </div>

              {/* Message */}
              <p className="text-sm text-slate-700 leading-relaxed">
                {insight.mensaje}
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(insight.created_at), "d 'de' MMM, HH:mm", { locale: es })}
                </div>
                {insight.categoria && (
                  <Badge variant="outline" className="text-xs">
                    {insight.categoria}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Dismiss Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDismiss(insight.id)}
            className="h-8 w-8 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        {insight.producto_relacionado_id && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = `/dashboard/productos?id=${insight.producto_relacionado_id}`;
              }}
            >
              <Package className="h-4 w-4 mr-2" />
              Ver Producto
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info('Funcionalidad de pedido próximamente');
              }}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Pedir Stock
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== MAIN COMPONENT ====================
export default function InsightsPage() {
  const [filtro, setFiltro] = useState<'all' | 'critico' | 'warning' | 'info'>('all');

  // ==================== QUERIES ====================
  const {
    data: insights,
    isLoading,
    refetch,
  } = useListarInsightsApiV1InsightsGet(
    {},
    {
      query: {
        refetchInterval: 60000, // 1 minuto
      },
    }
  );

  const { mutate: dismissInsight } = useArchivarInsightApiV1InsightsInsightIdDismissPost({
    mutation: {
      onSuccess: () => {
        toast.success('Insight descartado');
        refetch();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.detail || 'Error al descartar insight');
      },
    },
  });

  // ==================== HANDLERS ====================
  const handleDismiss = (insightId: string) => {
    dismissInsight({ insightId });
  };

  // ==================== FILTERING ====================
  const insightsFiltrados = insights?.filter((insight: any) => {
    if (filtro === 'all') return true;
    return insight.prioridad === filtro;
  }) || [];

  // ==================== STATS ====================
  const stats = {
    total: insights?.length || 0,
    criticos: insights?.filter((i: any) => i.prioridad === 'critico').length || 0,
    warnings: insights?.filter((i: any) => i.prioridad === 'warning').length || 0,
    info: insights?.filter((i: any) => i.prioridad === 'info').length || 0,
  };

  // ==================== RENDER ====================
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="h-8 w-8 text-indigo-600" />
            Business Insights
          </h1>
          <p className="text-slate-500 mt-1">Recomendaciones inteligentes para tu negocio</p>
        </div>

        {/* Filtro */}
        <Select value={filtro} onValueChange={(v: any) => setFiltro(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({stats.total})</SelectItem>
            <SelectItem value="critico">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Críticos ({stats.criticos})
              </div>
            </SelectItem>
            <SelectItem value="warning">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                Atención ({stats.warnings})
              </div>
            </SelectItem>
            <SelectItem value="info">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                Info ({stats.info})
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Lightbulb className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-slate-500">Total Insights</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.criticos}</div>
                <div className="text-xs text-slate-500">Críticos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
                <div className="text-xs text-slate-500">Atención</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.info}</div>
                <div className="text-xs text-slate-500">Informativos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feed de Insights */}
      <div className="max-w-4xl">
        {isLoading ? (
          <InsightSkeleton />
        ) : insightsFiltrados.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {insightsFiltrados.map((insight: any) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <Card className="max-w-4xl bg-slate-50 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <Sparkles className="h-5 w-5 text-indigo-500 mt-0.5" />
            <div>
              <p className="font-medium mb-1">¿Cómo funcionan los Insights?</p>
              <p className="text-slate-500">
                Nuestro sistema de IA analiza continuamente tus ventas, inventario y tendencias
                para identificar oportunidades de mejora. Los insights críticos requieren atención
                inmediata, mientras que los informativos son sugerencias para optimizar tu negocio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

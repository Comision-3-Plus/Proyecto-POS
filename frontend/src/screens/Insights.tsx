/**
 * Insights Screen - Alertas Inteligentes y Recomendaciones
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, X, RefreshCw, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/context/ToastContext';
import insightsService, { Insight } from '@/services/insights.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/format';

export default function Insights() {
  const [filterUrgencia, setFilterUrgencia] = useState<string>('all');
  const { success: showSuccess } = useToast();
  const queryClient = useQueryClient();

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['insights', filterUrgencia],
    queryFn: () => insightsService.getInsights({
      nivel_urgencia: filterUrgencia !== 'all' ? filterUrgencia : undefined,
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['insights-stats'],
    queryFn: () => insightsService.getStats(),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => insightsService.dismissInsight(id),
    onSuccess: () => {
      showSuccess('Insight archivado');
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      queryClient.invalidateQueries({ queryKey: ['insights-stats'] });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => insightsService.refreshInsights(),
    onSuccess: (data) => {
      showSuccess(`${data.insights_generados} nuevos insights generados`);
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-yellow-500" />
            Insights Inteligentes
          </h1>
          <p className="text-gray-600 mt-1">Alertas y recomendaciones automáticas</p>
        </div>
        <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
          <RefreshCw className="w-5 h-5 mr-2" />
          Actualizar Insights
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <StatCard label="Total Activos" value={stats.total_activos} color="primary" />
          <StatCard label="Críticos" value={stats.por_urgencia?.CRITICA || 0} color="red" />
          <StatCard label="Alta Urgencia" value={stats.por_urgencia?.ALTA || 0} color="orange" />
          <StatCard label="Media" value={stats.por_urgencia?.MEDIA || 0} color="yellow" />
          <StatCard label="Baja" value={stats.por_urgencia?.BAJA || 0} color="blue" />
        </div>
      )}

      <div className="flex gap-2">
        <FilterButton label="Todos" active={filterUrgencia === 'all'} onClick={() => setFilterUrgencia('all')} />
        <FilterButton label="Críticos" active={filterUrgencia === 'CRITICA'} onClick={() => setFilterUrgencia('CRITICA')} color="red" />
        <FilterButton label="Alta" active={filterUrgencia === 'ALTA'} onClick={() => setFilterUrgencia('ALTA')} color="orange" />
        <FilterButton label="Media" active={filterUrgencia === 'MEDIA'} onClick={() => setFilterUrgencia('MEDIA')} color="yellow" />
        <FilterButton label="Baja" active={filterUrgencia === 'BAJA'} onClick={() => setFilterUrgencia('BAJA')} color="blue" />
      </div>

      <div className="space-y-4">
        {isLoading && <div className="text-center py-8 text-gray-500">Cargando insights...</div>}
        {!isLoading && insights.length === 0 && (
          <Alert variant="info">No hay insights activos. ¡Todo está bajo control!</Alert>
        )}
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onDismiss={() => dismissMutation.mutate(insight.id)}
            isPending={dismissMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-3xl font-bold ${color === 'primary' ? 'text-primary-600' : `text-${color}-600`}`}>
        {value}
      </p>
    </div>
  );
}

function FilterButton({ label, active, onClick, color }: any) {
  const colors = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? color
            ? `${colors[color as keyof typeof colors]} text-white`
            : 'bg-primary-500 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function InsightCard({ insight, onDismiss, isPending }: { insight: Insight; onDismiss: () => void; isPending: boolean }) {
  const config = {
    CRITICA: { color: 'border-red-500 bg-red-50', icon: AlertCircle, iconColor: 'text-red-500' },
    ALTA: { color: 'border-orange-500 bg-orange-50', icon: AlertTriangle, iconColor: 'text-orange-500' },
    MEDIA: { color: 'border-yellow-500 bg-yellow-50', icon: Info, iconColor: 'text-yellow-600' },
    BAJA: { color: 'border-blue-500 bg-blue-50', icon: CheckCircle, iconColor: 'text-blue-500' },
  }[insight.nivel_urgencia] || { color: 'border-gray-500 bg-gray-50', icon: Info, iconColor: 'text-gray-500' };

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-l-4 ${config.color} rounded-lg p-6 shadow-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <Icon className={`w-6 h-6 ${config.iconColor} mt-1`} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">{insight.tipo.replace(/_/g, ' ')}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {insight.nivel_urgencia}
              </span>
            </div>
            <p className="text-gray-700">{insight.mensaje}</p>
            <p className="text-sm text-gray-500 mt-2">{formatDate(insight.created_at)}</p>
            {insight.extra_data && Object.keys(insight.extra_data).length > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                <pre className="bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                  {JSON.stringify(insight.extra_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss} disabled={isPending}>
          <X className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}

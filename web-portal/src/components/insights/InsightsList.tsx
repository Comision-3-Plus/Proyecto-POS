/**
 * Componente de insights y alertas
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insightsService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const urgencyIcons = {
  CRITICA: <AlertCircle className="h-5 w-5 text-red-500" />,
  ALTA: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  MEDIA: <Info className="h-5 w-5 text-blue-500" />,
  BAJA: <Info className="h-5 w-5 text-gray-500" />,
};

const urgencyVariants = {
  CRITICA: 'destructive',
  ALTA: 'warning',
  MEDIA: 'default',
  BAJA: 'secondary',
} as const;

export function InsightsList() {
  const queryClient = useQueryClient();

  const { data: insights } = useQuery({
    queryKey: ['insights', 'list'],
    queryFn: () => insightsService.list({ activos_solo: true, limit: 10 }),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => insightsService.dismiss(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  });

  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Insights y Alertas</span>
          <Badge variant="secondary">{insights.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start gap-3 p-3 bg-gray-50 border rounded-md"
            >
              <div className="flex-shrink-0 mt-0.5">
                {urgencyIcons[insight.nivel_urgencia]}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant={urgencyVariants[insight.nivel_urgencia]} className="text-xs mb-1">
                      {insight.nivel_urgencia}
                    </Badge>
                    <p className="text-sm font-medium">{insight.mensaje}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(insight.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => dismissMutation.mutate(insight.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

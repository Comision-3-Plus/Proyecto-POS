/**
 * Componente de tarjeta de métrica para el dashboard
 */

'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  trend?: 'up' | 'down';
  subtitle?: string;
}

export function MetricCard({ title, value, change, icon, trend, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-2">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-600" />
            ) : null}
            <span
              className={
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
              }
            >
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

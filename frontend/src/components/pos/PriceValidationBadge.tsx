import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../lib/format';

interface PriceValidationBadgeProps {
  currentPrice: number;
  competitorPrice?: number;
  // suggestedPrice and averageMarketPrice reserved for future enhancements
}

export default function PriceValidationBadge({
  currentPrice,
  competitorPrice,
}: PriceValidationBadgeProps) {
  // Calcular comparación con competencia
  const getComparisonStatus = () => {
    if (!competitorPrice) return null;
    
    const diff = ((currentPrice - competitorPrice) / competitorPrice) * 100;
    
    if (Math.abs(diff) < 5) {
      return {
        type: 'competitive',
        icon: Minus,
        text: 'Precio competitivo',
        subtext: `Similar al mercado`,
        color: 'text-green-700',
        bg: 'bg-green-100',
        border: 'border-green-300',
      };
    } else if (diff > 5) {
      return {
        type: 'higher',
        icon: TrendingUp,
        text: 'Por encima del mercado',
        subtext: `+${diff.toFixed(1)}% vs competencia`,
        color: 'text-amber-700',
        bg: 'bg-amber-100',
        border: 'border-amber-300',
      };
    } else {
      return {
        type: 'lower',
        icon: TrendingDown,
        text: 'Por debajo del mercado',
        subtext: `${diff.toFixed(1)}% vs competencia`,
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        border: 'border-blue-300',
      };
    }
  };

  const status = getComparisonStatus();

  if (!status) {
    return null;
  }

  const Icon = status.icon;

  return (
    <div className={`inline-flex items-start gap-2 px-3 py-2 rounded-lg border ${status.bg} ${status.border}`}>
      <Icon className={`w-4 h-4 ${status.color} mt-0.5 flex-shrink-0`} />
      <div className="flex flex-col min-w-0">
        <span className={`text-sm font-semibold ${status.color}`}>
          {status.text}
        </span>
        <span className={`text-xs ${status.color} opacity-80`}>
          {status.subtext}
        </span>
        {competitorPrice && (
          <span className="text-xs text-gray-600 mt-1">
            Competencia: {formatCurrency(competitorPrice)}
          </span>
        )}
      </div>
    </div>
  );
}

interface PriceSuggestionBadgeProps {
  currentPrice: number;
  suggestedPrice: number;
  reason?: string;
}

export function PriceSuggestionBadge({
  currentPrice,
  suggestedPrice,
  reason = 'Precio sugerido según análisis de mercado',
}: PriceSuggestionBadgeProps) {
  const diff = suggestedPrice - currentPrice;
  const diffPercent = ((diff / currentPrice) * 100).toFixed(1);

  return (
    <div className="inline-flex items-start gap-2 px-3 py-2 rounded-lg border bg-indigo-50 border-indigo-300">
      <AlertTriangle className="w-4 h-4 text-indigo-700 mt-0.5 flex-shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-indigo-700">
          Sugerencia de precio
        </span>
        <span className="text-xs text-indigo-700 opacity-80">
          {reason}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-indigo-900">
            {formatCurrency(suggestedPrice)}
          </span>
          <span className={`text-xs font-medium ${
            diff > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ({diff > 0 ? '+' : ''}{diffPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}

interface MarginBadgeProps {
  costPrice: number;
  salePrice: number;
}

export function MarginBadge({ costPrice, salePrice }: MarginBadgeProps) {
  const margin = ((salePrice - costPrice) / salePrice) * 100;
  
  const getMarginStatus = () => {
    if (margin < 20) {
      return {
        text: 'Margen bajo',
        color: 'text-red-700',
        bg: 'bg-red-100',
        border: 'border-red-300',
      };
    } else if (margin < 40) {
      return {
        text: 'Margen normal',
        color: 'text-green-700',
        bg: 'bg-green-100',
        border: 'border-green-300',
      };
    } else {
      return {
        text: 'Margen alto',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        border: 'border-blue-300',
      };
    }
  };

  const status = getMarginStatus();

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${status.bg} ${status.border} border`}>
      <span className={`text-xs font-semibold ${status.color}`}>
        {status.text}: {margin.toFixed(1)}%
      </span>
    </div>
  );
}

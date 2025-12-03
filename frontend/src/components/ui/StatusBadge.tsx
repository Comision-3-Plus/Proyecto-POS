/**
 * StatusBadge Component
 * Badge consistente para mostrar estados en toda la aplicación
 */

import { getStatusBadgeClasses, BUSINESS_STATUS_MAP } from '@/lib/design-system';

interface StatusBadgeProps {
  category: keyof typeof BUSINESS_STATUS_MAP;
  status: string;
  label?: string;
}

export default function StatusBadge({ category, status, label }: StatusBadgeProps) {
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <span className={getStatusBadgeClasses(category, status)}>
      {displayLabel}
    </span>
  );
}

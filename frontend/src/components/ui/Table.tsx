/**
 * Table Component - Premium Design
 * La joya de la corona: striping suave, hover elegante, sorting, pagination
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string | ReactNode;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function Table<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  isLoading = false,
  emptyMessage = 'No hay datos para mostrar',
}: TableProps<T>) {
  const handleSort = (columnKey: string) => {
    if (onSort) {
      onSort(columnKey);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="overflow-hidden border border-gray-200/50 rounded-xl shadow-lg shadow-gray-200/20 backdrop-blur-sm bg-white/90">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 border-b border-gray-200/50 backdrop-blur-xl">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-100/50">
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full border border-gray-200 rounded-md bg-white">
        <div className="p-12 text-center">
          <p className="text-gray-500 text-base">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden border border-gray-200 rounded-md shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.align !== 'center' && col.align !== 'right' && 'text-left',
                    col.sortable && 'cursor-pointer select-none hover:bg-gray-100 transition-colors'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      col.align === 'center' && 'justify-center',
                      col.align === 'right' && 'justify-end'
                    )}
                  >
                    {typeof col.header === 'string' ? <span>{col.header}</span> : col.header}
                    {col.sortable && (
                      <span className="ml-1">
                        {sortBy === col.key ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="w-4 h-4 text-primary-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-primary-500" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  'transition-colors duration-150',
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                  onRowClick && 'cursor-pointer hover:bg-primary-50/30 active:bg-primary-50/50'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-6 py-4 text-sm text-gray-800',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

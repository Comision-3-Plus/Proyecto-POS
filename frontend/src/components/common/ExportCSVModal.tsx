/**
 * ExportCSVModal Component
 * Modal avanzado para exportar datos a CSV con preview y selección de columnas
 */

import { useState } from 'react';
import { X, Download, Eye, FileSpreadsheet } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface Column {
  key: string;
  label: string;
  selected?: boolean;
}

interface ExportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  columns: Column[];
  data: any[];
  filename?: string;
  onExport?: (selectedColumns: string[]) => void;
}

export default function ExportCSVModal({
  isOpen,
  onClose,
  title,
  columns: initialColumns,
  data,
  filename = 'export.csv',
  onExport,
}: ExportCSVModalProps) {
  const [columns, setColumns] = useState<Column[]>(
    initialColumns.map((col) => ({ ...col, selected: col.selected !== false }))
  );
  const [showPreview, setShowPreview] = useState(false);

  const selectedColumns = columns.filter((col) => col.selected);
  const previewData = data.slice(0, 5); // Mostrar solo primeras 5 filas

  const toggleColumn = (key: string) => {
    setColumns(
      columns.map((col) =>
        col.key === key ? { ...col, selected: !col.selected } : col
      )
    );
  };

  const selectAll = () => {
    setColumns(columns.map((col) => ({ ...col, selected: true })));
  };

  const selectNone = () => {
    setColumns(columns.map((col) => ({ ...col, selected: false })));
  };

  const handleExport = () => {
    const selectedKeys = selectedColumns.map((col) => col.key);

    if (onExport) {
      onExport(selectedKeys);
    } else {
      // Exportación por defecto
      const csvContent = convertToCSV(data, selectedColumns);
      downloadCSV(csvContent, filename);
    }

    onClose();
  };

  const convertToCSV = (data: any[], columns: Column[]): string => {
    // Header
    const header = columns.map((col) => col.label).join(',');

    // Rows
    const rows = data.map((row) => {
      return columns
        .map((col) => {
          const value = row[col.key];
          // Escapar comillas y valores con comas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        })
        .join(',');
    });

    return [header, ...rows].join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">
                {data.length} registro{data.length !== 1 ? 's' : ''} disponible{data.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Selección de columnas */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Seleccionar columnas ({selectedColumns.length}/{columns.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Seleccionar todas
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={selectNone}
                className="text-xs text-gray-600 hover:text-gray-700 font-medium"
              >
                Ninguna
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-lg">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={col.selected}
                  onChange={() => toggleColumn(col.key)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{col.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 mb-3"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Ocultar' : 'Ver'} Preview
          </button>

          {showPreview && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {selectedColumns.map((col) => (
                        <th
                          key={col.key}
                          className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b border-gray-200"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {selectedColumns.map((col) => (
                          <td key={col.key} className="px-3 py-2 text-gray-600">
                            {String(row[col.key] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.length > 5 && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                  Mostrando primeras 5 filas de {data.length}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={selectedColumns.length === 0}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Modal para Crear Producto
 * Formulario completo con variantes (talle/color)
 */

import { X, Plus, Trash2, Save } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useSizesQuery, useColorsQuery, useLocationsQuery, useCreateProducto } from '@/hooks/useProductosQuery';
import type { CreateProductRequest } from '@/types/api';

// Schema de validación
const createProductSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  base_sku: z.string().min(2, 'SKU requerido'),
  description: z.string().optional(),
  category: z.string().optional(),
  variants: z.array(
    z.object({
      size_id: z.number().optional(),
      color_id: z.number().optional(),
      price: z.number().min(0, 'Precio debe ser mayor a 0'),
      barcode: z.string().optional(),
      initial_stock: z.number().min(0, 'Stock debe ser mayor o igual a 0'),
      location_id: z.string().optional(),
    })
  ).min(1, 'Debe agregar al menos una variante'),
});

type CreateProductForm = z.infer<typeof createProductSchema>;

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProductModal({ isOpen, onClose }: CreateProductModalProps) {
  const { data: sizes = [], isLoading: loadingSizes } = useSizesQuery();
  const { data: colors = [], isLoading: loadingColors } = useColorsQuery();
  const { data: locations = [], isLoading: loadingLocations } = useLocationsQuery();
  const createProductMutation = useCreateProducto();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      base_sku: '',
      description: '',
      category: '',
      variants: [
        {
          size_id: undefined,
          color_id: undefined,
          price: 0,
          barcode: '',
          initial_stock: 0,
          location_id: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const onSubmit = async (data: CreateProductForm) => {
    try {
      // Convertir a formato de API
      const payload: CreateProductRequest = {
        ...data,
        variants: data.variants.map(v => ({
          ...v,
          // Convertir valores vacíos a undefined
          size_id: v.size_id || undefined,
          color_id: v.color_id || undefined,
          barcode: v.barcode || undefined,
          location_id: v.location_id || undefined,
        })),
      };

      await createProductMutation.mutateAsync(payload);
      reset();
      onClose();
    } catch (error) {
      console.error('Error al crear producto:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const defaultLocation = locations.find(l => l.is_default);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nuevo Producto</h2>
          <p className="text-sm text-gray-500 mt-1">Completa los datos del producto y sus variantes</p>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                {...register('name')}
                label="Nombre del Producto"
                placeholder="Ej: Remera Básica"
                error={errors.name?.message}
              />
            </div>
            <div>
              <Input
                {...register('base_sku')}
                label="SKU Base"
                placeholder="Ej: REM-BAS"
                error={errors.base_sku?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                {...register('category')}
                label="Categoría"
                placeholder="Ej: Indumentaria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Descripción del producto..."
              />
            </div>
          </div>
        </div>

        {/* Variantes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Variantes</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                append({
                  size_id: undefined,
                  color_id: undefined,
                  price: 0,
                  barcode: '',
                  initial_stock: 0,
                  location_id: defaultLocation?.location_id,
                })
              }
            >
              <Plus className="w-4 h-4" />
              Agregar Variante
            </Button>
          </div>

          {errors.variants?.root && (
            <p className="text-sm text-danger-600">{errors.variants.root.message}</p>
          )}

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Variante #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1 rounded hover:bg-danger-50 text-danger-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Talle
                    </label>
                    <select
                      {...register(`variants.${index}.size_id`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={loadingSizes}
                    >
                      <option value="">Sin talle</option>
                      {sizes.map(size => (
                        <option key={size.id} value={size.id}>
                          {size.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <select
                      {...register(`variants.${index}.color_id`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={loadingColors}
                    >
                      <option value="">Sin color</option>
                      {colors.map(color => (
                        <option key={color.id} value={color.id}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Input
                      {...register(`variants.${index}.price`, { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      label="Precio"
                      placeholder="0.00"
                      error={errors.variants?.[index]?.price?.message}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Input
                      {...register(`variants.${index}.barcode`)}
                      label="Código de Barras"
                      placeholder="Opcional"
                    />
                  </div>

                  <div>
                    <Input
                      {...register(`variants.${index}.initial_stock`, { valueAsNumber: true })}
                      type="number"
                      label="Stock Inicial"
                      placeholder="0"
                      error={errors.variants?.[index]?.initial_stock?.message}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <select
                      {...register(`variants.${index}.location_id`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={loadingLocations}
                    >
                      {locations.map(location => (
                        <option key={location.location_id} value={location.location_id}>
                          {location.name} {location.is_default && '(Principal)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createProductMutation.isPending}
            isLoading={createProductMutation.isPending}
          >
            <Save className="w-4 h-4" />
            Guardar Producto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

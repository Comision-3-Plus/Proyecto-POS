/**
 * Formulario para crear/editar productos
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateProducto, useUpdateProducto } from '@/hooks';
import type { ProductoRead, ProductoCreate } from '@/types/api';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const productoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  sku: z.string().min(1, 'El SKU es requerido'),
  descripcion: z.string().optional(),
  precio_venta: z.number().positive('El precio debe ser mayor a 0'),
  precio_costo: z.number().min(0, 'El precio de costo no puede ser negativo'),
  stock_actual: z.number().min(0, 'El stock no puede ser negativo').default(0),
  unidad_medida: z.string().default('UNIDAD'),
  tipo: z.enum(['general', 'ropa', 'pesable']),
  atributos: z.record(z.any()).optional(),
});

type ProductoFormData = z.infer<typeof productoSchema>;

interface ProductoFormProps {
  producto?: ProductoRead;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductoForm({ producto, onSuccess, onCancel }: ProductoFormProps) {
  const createProducto = useCreateProducto();
  const updateProducto = useUpdateProducto();

  const form = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema),
    defaultValues: producto
      ? {
          nombre: producto.nombre,
          sku: producto.sku,
          descripcion: producto.descripcion || '',
          precio_venta: producto.precio_venta,
          precio_costo: producto.precio_costo,
          stock_actual: producto.stock_actual,
          unidad_medida: producto.unidad_medida,
          tipo: producto.tipo as 'general' | 'ropa' | 'pesable',
          atributos: producto.atributos || {},
        }
      : {
          nombre: '',
          sku: '',
          descripcion: '',
          precio_venta: 0,
          precio_costo: 0,
          stock_actual: 0,
          unidad_medida: 'UNIDAD',
          tipo: 'general',
          atributos: {},
        },
  });

  const onSubmit = async (data: ProductoFormData) => {
    try {
      if (producto) {
        await updateProducto.mutateAsync({
          id: producto.id,
          data,
        });
      } else {
        await createProducto.mutateAsync(data as ProductoCreate);
      }
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error al guardar producto:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Remera básica" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: REM-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Descripción del producto..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="ropa">Ropa</SelectItem>
                    <SelectItem value="pesable">Pesable</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unidad_medida"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad de medida</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="UNIDAD">Unidad</SelectItem>
                    <SelectItem value="KILO">Kilo</SelectItem>
                    <SelectItem value="LITRO">Litro</SelectItem>
                    <SelectItem value="METRO">Metro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="precio_costo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio Costo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="precio_venta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio Venta</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock_actual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Actual</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={createProducto.isPending || updateProducto.isPending}>
            {producto ? 'Actualizar' : 'Crear'} Producto
          </Button>
        </div>
      </form>
    </Form>
  );
}

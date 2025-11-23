"use client";

import { useStore } from "@/store/use-store";
import ClothingProductForm from "./clothing-product-form";
import WeightedProductForm from "./weighted-product-form";
import StandardProductForm from "./standard-product-form";
import type { Producto } from "@/types";

interface ProductFormFactoryProps {
  producto?: Producto | null;
  formData: any;
  setFormData: (data: any) => void;
}

export default function ProductFormFactory({
  producto,
  formData,
  setFormData,
}: ProductFormFactoryProps) {
  const { rubro } = useStore();

  // Si el producto ya existe, usar su tipo (no cambiar dinámicamente)
  // Si es nuevo, usar el rubro de la tienda
  const effectiveRubro = producto ? mapProductoToRubro(producto) : rubro;

  switch (effectiveRubro) {
    case "ropa":
      return (
        <ClothingProductForm
          producto={producto}
          formData={formData}
          setFormData={setFormData}
        />
      );

    case "pesable":
      return (
        <WeightedProductForm
          producto={producto}
          formData={formData}
          setFormData={setFormData}
        />
      );

    case "general":
    default:
      return (
        <StandardProductForm
          producto={producto}
          formData={formData}
          setFormData={setFormData}
        />
      );
  }
}

// Helper para determinar el tipo de formulario basado en atributos del producto
function mapProductoToRubro(producto: Producto): "ropa" | "pesable" | "general" {
  if (producto.atributos?.colores || producto.atributos?.talles) {
    return "ropa";
  }
  if (producto.atributos?.pesable || producto.pesable) {
    return "pesable";
  }
  return "general";
}

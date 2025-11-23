"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingBag, Scale } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useStore } from "@/store/use-store";
import VariantSelectorModal from "./variant-selector-modal";
import WeightInputModal from "./weight-input-modal";
import type { Producto } from "@/types";

interface ProductCardPOSProps {
  producto: Producto;
  onAddToCart: (producto: Producto, metadata?: any) => void;
}

export default function ProductCardPOS({
  producto,
  onAddToCart,
}: ProductCardPOSProps) {
  const { rubro } = useStore();
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [weightModalOpen, setWeightModalOpen] = useState(false);

  // Determinar el tipo de producto
  const isRopa = producto.atributos?.colores || producto.atributos?.talles;
  const isPesable = producto.atributos?.pesable || producto.pesable;

  const handleClick = () => {
    // Comportamiento adaptativo según el tipo de producto
    if (isRopa) {
      // Ropa: Abrir modal de variantes
      setVariantModalOpen(true);
    } else if (isPesable) {
      // Pesable: Abrir modal de peso
      setWeightModalOpen(true);
    } else {
      // General: Agregar directo al carrito
      onAddToCart(producto, { cantidad: 1 });
    }
  };

  const handleVariantConfirm = (color: string, talle: string, cantidad: number) => {
    onAddToCart(producto, {
      cantidad,
      variante: { color, talle },
      varianteKey: `${color}-${talle}`,
    });
  };

  const handleWeightConfirm = (peso: number) => {
    onAddToCart(producto, {
      cantidad: peso, // El peso ES la cantidad
      peso,
      precioCalculado: peso * producto.precio_venta,
    });
  };

  // Determinar el ícono según el tipo
  const Icon = isRopa ? ShoppingBag : isPesable ? Scale : Package;

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-lg transition-all group"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          {/* Imagen o Ícono */}
          <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden group-hover:bg-gray-200 transition-colors">
            {producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon className="h-12 w-12 text-gray-400" />
            )}
          </div>

          {/* Nombre */}
          <h3 className="font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem]">
            {producto.nombre}
          </h3>

          {/* SKU */}
          <p className="text-xs text-gray-500 mb-2">{producto.sku}</p>

          {/* Precio */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(producto.precio_venta)}
              {isPesable && <span className="text-xs font-normal">/kg</span>}
            </span>

            {/* Badge según tipo */}
            {isRopa && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                Variantes
              </span>
            )}
            {isPesable && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Pesable
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="mt-2 text-xs text-gray-600">
            Stock: {producto.stock_actual}
            {isPesable && " kg"}
          </div>
        </CardContent>
      </Card>

      {/* Modales */}
      {isRopa && (
        <VariantSelectorModal
          open={variantModalOpen}
          onClose={() => setVariantModalOpen(false)}
          producto={producto}
          onConfirm={handleVariantConfirm}
        />
      )}

      {isPesable && (
        <WeightInputModal
          open={weightModalOpen}
          onClose={() => setWeightModalOpen(false)}
          producto={producto}
          onConfirm={handleWeightConfirm}
        />
      )}
    </>
  );
}

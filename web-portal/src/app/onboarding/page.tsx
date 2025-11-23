"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, Scale, Package } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useStore } from "@/store/use-store";
import { useAuth } from "@/hooks/use-auth";

const RUBROS = [
  {
    id: "ropa",
    label: "Indumentaria",
    icon: ShoppingBag,
    emoji: "👕",
    description: "Ropa, calzado y accesorios con talles y colores",
    color: "from-purple-500 to-pink-500",
    features: ["Variantes (talles/colores)", "Gestión de stock por combinación", "Selector visual en ventas"],
  },
  {
    id: "pesable",
    label: "Carnicería / Verdulería",
    icon: Scale,
    emoji: "🥩",
    description: "Productos pesables con precio por kilo",
    color: "from-green-500 to-emerald-500",
    features: ["Precio por Kilo", "Stock en decimales", "Calculadora de peso en ventas"],
  },
  {
    id: "general",
    label: "Kiosco / Drugstore",
    icon: Package,
    emoji: "🍬",
    description: "Productos con código de barras estándar",
    color: "from-blue-500 to-cyan-500",
    features: ["Escaneo rápido", "Código de barras prioritario", "Ventas ágiles sin modales"],
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setStore } = useStore();
  const [selectedRubro, setSelectedRubro] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedRubro) return;

    setIsLoading(true);
    try {
      const response = await apiClient.patch<{ tienda: any }>("/api/v1/tiendas/me", {
        rubro: selectedRubro,
      });

      // Actualizar el store global
      setStore(response.tienda);

      // Redirigir al dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error al actualizar rubro:", error);
      alert("Error al guardar. Por favor intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold mb-4">
            N
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            ¡Bienvenido a Nexus POS! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Personalicemos tu experiencia. ¿Qué tipo de negocio vas a gestionar?
          </p>
        </div>

        {/* Rubro Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {RUBROS.map((rubro) => {
            const Icon = rubro.icon;
            const isSelected = selectedRubro === rubro.id;

            return (
              <Card
                key={rubro.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected
                    ? "ring-4 ring-blue-500 shadow-2xl"
                    : "hover:shadow-xl"
                }`}
                onClick={() => setSelectedRubro(rubro.id)}
              >
                <CardContent className="p-6 space-y-4">
                  {/* Icon & Emoji */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${rubro.color} flex items-center justify-center text-4xl`}
                    >
                      {rubro.emoji}
                    </div>
                    {isSelected && (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {rubro.label}
                    </h3>
                    <p className="text-sm text-gray-600">{rubro.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {rubro.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg
                          className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-center pt-6">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={!selectedRubro || isLoading}
            className="min-w-64 text-lg py-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                Continuar
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

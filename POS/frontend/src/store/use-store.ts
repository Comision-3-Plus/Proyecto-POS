"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Tienda } from "@/types";

export type RubroType = "ropa" | "pesable" | "general" | null;

interface StoreState {
  // Current User & Store
  currentUser: User | null;
  currentStore: Tienda | null;
  rubro: RubroType;

  // Actions
  setUser: (user: User | null) => void;
  setStore: (store: Tienda) => void;
  setRubro: (rubro: RubroType) => void;
  clearStore: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      currentUser: null,
      currentStore: null,
      rubro: null,

      setUser: (user) =>
        set({
          currentUser: user,
          currentStore: user?.tienda || null,
          rubro: mapRubroToType(user?.tienda?.rubro),
        }),

      setStore: (store) =>
        set({
          currentStore: store,
          rubro: mapRubroToType(store.rubro),
        }),

      setRubro: (rubro) => set({ rubro }),

      clearStore: () =>
        set({
          currentUser: null,
          currentStore: null,
          rubro: null,
        }),
    }),
    {
      name: "nexus-store",
      partialize: (state) => ({
        currentStore: state.currentStore,
        rubro: state.rubro,
      }),
    }
  )
);

// Helper para mapear el rubro del backend a nuestros tipos
function mapRubroToType(rubro?: string): RubroType {
  if (!rubro) return null;

  const rubroLower = rubro.toLowerCase();

  // Ropa / Indumentaria
  if (
    rubroLower.includes("ropa") ||
    rubroLower.includes("indumentaria") ||
    rubroLower.includes("textil") ||
    rubroLower.includes("moda")
  ) {
    return "ropa";
  }

  // Pesables (Carnicería, Verdulería, Granel)
  if (
    rubroLower.includes("carnic") ||
    rubroLower.includes("verdu") ||
    rubroLower.includes("frut") ||
    rubroLower.includes("pesable") ||
    rubroLower.includes("granel")
  ) {
    return "pesable";
  }

  // General (Kiosco, Drugstore, etc.)
  return "general";
}

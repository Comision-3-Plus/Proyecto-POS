"use client";

import { useEffect, useRef, useState } from "react";

interface UseBarcodeProps {
  onScan: (code: string) => void;
  minLength?: number;
  timeout?: number;
}

/**
 * Hook para detectar códigos de barras escaneados con un lector USB
 * que simula un teclado. Acumula las teclas hasta que detecta un Enter.
 */
export function useBarcodeScanner({
  onScan,
  minLength = 3,
  timeout = 100,
}: UseBarcodeProps) {
  const bufferRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorar si está escribiendo en un input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Si presiona Enter, procesar el buffer
      if (e.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          onScan(bufferRef.current);
        }
        bufferRef.current = "";
        return;
      }

      // Acumular caracteres alfanuméricos
      if (/^[a-zA-Z0-9]$/.test(e.key)) {
        bufferRef.current += e.key;

        // Reset timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Si pasa mucho tiempo sin escribir, resetear buffer
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = "";
        }, timeout);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onScan, minLength, timeout]);
}

/**
 * Hook para mantener el foco en el input del scanner
 */
export function useAutoFocus() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        document.activeElement !== inputRef.current &&
        inputRef.current
      ) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return inputRef;
}

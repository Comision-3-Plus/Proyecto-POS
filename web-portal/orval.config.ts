/**
 * 🎯 ORVAL CONFIGURATION - CODE GENERATION ENGINE
 * 
 * Este archivo configura Orval para generar automáticamente:
 * - Tipos TypeScript desde el OpenAPI schema
 * - Hooks de React Query para cada endpoint
 * - Cliente Axios personalizado con autenticación JWT
 * 
 * @see https://orval.dev/
 */

import { defineConfig } from 'orval';

export default defineConfig({
  'nexus-pos-api': {
    /**
     * INPUT: Especificación OpenAPI 3.1
     * Puede ser un archivo local o URL del backend
     */
    input: {
      target: '../ORVAL.json',
      // Alternativa: usar la URL del backend en producción
      // target: 'http://localhost:8000/api/v1/openapi.json',
    },

    /**
     * OUTPUT: Configuración de generación
     */
    output: {
      mode: 'tags-split', // Genera archivos por tag (Auth, Productos, Ventas, etc.)
      target: './src/api/generated/endpoints.ts',
      schemas: './src/api/generated/models',
      client: 'react-query', // 🔥 CRÍTICO: Genera hooks de React Query
      clean: true, // Limpia archivos generados anteriormente
      
      /**
       * 🔒 CUSTOM INSTANCE: Axios con JWT automático
       * Este mutator inyecta el token en cada request
       */
      override: {
        mutator: {
          path: './src/api/custom-instance.ts',
          name: 'customInstance',
        },
        
        /**
         * Configuración de React Query
         */
        query: {
          useQuery: true,
          useMutation: true,
          signal: true, // Soporte para AbortController
          version: 5, // TanStack Query v5
        },

        /**
         * Headers personalizados
         */
        header: (info) => [
          '/**',
          ` * 🤖 GENERADO AUTOMÁTICAMENTE POR ORVAL`,
          ` * ⚠️ NO EDITAR MANUALMENTE - Se sobrescribirá en la próxima generación`,
          ` * `,
          ` * Endpoint: ${info.operationName}`,
          ` * Tag: ${info.tags}`,
          ` * Generado: ${new Date().toISOString()}`,
          ' */',
        ],
      },
    },

    /**
     * HOOKS: Ejecutar prettier después de la generación
     */
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
});

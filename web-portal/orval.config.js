/**
 * Configuración de Orval para generar cliente API
 */
module.exports = {
  nexusPosAPI: {
    input: {
      target: './ORVAL.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated',
      schemas: './src/types/generated',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/lib/api-client.ts',
          name: 'apiClient',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
};

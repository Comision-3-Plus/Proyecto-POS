/**
 * Variables de entorno tipadas
 */

interface Env {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_APP_NAME: string;
  NEXT_PUBLIC_APP_VERSION: string;
}

function getEnvVar(key: keyof Env, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    throw new Error(`Variable de entorno ${key} no está definida`);
  }
  
  return value || defaultValue!;
}

export const env = {
  apiUrl: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:8000'),
  appName: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Nexus POS'),
  appVersion: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
} as const;

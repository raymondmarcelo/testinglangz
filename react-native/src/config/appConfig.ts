export type RuntimeEnvironment = 'development' | 'staging' | 'production';

export type AppConfig = {
  appName: string;
  environment: RuntimeEnvironment;
  apiBaseUrl: string;
};

const allowedEnvironments = new Set<RuntimeEnvironment>(['development', 'staging', 'production']);

export function resolveEnvironment(value: string | undefined): RuntimeEnvironment {
  if (value && allowedEnvironments.has(value as RuntimeEnvironment)) {
    return value as RuntimeEnvironment;
  }

  return 'development';
}

export function getAppConfig(): AppConfig {
  const appName = process.env.RN_PUBLIC_APP_NAME ?? 'Template Repo Mobile React Native';
  const environment = resolveEnvironment(process.env.RN_PUBLIC_APP_ENV);
  const apiBaseUrl = process.env.RN_PUBLIC_API_BASE_URL ?? 'https://api.example.com';

  return {
    appName,
    environment,
    apiBaseUrl,
  };
}

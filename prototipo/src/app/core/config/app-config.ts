import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  apiBaseUrl: string;
  cdnBaseUrl: string;
  portalDemoUrl: string;
}

interface RuntimeConfigOverrides extends Partial<AppConfig> {}

export const APP_CONFIG = new InjectionToken<AppConfig>('QUIPUX_APP_CONFIG');

function normalizeBaseUrl(value: string | undefined): string {
  return String(value ?? '').replace(/\/+$/, '');
}

export function resolveAppConfig(): AppConfig {
  const overrides = typeof window === 'undefined'
    ? {}
    : ((window as Window & { __QUIPUX_APP_CONFIG__?: RuntimeConfigOverrides }).__QUIPUX_APP_CONFIG__ ?? {});

  return {
    apiBaseUrl: normalizeBaseUrl(overrides.apiBaseUrl ?? environment.apiBaseUrl),
    cdnBaseUrl: normalizeBaseUrl(overrides.cdnBaseUrl ?? environment.cdnBaseUrl),
    portalDemoUrl: normalizeBaseUrl(overrides.portalDemoUrl ?? environment.portalDemoUrl)
  };
}

import type { DumbqlPlugin } from '@dumbql/core';
import { otelMiddleware, type OtelMiddlewareConfig } from '../middleware';

export function otelPlugin(config?: OtelMiddlewareConfig): DumbqlPlugin {
  const mw = otelMiddleware(config);
  return {
    name: 'opentelemetry',
    getMiddleware: () => mw,
  };
}

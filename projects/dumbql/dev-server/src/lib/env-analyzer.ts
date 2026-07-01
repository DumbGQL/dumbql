export type RuntimeEnv = 'local' | 'stackblitz' | 'codespaces' | 'unknown';

export interface EnvInfo {
  runtime: RuntimeEnv;
  /** Whether absolute localhost URLs in proxied content should be rewritten */
  needsUrlRewrite: boolean;
  /** The public-facing host of the Angular dev server, if determinable */
  publicFrontendHost: string | null;
}

export function analyzeEnvironment(): EnvInfo {
  const isStackBlitz = !!process.env.STACKBLITZ;
  const isCodespaces = !!process.env.CODESPACES;

  if (isStackBlitz) {
    return {
      runtime: 'stackblitz',
      needsUrlRewrite: true,
      publicFrontendHost: null,
    };
  }

  if (isCodespaces) {
    return {
      runtime: 'codespaces',
      needsUrlRewrite: true,
      publicFrontendHost: null,
    };
  }

  return {
    runtime: 'local',
    needsUrlRewrite: false,
    publicFrontendHost: null,
  };
}

/**
 * Derive the public frontend host from the incoming request's Host header.
 * Works for StackBlitz where ports are exposed as `{hash}-{port}.csb.app`.
 */
export function resolvePublicFrontendHost(
  incomingHost: string,
  frontendPort = 4200,
  devServerPort = 4000,
): string | null {
  const match = incomingHost.match(/^(.+)-(\d+)\.(.+)$/);
  if (!match) return null;
  const hash = match[1];
  const port = Number(match[2]);
  const domain = match[3];
  if (port !== devServerPort) return null;
  return `${hash}-${frontendPort}.${domain}`;
}

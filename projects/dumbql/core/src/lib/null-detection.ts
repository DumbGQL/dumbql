import { inject, ENVIRONMENT_INITIALIZER, type Provider } from '@angular/core';
import { tap } from 'rxjs/operators';
import type { GraphQLResult } from './graphql.service';
import type { GraphqlMiddleware, GraphqlRequestContext } from './middleware';
import { NullDetectionService } from './null-detection.service';
import { walkObject, extractOpName } from '@dumbql/client';

export function nullDetectionMiddleware(): GraphqlMiddleware {
  let detector: NullDetectionService | null = null;

  return (request: GraphqlRequestContext, next) => {
    if (!detector) {
      try {
        detector = inject(NullDetectionService);
      } catch {
        return next(request);
      }
    }

    const operationName = extractOpName(request.query);

    return next(request).pipe(
      tap((result: GraphQLResult<unknown>) => {
        if (result.status === 'error') {
          detector!.reportError(operationName, result.error);
          return;
        }

        if (result.status === 'success' && result.data !== null && result.data !== undefined) {
          const nulls = walkObject(result.data, 'data', operationName);
          for (const n of nulls) {
            detector!.reportNull(n.operationName, n.path);
          }
        }
      }),
    );
  };
}

export function provideNullDetection(): Provider[] {
  return [
    NullDetectionService,
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useFactory: () => {
        const svc = inject(NullDetectionService);
        return () => svc;
      },
    },
  ];
}

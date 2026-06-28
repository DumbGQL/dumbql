import { Injectable, inject } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { print, type DocumentNode, type DumbqlConfig, DUMBQL_CONFIG } from '@dumbql/core';
import { GraphqlSubscription } from './graphql-subscription';
import { SUBSCRIPTIONS_CONFIG } from './subscriptions-config';

@Injectable({ providedIn: 'root' })
export class GraphqlSubscriptionService {
  private readonly config: DumbqlConfig =
    inject(DUMBQL_CONFIG, { optional: true }) ?? { endpoint: '/graphql' } as DumbqlConfig;

  private readonly subsConfig = inject(SUBSCRIPTIONS_CONFIG, { optional: true });

  private readonly core = new GraphqlSubscription(
    this.subsConfig?.wsUrl ?? this.config.endpoint ?? '/graphql',
  );

  subscribe<T>(
    document: DocumentNode,
    variables?: Record<string, unknown>,
  ): Observable<T> {
    const query = print(document);

    return new Observable<T>((subscriber: Subscriber<T>) => {
      const unsubscribe = this.core.subscribe<T>(query, variables, {
        next: (data) => subscriber.next(data),
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
      return () => unsubscribe();
    });
  }
}

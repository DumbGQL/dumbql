import { type Provider } from '@angular/core';
import { SUBSCRIPTIONS_CONFIG, type SubscriptionsConfig } from './subscriptions-config';

export function provideDumbqlSubscriptions(config?: SubscriptionsConfig): Provider[] {
  return config ? [{ provide: SUBSCRIPTIONS_CONFIG, useValue: config }] : [];
}

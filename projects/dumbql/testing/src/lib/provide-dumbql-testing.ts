import { type Provider } from '@angular/core';
import { MockGraphqlService } from './mock-graphql.service';

export function provideDumbqlTesting(): Provider[] {
	return [MockGraphqlService];
}

import { Directive, inject, effect, afterRenderEffect, DestroyRef, input } from '@angular/core';
import type { Observable } from 'rxjs';
import type { GraphQLResult } from '../graphql.service';
import { GraphqlService } from '../graphql.service';
import type { DocumentNode } from '../gql';

@Directive({
	selector: '[dumbqlAutoFetch]',
	standalone: true,
})
export class DumbqlAutoFetchDirective {
	readonly dumbqlAutoFetchDoc = input<DocumentNode | null>(null);
	readonly dumbqlAutoFetchVars = input<Record<string, unknown>>({});
	readonly dumbqlAutoFetchInterval = input(30_000);

	private readonly graphql = inject(GraphqlService);
	private readonly destroyRef = inject(DestroyRef);

	private fetchCount = 0;

	constructor() {
		let currentObs: Observable<GraphQLResult<unknown>> | null = null;
		let sub: ReturnType<Observable<GraphQLResult<unknown>>['subscribe']> | null = null;

		effect(() => {
			const doc = this.dumbqlAutoFetchDoc();
			const vars = this.dumbqlAutoFetchVars();
			const interval = this.dumbqlAutoFetchInterval();

			if (!doc) return;

			sub?.unsubscribe();
			currentObs = this.graphql.poll(doc, interval, vars);
			sub = currentObs.subscribe();
		});

		afterRenderEffect(() => {
			this.fetchCount++;
		});

		this.destroyRef.onDestroy(() => sub?.unsubscribe());
	}
}

import {
	Directive,
	inject,
	effect,
	afterRenderEffect,
	DestroyRef,
	input,
	Injector,
	TemplateRef,
	ViewContainerRef,
	signal,
	type Signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject, switchMap, of, catchError, tap } from 'rxjs';
import type { DocumentNode } from '../gql';
import { GraphqlService, type GraphQLResult } from '../graphql.service';

export interface DumbqlQueryContext<T> {
	$implicit: GraphQLResult<T>;
	result: GraphQLResult<T>;
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

@Directive({
	selector: '[dumbqlQuery]',
	standalone: true,
})
export class DumbqlQueryDirective<T = unknown> {
	readonly dumbqlQueryDoc = input<DocumentNode | null>(null);
	readonly dumbqlQueryVars = input<Record<string, unknown>>({});

	private readonly graphql = inject(GraphqlService);
	private readonly injector = inject(Injector);
	private readonly templateRef = inject(TemplateRef<DumbqlQueryContext<T>>);
	private readonly viewContainer = inject(ViewContainerRef);
	private readonly destroyRef = inject(DestroyRef);

	private readonly refetch$ = new Subject<void>();
	private readonly doc$ = toObservable(this.dumbqlQueryDoc, { injector: this.injector });
	private readonly vars$ = toObservable(this.dumbqlQueryVars, { injector: this.injector });

	private readonly resultSignal = signal<GraphQLResult<T> | null>(null);
	private readonly loadingSignal = signal(true);

	protected readonly result: Signal<GraphQLResult<T> | null> = this.resultSignal;
	protected readonly loading: Signal<boolean> = this.loadingSignal;

	private viewRef: ReturnType<typeof this.viewContainer.createEmbeddedView> | null = null;

	constructor() {
		const query$ = this.refetch$.pipe(
			switchMap(() =>
				this.doc$.pipe(
					switchMap((doc) => {
						if (!doc) return of(null);
						return this.vars$.pipe(
							switchMap((vars) =>
								this.graphql.query<T>(doc, vars).pipe(
									tap({
										next: () => this.loadingSignal.set(false),
										error: () => this.loadingSignal.set(false),
									}),
									catchError((err: unknown) => {
										this.loadingSignal.set(false);
										const msg = err instanceof Error ? err.message : 'Query failed';
										return of({ status: 'error' as const, error: msg });
									}),
								),
							),
						);
					}),
				),
			),
		);

		const sub = query$.subscribe((r) => this.updateView(r));
		this.destroyRef.onDestroy(() => sub.unsubscribe());

		effect(() => {
			this.dumbqlQueryDoc();
			this.dumbqlQueryVars();
			this.refetch$.next();
		});

		afterRenderEffect(() => {
			const loading = this.loading();
			const result = this.result();
			if (!loading && result) {
				const el = (this.viewRef?.rootNodes[0] as HTMLElement | undefined);
				el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		});
	}

	/** Expose refetch so callers can trigger manual re-fetch. */
	refetch(): void {
		this.refetch$.next();
	}

	private updateView(r: GraphQLResult<T> | null): void {
		this.resultSignal.set(r);
		if (!r) {
			this.viewContainer.clear();
			this.viewRef = null;
			return;
		}

		if (!this.viewRef) {
			this.viewRef = this.viewContainer.createEmbeddedView(this.templateRef, {
				$implicit: r,
				result: r,
				loading: this.loadingSignal(),
				error: r.status === 'error' ? r.error : null,
				refetch: () => this.refetch(),
			});
		} else {
			const ctx = this.viewRef.context as DumbqlQueryContext<T>;
			ctx.$implicit = r;
			ctx.result = r;
			ctx.loading = this.loadingSignal();
			ctx.error = r.status === 'error' ? r.error : null;
			this.viewRef.markForCheck();
		}
	}
}

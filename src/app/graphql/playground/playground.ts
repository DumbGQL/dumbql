import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuiButton } from '@taiga-ui/core';
import { parse } from 'graphql';
import { GraphqlService, type GraphQLResult } from '@dumbql/core';

interface HistoryEntry {
	query: string;
	variables: string;
	result: GraphQLResult<unknown> | null;
	timestamp: number;
}

@Component({
	selector: 'app-graphql-playground',
	standalone: true,
	imports: [FormsModule, TuiButton],
	templateUrl: './playground.html',
	styleUrl: './playground.scss',
})
export class GraphqlPlayground {
	private readonly graphql = inject(GraphqlService);

	protected query = signal(`query {
  __typename
}`);
	protected variables = signal('{\n  \n}');
	protected headers = signal('{\n  "Content-Type": "application/json"\n}');
	protected result = signal<GraphQLResult<unknown> | null>(null);
	protected loading = signal(false);
	protected error = signal('');
	protected history = signal<HistoryEntry[]>([]);

	protected async execute(): Promise<void> {
		this.loading.set(true);
		this.error.set('');
		this.result.set(null);

		let vars: Record<string, unknown> = {};
		try {
			const v = this.variables().trim();
			if (v) vars = JSON.parse(v);
		} catch {
			this.error.set('Invalid JSON in variables');
			this.loading.set(false);
			return;
		}

		try {
			const doc = parse(this.query());
			this.graphql.query(doc, vars).subscribe({
				next: (res) => {
					this.result.set(res);
					this.history.update((h) => [
						{ query: this.query(), variables: this.variables(), result: res, timestamp: Date.now() },
						...h,
					]);
					this.loading.set(false);
				},
				error: (err: unknown) => {
					this.error.set(String(err));
					this.loading.set(false);
				},
			});
		} catch (err) {
			this.error.set(`Query parse error: ${err instanceof Error ? err.message : String(err)}`);
			this.loading.set(false);
		}
	}

	protected formatJson(obj: unknown): string {
		try {
			return JSON.stringify(obj, null, 2);
		} catch {
			return String(obj);
		}
	}

	protected clearHistory(): void {
		this.history.set([]);
	}

	protected restore(entry: HistoryEntry): void {
		this.query.set(entry.query);
		this.variables.set(entry.variables);
		this.result.set(entry.result);
	}
}

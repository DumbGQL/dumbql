import { Injectable, signal } from '@angular/core';
import type { TocSection } from '../ui/docs-toc/docs-toc';

@Injectable({ providedIn: 'root' })
export class TocService {
	readonly sections = signal<TocSection[]>([]);
	readonly open = signal(false);

	toggle(): void {
		this.open.update((v) => !v);
	}

	close(): void {
		this.open.set(false);
	}
}

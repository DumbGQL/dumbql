import { Component, input, signal, afterRenderEffect, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';

export interface TocSection {
	id: string;
	title: string;
	children?: TocSection[];
}

@Component({
	selector: 'app-docs-toc',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './docs-toc.html',
	styleUrl: './docs-toc.scss',
})
export class DocsToc implements OnInit, OnDestroy {
	readonly sections = input.required<TocSection[]>();

	protected activeId = signal('');

	private readonly headerOffset = 100;
	private rafId = 0;
	private scrollCleanup: (() => void) | null = null;

	constructor() {
		afterRenderEffect(() => this.updateActiveSection());
	}

	ngOnInit(): void {
		const el = document.querySelector('.docs-content') ?? document.documentElement;
		const onScroll = () => {
			cancelAnimationFrame(this.rafId);
			this.rafId = requestAnimationFrame(() => this.updateActiveSection());
		};
		el.addEventListener('scroll', onScroll, { passive: true });
		this.scrollCleanup = () => el.removeEventListener('scroll', onScroll);
	}

	ngOnDestroy(): void {
		this.scrollCleanup?.();
		cancelAnimationFrame(this.rafId);
	}

	protected scrollTo(id: string): void {
		const el = document.getElementById(id);
		if (el) {
			history.replaceState(null, '', `#${id}`);
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	private updateActiveSection(): void {
		const ids = this.flattenSections();
		let active = ids[0] ?? '';

		for (const id of ids) {
			const el = document.getElementById(id);
			if (!el) continue;
			const rect = el.getBoundingClientRect();
			if (rect.top <= this.headerOffset + 1) {
				active = id;
			} else {
				break;
			}
		}

		this.activeId.set(active);
	}

	private flattenSections(): string[] {
		const result: string[] = [];
		const walk = (list: TocSection[]) => {
			for (const s of list) {
				result.push(s.id);
				if (s.children) walk(s.children);
			}
		};
		walk(this.sections());
		return result;
	}
}

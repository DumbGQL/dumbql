import { Directive, ElementRef, inject, AfterViewInit } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

@Directive({
	selector: '[appAnchor]',
	standalone: true,
})
export class AnchorDirective implements AfterViewInit {
	private readonly el = inject(ElementRef<HTMLElement>);
	private readonly clipboard = inject(Clipboard);

	ngAfterViewInit(): void {
		const el = this.el.nativeElement;
		const id = el.id || this.slugify(el.textContent ?? '');
		el.id = id;
		el.style.position = 'relative';

		const btn = document.createElement('button');
		btn.className = 'anchor-btn';
		btn.setAttribute('aria-label', 'Copy link to this section');
		const svg =
			'<svg width="16" height="16" viewBox="0 0 24 24" fill="none"' +
			' stroke="currentColor" stroke-width="2.5" stroke-linecap="round"' +
			' stroke-linejoin="round">' +
			'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
			'<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>' +
			'</svg>';
		btn.innerHTML = svg;
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			const url = window.location.href.split('#')[0] + '#' + id;
			this.clipboard.copy(url);
		});
		el.appendChild(btn);
	}

	private slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}
}

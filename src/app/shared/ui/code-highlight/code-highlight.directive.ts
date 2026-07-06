import { Directive, ElementRef, inject, OnDestroy, AfterViewInit } from '@angular/core';
import hljs from 'highlight.js';

@Directive({
  selector: '[appCodeHighlight]',
  standalone: true,
})
export class CodeHighlightDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private observer?: MutationObserver;

  ngAfterViewInit(): void {
    this.highlight();
    this.observer = new MutationObserver(() => this.highlight());
    this.observer.observe(this.el.nativeElement, { childList: true, subtree: true, characterData: true });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private highlight(): void {
    const blocks = this.el.nativeElement.querySelectorAll('pre code');
    blocks.forEach((block: Element) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }
}

import { Directive, ElementRef, inject, AfterViewInit } from '@angular/core';
import hljs from 'highlight.js';

@Directive({
  selector: '[appCodeHighlight]',
  standalone: true,
})
export class CodeHighlightDirective implements AfterViewInit {
  private readonly el = inject(ElementRef<HTMLElement>);

  ngAfterViewInit(): void {
    const blocks = this.el.nativeElement.querySelectorAll('pre code');
    blocks.forEach((block: Element) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }
}

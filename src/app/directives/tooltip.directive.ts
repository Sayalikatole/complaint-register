import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective {
  @Input('appTooltip') tooltipText: string = '';

  private tooltip: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  @HostListener('mouseenter') onMouseEnter() {
    if (!this.tooltip) {
      this.showTooltip();
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (this.tooltip) {
      this.hideTooltip();
    }
  }

  private showTooltip() {
    this.tooltip = this.renderer.createElement('div');

    if (this.tooltip) {
      this.renderer.addClass(this.tooltip, 'tooltip');
      this.renderer.setStyle(this.tooltip, 'position', 'absolute');
      this.renderer.setStyle(this.tooltip, 'background', 'rgba(0, 0, 0, 0.8)');
      this.renderer.setStyle(this.tooltip, 'color', 'white');
      this.renderer.setStyle(this.tooltip, 'padding', '5px 10px');
      this.renderer.setStyle(this.tooltip, 'border-radius', '4px');
      this.renderer.setStyle(this.tooltip, 'font-size', '12px');
      this.renderer.setStyle(this.tooltip, 'z-index', '10000');
      this.renderer.setStyle(this.tooltip, 'max-width', '200px');
      this.renderer.setStyle(this.tooltip, 'word-wrap', 'break-word');

      const text = this.renderer.createText(this.tooltipText);
      this.renderer.appendChild(this.tooltip, text);
      this.renderer.appendChild(document.body, this.tooltip);

      // Position the tooltip
      const hostPos = this.el.nativeElement.getBoundingClientRect();
      const tooltipPos = this.tooltip.getBoundingClientRect();

      const top = hostPos.top - tooltipPos.height - 10;
      const left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;

      this.renderer.setStyle(this.tooltip, 'top', `${top + window.scrollY}px`);
      this.renderer.setStyle(this.tooltip, 'left', `${left + window.scrollX}px`);
    }
  }

  private hideTooltip() {
    if (this.tooltip) {
      this.renderer.removeChild(document.body, this.tooltip);
      this.tooltip = null;
    }
  }
}
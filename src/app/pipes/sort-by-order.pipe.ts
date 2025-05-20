import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortByOrder',
  standalone: true
})
export class SortByOrderPipe implements PipeTransform {
  transform(items: any[], field: string = 'option_order', descending: boolean = true): any[] {
    if (!items || !Array.isArray(items)) return items;

    return [...items].sort((a, b) => {
      const valA = parseInt(a[field], 10);
      const valB = parseInt(b[field], 10);

      return descending
        ? valB - valA  // Descending (higher numbers first)
        : valA - valB; // Ascending (lower numbers first)
    });
  }
}
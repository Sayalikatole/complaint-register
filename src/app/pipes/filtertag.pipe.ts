import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtertag',
  standalone: true
})
export class FiltertagPipe implements PipeTransform {
  transform(tags: any[], searchTerm: string): any[] {
    if (!tags || !searchTerm) return tags || [];

    const term = searchTerm.toLowerCase();
    return tags.filter(tag =>
      tag.tag_name.toLowerCase().includes(term)
    );
  }

}

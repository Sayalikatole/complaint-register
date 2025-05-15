import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'findtag',
  standalone: true
})
export class FindtagPipe implements PipeTransform {
  transform(tags: any[], tagId: string): any {
    if (!tags || !tagId) return null;
    return tags.find(t => t.tag_id === tagId);
  }

}

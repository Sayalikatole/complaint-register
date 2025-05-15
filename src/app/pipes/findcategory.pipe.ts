import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'findcategory',
  standalone: true
})
export class FindcategoryPipe implements PipeTransform {
  transform(categories: any[], categoryId: string): any {
    if (!categories || !categoryId) return null;
    return categories.find(c => c.category_id === categoryId);
  }

}

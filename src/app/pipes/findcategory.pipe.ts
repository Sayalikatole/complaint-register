import { Pipe, PipeTransform } from '@angular/core';
import { Category } from '../models/category';

@Pipe({
  name: 'findcategory',
  standalone: true
})
export class FindcategoryPipe implements PipeTransform {
  transform(categories: Category[], param: string, isFilter: boolean = false): any {
    if (!categories || !param) {
      return isFilter ? categories : null;
    }

    if (isFilter) {
      // Filter mode - returns array of categories that match search term
      const searchTerm = param.toLowerCase();
      return categories.filter(category =>
        category.category_name.toLowerCase().includes(searchTerm)
      );
    } else {
      // Find mode - returns single category that matches ID
      const category = categories.find(c => c.category_id === param);
      return category ? category.category_name : null;
    }
  }
}
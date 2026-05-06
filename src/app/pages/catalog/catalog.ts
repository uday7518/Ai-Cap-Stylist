import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../services/product';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css'
})
export class CatalogComponent {
  selectedCategory = 'All';

  categories = ['All', 'Beach', 'Dinner', 'Vacation', 'Picnic', 'Sports', 'Casual'];

  caps: any[] = [];

  constructor(private productService: Product) {
    this.caps = this.productService.getProducts();
  }

  get filteredCaps() {
    if (this.selectedCategory === 'All') {
      return this.caps;
    }

    return this.caps.filter(cap => cap.category === this.selectedCategory);
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }
}
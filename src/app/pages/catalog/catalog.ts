import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseProduct } from '../../services/firebase-product';

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

  constructor(private productService: FirebaseProduct) {
    this.loadCaps();
  }

  loadCaps() {
    this.productService.getProducts().subscribe({
      next: (data: any[]) => {
        console.log('Catalog Firebase products:', data);
        this.caps = data;
      },
      error: (err) => {
        console.error('Catalog Firebase error:', err);
      }
    });
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
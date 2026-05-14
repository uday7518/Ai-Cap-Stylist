import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseProduct } from '../../services/firebase-product';
import { Cart } from '../../services/cart';

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
  filteredCaps: any[] = [];

  constructor(
    private productService: FirebaseProduct,
    private cartService: Cart,
    private cdr: ChangeDetectorRef
  ) {
    this.loadCaps();
  }

  loadCaps() {
    this.productService.getProducts().subscribe({
      next: (data: any[]) => {
        console.log('Catalog Firebase products:', data);
        this.caps = data;
        this.selectedCategory = 'All';
        this.filterCaps();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Catalog Firebase error:', err);
      }
    });
  }

  filterCaps() {
    const selected = this.selectedCategory?.trim().toLowerCase();

    if (!selected || selected === 'all') {
      this.filteredCaps = this.caps;
      return;
    }

    this.filteredCaps = this.caps.filter(
      cap => cap.category?.trim().toLowerCase() === selected
    );
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.filterCaps();
  }

  addToCart(cap: any) {
    this.cartService.addToCart(cap);
  }

  decreaseQuantity(cap: any) {
    this.cartService.decreaseQuantity(cap.id);
  }

  getQuantity(cap: any) {
    return this.cartService.getProductQuantity(cap.id);
  }
}

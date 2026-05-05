import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  caps = [
    {
      name: 'Beach Vibe Cap',
      category: 'Beach',
      price: 20,
      image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee'
    },
    {
      name: 'Ocean Blue Cap',
      category: 'Beach',
      price: 22,
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c'
    },
    {
      name: 'Elegant Black Cap',
      category: 'Dinner',
      price: 28,
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b'
    },
    {
      name: 'Vacation Beige Cap',
      category: 'Vacation',
      price: 24,
      image: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc'
    },
    {
      name: 'Picnic Green Cap',
      category: 'Picnic',
      price: 21,
      image: 'https://images.unsplash.com/photo-1534215754734-18e55d13e346'
    },
    {
      name: 'Sporty Cap',
      category: 'Sports',
      price: 25,
      image: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc'
    },
    {
      name: 'Classic Black Cap',
      category: 'Casual',
      price: 18,
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b'
    }
  ];

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

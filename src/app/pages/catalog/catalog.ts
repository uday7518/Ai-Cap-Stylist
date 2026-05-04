import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog.html',
})
export class CatalogComponent {
  caps = [
    {
      name: 'Beach Vibe Cap',
      category: 'Beach',
      price: 20,
      image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee',
    },
    {
      name: 'Sporty Cap',
      category: 'Sports',
      price: 25,
      image: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc',
    },
    {
      name: 'Classic Black Cap',
      category: 'Casual',
      price: 18,
      image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad',
    },
  ];
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Product {
  private storageKey = 'caps';

  getProducts() {
    const savedCaps = localStorage.getItem(this.storageKey);

    if (savedCaps) {
      return JSON.parse(savedCaps);
    }

    return this.getDefaultCaps();
  }

  saveProducts(caps: any[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(caps));
  }

  addProduct(cap: any) {
    const caps = this.getProducts();
    caps.push(cap);
    this.saveProducts(caps);
  }

  updateProduct(updatedCap: any) {
    const caps = this.getProducts();

    const updatedCaps = caps.map((cap: any) =>
      cap.id === updatedCap.id ? updatedCap : cap
    );

    this.saveProducts(updatedCaps);
  }

  deleteProduct(index: number) {
    const caps = this.getProducts();
    caps.splice(index, 1);
    this.saveProducts(caps);
  }

  deleteProductById(id: number) {
    const caps = this.getProducts();
    const updatedCaps = caps.filter((cap: any) => cap.id !== id);
    this.saveProducts(updatedCaps);
  }

  getDefaultCaps() {
    return [
      {
        id: 1,
        name: 'Beach Vibe Cap',
        category: 'Beach',
        price: 20,
        stock: 40,
        description: 'Lightweight cap perfect for beach trips.',
        image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee'
      },
      {
        id: 2,
        name: 'Sporty Cap',
        category: 'Sports',
        price: 25,
        stock: 35,
        description: 'Comfortable cap for sports and outdoor activities.',
        image: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc'
      },
      {
        id: 3,
        name: 'Classic Black Cap',
        category: 'Casual',
        price: 18,
        stock: 50,
        description: 'Classic black cap for everyday casual wear.',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b'
      }
    ];
  }
}

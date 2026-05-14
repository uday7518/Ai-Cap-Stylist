import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Cart {
  private storageKey = 'cartItems';

  getCartItems() {
    const items = localStorage.getItem(this.storageKey);
    return items ? JSON.parse(items) : [];
  }

  saveCartItems(items: any[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  addToCart(product: any) {
    const cartItems = this.getCartItems();
    const existingItem = cartItems.find((item: any) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({ ...product, quantity: 1 });
    }

    this.saveCartItems(cartItems);
  }

  decreaseQuantity(productId: string) {
    let cartItems = this.getCartItems();
    const item = cartItems.find((item: any) => item.id === productId);

    if (item) {
      item.quantity -= 1;

      if (item.quantity <= 0) {
        cartItems = cartItems.filter((item: any) => item.id !== productId);
      }
    }

    this.saveCartItems(cartItems);
  }

  getProductQuantity(productId: string) {
    const cartItems = this.getCartItems();
    const item = cartItems.find((item: any) => item.id === productId);
    return item ? item.quantity : 0;
  }

  removeFromCart(productId: string) {
    const cartItems = this.getCartItems().filter(
      (item: any) => item.id !== productId
    );

    this.saveCartItems(cartItems);
  }

  clearCart() {
    localStorage.removeItem(this.storageKey);
  }
}

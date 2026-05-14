import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cart } from '../../services/cart';

@Component({
  selector: 'app-cart',
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class CartComponent {

  cartItems: any[] = [];

  constructor(private cartService: Cart) {
    this.loadCart();
  }

  loadCart() {
    this.cartItems = this.cartService.getCartItems();
  }

  increaseQuantity(item: any) {
    this.cartService.addToCart(item);
    this.loadCart();
  }

  decreaseQuantity(item: any) {
    this.cartService.decreaseQuantity(item.id);
    this.loadCart();
  }

  removeItem(id: string) {
    this.cartService.removeFromCart(id);
    this.loadCart();
  }

  getTotal() {
    return this.cartItems.reduce(
      (total, item) => total + (item.price * item.quantity),
      0
    );
  }
}

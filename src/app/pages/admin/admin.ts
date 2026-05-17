import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../../firebase.config';
import { FirebaseOrder } from '../../services/firebase-order';
import { FirebaseProduct } from '../../services/firebase-product';
import { FirebaseStore } from '../../services/firebase-store';

const emptyCap = () => ({
  name: '',
  category: '',
  price: null,
  stock: null,
  image: '',
  description: ''
});

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {
  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;

  caps: any[] = [];
  filteredCaps: any[] = [];

  categories = ['Beach', 'Dinner', 'Vacation', 'Picnic', 'Sports', 'Casual'];
  selectedCategory = 'All';
  activeTab = 'dashboard';
  isEditMode = false;

  newCap: any = emptyCap();
  orders: any[] = [];
  stores: any[] = [];

  newOrder: any = {
    storeId: '',
    status: 'Pending',
    selectedItems: []
  };

  newStore: any = {
    id: '',
    storeName: '',
    storeAddress: '',
    ownerName: '',
    phone: ''
  };

  isStoreEditMode = false;

  constructor(
    private productService: FirebaseProduct,
    private storeService: FirebaseStore,
    private orderService: FirebaseOrder,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.loadCaps();
    this.loadStores();
    this.loadOrders();
  }

  loadCaps() {
    this.productService.getProducts().subscribe({
      next: (data: any[]) => {
        console.log('Firebase products:', data);
        this.caps = data;
        this.selectedCategory = 'All';
        this.filterCaps();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Firebase load error:', error);
      }
    });
  }

  loadStores() {
    this.storeService.getStores().subscribe({
      next: (data: any[]) => {
        this.stores = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Firebase stores load error:', error);
      }
    });
  }

  loadOrders() {
    this.orderService.getOrders().subscribe({
      next: (data: any[]) => {
        this.orders = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Firebase orders load error:', error);
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

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  get totalCaps() {
    return this.caps.length;
  }

  get totalStock() {
    return this.caps.reduce((total, cap) => total + Number(cap.stock || 0), 0);
  }

  get totalInventoryValue() {
    return this.caps.reduce(
      (total, cap) => total + Number(cap.price || 0) * Number(cap.stock || 0),
      0
    );
  }

  addItemToOrder(cap: any) {
    const existing = this.newOrder.selectedItems.find((item: any) => item.id === cap.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      this.newOrder.selectedItems.push({
        id: cap.id,
        name: cap.name,
        price: cap.price,
        quantity: 1
      });
    }
  }

  getOrderTotal() {
    return this.newOrder.selectedItems.reduce(
      (total: number, item: any) => total + Number(item.price) * Number(item.quantity),
      0
    );
  }

  async saveOrder() {
    if (!this.newOrder.storeId || this.newOrder.selectedItems.length === 0) {
      alert('Please select a store and add at least one cap');
      return;
    }

    const selectedStore = this.stores.find(
      store => String(store.id) === String(this.newOrder.storeId)
    );

    const orderToSave = {
      ...this.newOrder,
      storeName: selectedStore?.storeName,
      storeAddress: selectedStore?.storeAddress,
      ownerName: selectedStore?.ownerName,
      phone: selectedStore?.phone,
      total: this.getOrderTotal(),
      status: 'Pending',
      date: new Date()
    };

    try {
      await this.orderService.addOrder(orderToSave);

      this.newOrder = {
        storeId: '',
        status: 'Pending',
        selectedItems: []
      };

      this.cdr.detectChanges();
      alert('Order saved successfully!');
    } catch (error) {
      console.error('Order save error:', error);
      alert('Something went wrong while saving order');
    }
  }

  async updateOrderStatus(order: any) {
    try {
      await this.orderService.updateOrderStatus(order.id, order.status);
    } catch (error) {
      console.error('Order status update error:', error);
      alert('Something went wrong while updating order status');
    }
  }

  async deleteOrder(orderId: string) {
    try {
      await this.orderService.deleteOrder(orderId);
    } catch (error) {
      console.error('Order delete error:', error);
      alert('Something went wrong while deleting order');
    }
  }

  async addStore() {
    if (
      !this.newStore.storeName ||
      !this.newStore.storeAddress ||
      !this.newStore.ownerName ||
      !this.newStore.phone
    ) {
      alert('Please fill all store fields');
      return;
    }

    try {
      let successMessage = 'Store added successfully!';

      if (this.isStoreEditMode) {
        await this.storeService.updateStore(this.newStore);
        successMessage = 'Store updated successfully!';
      } else {
        await this.storeService.addStore(this.newStore);
      }

      this.resetStoreForm();
      alert(successMessage);
    } catch (error) {
      console.error('Store save error:', error);
      alert('Something went wrong while saving store');
    }
  }

  editStore(store: any) {
    this.newStore = { ...store };
    this.isStoreEditMode = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteStore(storeId: string) {
    await this.storeService.deleteStore(storeId);
  }

  resetStoreForm() {
    this.newStore = {
      id: '',
      storeName: '',
      storeAddress: '',
      ownerName: '',
      phone: ''
    };

    this.isStoreEditMode = false;
    this.cdr.detectChanges();
  }

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      this.newCap.image = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  async addCap() {
    if (
      !this.newCap.name ||
      !this.newCap.category ||
      !this.newCap.price ||
      !this.newCap.stock ||
      !this.newCap.image ||
      !this.newCap.description
    ) {
      alert('Please fill all fields');
      return;
    }

    try {
      if (this.isEditMode) {
        await this.productService.updateProduct(this.newCap);
        alert('Cap updated successfully!');
      } else {
        await this.productService.addProduct({ ...this.newCap });
        alert('Cap added successfully!');
      }

      this.resetForm();
    } catch (error) {
      console.error('Save error:', error);
      alert('Something went wrong while saving cap');
    }
  }

  editCap(cap: any) {
    this.newCap = { ...cap };
    this.isEditMode = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteCap(cap: any) {
    await this.productService.deleteProduct(cap.id);
    this.resetForm();
  }

  logout() {
    signOut(firebaseAuth).then(() => {
      this.router.navigate(['/login']);
    });
  }

  resetForm() {
    this.newCap = emptyCap();
    this.isEditMode = false;

    if (this.imageInput?.nativeElement) {
      this.imageInput.nativeElement.value = '';
    }

    this.cdr.detectChanges();
  }
}

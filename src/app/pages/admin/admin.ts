import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../../firebase.config';
import { FirebaseOrder } from '../../services/firebase-order';
import { FirebaseProduct } from '../../services/firebase-product';
import { FirebaseStore } from '../../services/firebase-store';
import { InvoicePdfService } from '../../services/invoice-pdf';

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
    newItems: [],
    returnItems: [],
    notes: ''
  };

  selectedInvoiceOrder: any = null;
  invoiceSaved = false;
  savedInvoicePayload: any = null;

  invoiceData: any = {
    paymentMethod: 'Cash',
    checkNumber: '',
    amountPaid: null,
    invoiceNotes: ''
  };

  newStore: any = {
    id: '',
    storeName: '',
    storeAddress: '',
    ownerName: '',
    phone: '',
    email: ''
  };

  isStoreEditMode = false;

  constructor(
    private productService: FirebaseProduct,
    private storeService: FirebaseStore,
    private orderService: FirebaseOrder,
    private invoicePdfService: InvoicePdfService,
    private http: HttpClient,
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

  canAddOrderItems() {
    if (!this.newOrder.storeId) {
      alert('Please select a store first.');
      return false;
    }

    return true;
  }

  addNewOrderItem(cap: any) {
    if (!this.canAddOrderItems()) return;

    const existing = this.newOrder.newItems.find((item: any) => item.id === cap.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      this.newOrder.newItems.push({
        id: cap.id,
        name: cap.name,
        price: Number(cap.price),
        quantity: 1
      });
    }
  }

  addReturnItem(cap: any) {
    if (!this.canAddOrderItems()) return;

    const existing = this.newOrder.returnItems.find((item: any) => item.id === cap.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      this.newOrder.returnItems.push({
        id: cap.id,
        name: cap.name,
        price: Number(cap.price),
        quantity: 1
      });
    }
  }

  addItemToOrder(cap: any) {
    this.addNewOrderItem(cap);
  }

  getNewOrderQty(cap: any) {
    const item = this.newOrder.newItems.find((i: any) => i.id === cap.id);
    return item ? item.quantity : 0;
  }

  getReturnQty(cap: any) {
    const item = this.newOrder.returnItems.find((i: any) => i.id === cap.id);
    return item ? item.quantity : 0;
  }

  decreaseNewOrderCap(cap: any) {
    const item = this.newOrder.newItems.find((i: any) => i.id === cap.id);

    if (!item) return;

    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.newOrder.newItems = this.newOrder.newItems.filter((i: any) => i.id !== cap.id);
    }
  }

  decreaseReturnCap(cap: any) {
    const item = this.newOrder.returnItems.find((i: any) => i.id === cap.id);

    if (!item) return;

    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.newOrder.returnItems = this.newOrder.returnItems.filter((i: any) => i.id !== cap.id);
    }
  }

  increaseNewOrderQty(item: any) {
    item.quantity++;
  }

  decreaseNewOrderQty(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.newOrder.newItems = this.newOrder.newItems.filter((i: any) => i !== item);
    }
  }

  increaseReturnQty(item: any) {
    item.quantity++;
  }

  decreaseReturnQty(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.newOrder.returnItems = this.newOrder.returnItems.filter((i: any) => i !== item);
    }
  }

  getNewOrderTotal() {
    return this.newOrder.newItems.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );
  }

  getReturnTotal() {
    return this.newOrder.returnItems.reduce(
      (total: number, item: any) => total + item.price * item.quantity,
      0
    );
  }

  getFinalInvoiceTotal() {
    return this.getNewOrderTotal() - this.getReturnTotal();
  }

  getOrderTotal() {
    return this.getFinalInvoiceTotal();
  }

  async saveOrder() {
    if (!this.newOrder.storeId) {
      alert('Please select a store');
      return;
    }

    if (
      this.newOrder.newItems.length === 0 &&
      this.newOrder.returnItems.length === 0
    ) {
      alert('Please add at least one order item or return item');
      return;
    }

    const selectedStore = this.stores.find(
      store => store.id === this.newOrder.storeId
    );

    const invoiceToSave = {
      storeId: this.newOrder.storeId,
      storeName: selectedStore?.storeName,
      storeAddress: selectedStore?.storeAddress,
      ownerName: selectedStore?.ownerName,
      phone: selectedStore?.phone,
      email: selectedStore?.email,

      newItems: this.newOrder.newItems,
      returnItems: this.newOrder.returnItems,

      orderTotal: this.getNewOrderTotal(),
      returnTotal: this.getReturnTotal(),
      finalAmount: this.getFinalInvoiceTotal(),

      notes: this.newOrder.notes,
      status: 'Pending',
      date: new Date()
    };

    try {
      await this.orderService.addOrder(invoiceToSave);

      this.newOrder = {
        storeId: '',
        status: 'Pending',
        newItems: [],
        returnItems: [],
        notes: ''
      };

      this.cdr.detectChanges();
      alert('Invoice saved successfully!');
      this.setActiveTab('orders');
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

  openInvoice(order: any) {
    this.selectedInvoiceOrder = order;

    if (order.invoice) {
      // Invoice already saved in DB — pre-fill and lock the form
      this.invoiceSaved = true;
      this.savedInvoicePayload = { invoice: order.invoice, status: order.status };
      this.invoiceData = {
        paymentMethod: order.invoice.paymentMethod || 'Cash',
        checkNumber: order.invoice.checkNumber || '',
        amountPaid: Number((order.finalAmount || order.total || 0).toFixed(2)),
        invoiceNotes: order.invoice.invoiceNotes || ''
      };
    } else {
      this.invoiceSaved = false;
      this.savedInvoicePayload = null;
      this.invoiceData = {
        paymentMethod: 'Cash',
        checkNumber: '',
        amountPaid: Number((order.finalAmount || order.total || 0).toFixed(2)),
        invoiceNotes: ''
      };
    }
  }

  editInvoice() {
    this.invoiceSaved = false;
    this.savedInvoicePayload = null;
    this.cdr.detectChanges();
  }

  closeInvoice() {
    this.selectedInvoiceOrder = null;
    this.invoiceSaved = false;
    this.savedInvoicePayload = null;

    this.invoiceData = {
      paymentMethod: 'Cash',
      checkNumber: '',
      amountPaid: null,
      invoiceNotes: ''
    };
  }

  async saveInvoice() {
    if (!this.selectedInvoiceOrder) return;

    if (!this.invoiceData.paymentMethod) {
      alert('Please select payment method');
      return;
    }

    if (
      this.invoiceData.paymentMethod === 'Check' &&
      !this.invoiceData.checkNumber
    ) {
      alert('Please enter check number');
      return;
    }

    const invoicePayload = {
      invoice: {
        invoiceNumber: `INV-${Date.now()}`,
        paymentMethod: this.invoiceData.paymentMethod,
        checkNumber:
          this.invoiceData.paymentMethod === 'Check'
            ? this.invoiceData.checkNumber
            : '',
        amountPaid: Number(this.invoiceData.amountPaid),
        invoiceNotes: this.invoiceData.invoiceNotes,
        invoiceDate: new Date()
      },
      status: 'Delivered'
    };

    try {
      await this.orderService.updateOrderInvoice(
        this.selectedInvoiceOrder.id,
        invoicePayload
      );

      this.savedInvoicePayload = invoicePayload;
      this.invoiceSaved = true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Invoice save error:', error);
      alert('Something went wrong while saving invoice');
    }
  }

  emailInvoice() {
    if (!this.selectedInvoiceOrder || !this.savedInvoicePayload) return;

    const orderForPdf = {
      ...this.selectedInvoiceOrder,
      ...this.savedInvoicePayload
    };

    const toEmail = this.selectedInvoiceOrder.email;

    // Close the modal immediately
    this.closeInvoice();

    // Generate base64 and email to the store
    const { base64, invoiceNumber } = this.invoicePdfService.generateInvoiceBase64(orderForPdf);

    this.http
      .post('http://localhost:3000/send-invoice', {
        order: orderForPdf,
        pdfBase64: base64,
        invoiceNumber
      })
      .subscribe({
        next: () => {
          alert(`Invoice emailed to ${toEmail} successfully!`);
        },
        error: (err) => {
          console.error('Email send error:', err);
          alert('Email could not be sent. Check backend settings.');
        }
      });
  }

  async addStore() {
    if (
      !this.newStore.storeName ||
      !this.newStore.storeAddress ||
      !this.newStore.ownerName ||
      !this.newStore.phone ||
      !this.newStore.email
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
      phone: '',
      email: ''
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

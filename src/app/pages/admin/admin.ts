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

  // Store filter for Orders tab
  selectedStoreFilter: any = null;
  storeSearchQuery = '';
  storeStatusFilter = 'All';
  historyFilter: 'last5' | 'last7' | 'last30' | 'all' | 'date' | 'range' = 'last5';
  historyDateSingle = '';
  historyDateFrom = '';
  historyDateTo = '';

  readonly orderStatuses = ['All', 'Pending', 'Confirmed', 'Packed', 'Delivered', 'Cancelled'];

  get filteredStores(): any[] {
    return this.stores.filter(store => {
      const query = this.storeSearchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        store.storeName?.toLowerCase().includes(query) ||
        store.ownerName?.toLowerCase().includes(query) ||
        store.email?.toLowerCase().includes(query);

      const storeOrders = this.orders.filter(o => o.storeId === store.id);
      const matchesStatus =
        this.storeStatusFilter === 'All' ||
        storeOrders.some(o => (o.status || 'Pending') === this.storeStatusFilter);

      return matchesSearch && matchesStatus;
    });
  }

  get storeFilteredOrders(): any[] {
    if (!this.selectedStoreFilter) return [];
    return this.orders.filter(o => o.storeId === this.selectedStoreFilter.id);
  }

  get pendingOrders(): any[] {
    return this.storeFilteredOrders.filter(o => (o.status || 'Pending') === 'Pending');
  }

  get nonPendingOrders(): any[] {
    return this.storeFilteredOrders.filter(o => o.status && o.status !== 'Pending');
  }

  private getOrderTimestamp(order: any): number {
    if (!order.date) return 0;
    if (order.date?.seconds) return order.date.seconds * 1000;
    return new Date(order.date).getTime();
  }

  get filteredNonPendingOrders(): any[] {
    // Always sort newest first
    const sorted = [...this.nonPendingOrders].sort(
      (a, b) => this.getOrderTimestamp(b) - this.getOrderTimestamp(a)
    );

    if (this.historyFilter === 'last5') return sorted.slice(0, 5);

    if (this.historyFilter === 'last7' || this.historyFilter === 'last30') {
      const days = this.historyFilter === 'last7' ? 7 : 30;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      return sorted.filter(o => this.getOrderTimestamp(o) >= cutoff);
    }

    if (this.historyFilter === 'date' && this.historyDateSingle) {
      const start = new Date(this.historyDateSingle);
      start.setHours(0, 0, 0, 0);
      const end = new Date(this.historyDateSingle);
      end.setHours(23, 59, 59, 999);
      return sorted.filter(o => {
        const ts = this.getOrderTimestamp(o);
        return ts >= start.getTime() && ts <= end.getTime();
      });
    }

    if (this.historyFilter === 'range') {
      return sorted.filter(o => {
        const ts = this.getOrderTimestamp(o);
        const from = this.historyDateFrom
          ? new Date(this.historyDateFrom + 'T00:00:00').getTime()
          : 0;
        const to = this.historyDateTo
          ? new Date(this.historyDateTo + 'T23:59:59').getTime()
          : Infinity;
        return ts >= from && ts <= to;
      });
    }

    return sorted; // 'all'
  }

  getOrderCountForStore(storeId: string): number {
    return this.orders.filter(o => o.storeId === storeId).length;
  }

  getLatestOrderStatus(storeId: string): string {
    const storeOrders = this.orders.filter(o => o.storeId === storeId);
    if (!storeOrders.length) return 'No orders';
    return storeOrders[storeOrders.length - 1].status || 'Pending';
  }

  selectStoreFilter(store: any) {
    this.selectedStoreFilter = store;
    this.historyFilter = 'last5';
    this.historyDateSingle = '';
    this.historyDateFrom = '';
    this.historyDateTo = '';
  }

  clearStoreFilter() {
    this.selectedStoreFilter = null;
    this.historyFilter = 'last5';
    this.historyDateSingle = '';
    this.historyDateFrom = '';
    this.historyDateTo = '';
  }

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

  // ── Voice assistant ──
  isListening = false;
  voiceToastVisible = false;
  voiceMessage = '';
  voiceState: 'listening' | 'processing' | 'success' | 'error' = 'listening';
  private recognition: any = null;

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
    if (tab !== 'orders') this.selectedStoreFilter = null;
  }

  readonly today = new Date();

  get todayGreeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  }

  get totalCaps() { return this.caps.length; }
  get totalStock() {
    return this.caps.reduce((t, c) => t + Number(c.stock || 0), 0);
  }
  get totalInventoryValue() {
    return this.caps.reduce((t, c) => t + Number(c.price || 0) * Number(c.stock || 0), 0);
  }
  get totalStores() { return this.stores.length; }
  get totalOrders() { return this.orders.length; }
  get pendingOrdersCount() {
    return this.orders.filter(o => (o.status || 'Pending') === 'Pending').length;
  }
  get confirmedOrdersCount() {
    return this.orders.filter(o => o.status === 'Confirmed').length;
  }
  get packedOrdersCount() {
    return this.orders.filter(o => o.status === 'Packed').length;
  }
  get deliveredOrdersCount() {
    return this.orders.filter(o => o.status === 'Delivered').length;
  }
  get cancelledOrdersCount() {
    return this.orders.filter(o => o.status === 'Cancelled').length;
  }
  get totalRevenue() {
    return this.orders
      .filter(o => o.status === 'Delivered')
      .reduce((t, o) => t + Number(o.finalAmount || o.total || 0), 0);
  }
  get recentOrders() {
    return [...this.orders]
      .sort((a, b) => this.getOrderTimestamp(b) - this.getOrderTimestamp(a))
      .slice(0, 5);
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

  // ── Voice assistant (continuous mode) ───────────────────

  private continuousMode = false;

  toggleVoice() {
    if (this.continuousMode) {
      this.stopListening();
    } else {
      this.continuousMode = true;
      this.startListening();
    }
  }

  startListening() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Voice recognition requires Chrome or Edge browser.');
      return;
    }

    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.isListening = true;
    this.voiceState = 'listening';
    this.voiceMessage = 'Listening… speak your command';
    this.voiceToastVisible = true;
    this.cdr.detectChanges();

    this.recognition.start();

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.voiceState = 'processing';
      this.voiceMessage = `"${transcript}"`;
      this.isListening = false;
      this.cdr.detectChanges();
      this.processVoiceCommand(transcript);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech') {
        // No speech — restart silently if continuous
        this.restartOrClose(800);
        return;
      }
      this.voiceState = 'error';
      this.voiceMessage = `Mic error: ${event.error}`;
      this.cdr.detectChanges();
      this.restartOrClose(3000);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.cdr.detectChanges();
    };
  }

  stopListening() {
    this.continuousMode = false;
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.isListening = false;
    this.voiceToastVisible = false;
    this.cdr.detectChanges();
  }

  /** After showing a result, either restart mic or close toast */
  private restartOrClose(delay = 2200) {
    setTimeout(() => {
      if (this.continuousMode) {
        this.startListening();
      } else {
        this.voiceToastVisible = false;
        this.cdr.detectChanges();
      }
    }, delay);
  }

  processVoiceCommand(transcript: string) {
    this.http.post<any>('http://localhost:3000/voice-command', {
      transcript,
      activeTab: this.activeTab,
      currentOrderStoreId: this.newOrder.storeId || '',
      stores: this.stores.map(s => ({ id: s.id, name: s.storeName, owner: s.ownerName })),
      products: this.caps.map(p => ({ id: p.id, name: p.name, price: p.price }))
    }).subscribe({
      next: (action) => this.executeVoiceAction(action),
      error: () => {
        this.voiceState = 'error';
        this.voiceMessage = 'Cannot reach backend — is the server running?';
        this.cdr.detectChanges();
        this.restartOrClose(4000);
      }
    });
  }

  executeVoiceAction(action: any) {
    switch (action.action) {
      case 'navigate':
        this.setActiveTab(action.tab);
        this.showVoiceSuccess(`Navigated to ${action.tab}`);
        break;

      case 'filter_store':
        this.voiceGoToStore(action.storeName);
        break;

      case 'clear_store_filter':
        this.clearStoreFilter();
        this.showVoiceSuccess('✅ Showing all stores');
        break;

      case 'select_store_for_order':
        this.newOrder.storeId = action.storeId;
        this.showVoiceSuccess(`✅ Selected ${action.storeName} — now add items`);
        break;

      case 'add_order_items':
        this.voiceAddOrderItems(action.items || []);
        break;

      case 'add_return_items':
        this.voiceAddReturnItems(action.items || []);
        break;

      case 'save_order':
        this.showVoiceSuccess('✅ Saving order…');
        setTimeout(() => this.saveOrder(), 400);
        break;

      case 'clear_order':
        this.newOrder = { storeId: '', status: 'Pending', newItems: [], returnItems: [], notes: '' };
        this.showVoiceSuccess('✅ Order form cleared');
        break;

      case 'create_order':
        this.voiceCreateOrder(action);
        break;

      case 'update_status':
        this.voiceUpdateStatus(action);
        break;

      case 'send_invoice':
        this.voiceSendInvoice(action.storeName);
        break;

      case 'unknown':
      default:
        this.voiceState = 'error';
        this.voiceMessage = action.message || "I didn't understand that. Try again.";
        this.cdr.detectChanges();
        this.restartOrClose(3000);
    }
  }

  voiceAddOrderItems(items: any[]) {
    if (!this.newOrder.storeId) {
      this.showVoiceError('Please select a store first');
      return;
    }
    items.forEach((item: any) => {
      const existing = this.newOrder.newItems.find((i: any) => i.id === item.id);
      if (existing) {
        existing.quantity += Number(item.quantity);
      } else {
        this.newOrder.newItems.push({
          id: item.id, name: item.name,
          price: Number(item.price), quantity: Number(item.quantity)
        });
      }
    });
    const summary = items.map((i: any) => `${i.quantity}× ${i.name}`).join(', ');
    this.showVoiceSuccess(`✅ Added: ${summary}`);
  }

  voiceAddReturnItems(items: any[]) {
    if (!this.newOrder.storeId) {
      this.showVoiceError('Please select a store first');
      return;
    }
    items.forEach((item: any) => {
      const existing = this.newOrder.returnItems.find((i: any) => i.id === item.id);
      if (existing) {
        existing.quantity += Number(item.quantity);
      } else {
        this.newOrder.returnItems.push({
          id: item.id, name: item.name,
          price: Number(item.price), quantity: Number(item.quantity)
        });
      }
    });
    const summary = items.map((i: any) => `${i.quantity}× ${i.name}`).join(', ');
    this.showVoiceSuccess(`✅ Return added: ${summary}`);
  }

  private showVoiceSuccess(message: string) {
    this.voiceState = 'success';
    this.voiceMessage = message;
    this.cdr.detectChanges();
    this.restartOrClose(2200);
  }

  private showVoiceError(message: string, delay = 3000) {
    this.voiceState = 'error';
    this.voiceMessage = message;
    this.cdr.detectChanges();
    this.restartOrClose(delay);
  }

  private findStore(name: string) {
    const n = name.toLowerCase();
    return this.stores.find(s =>
      s.storeName?.toLowerCase().includes(n) || n.includes(s.storeName?.toLowerCase())
    );
  }

  voiceGoToStore(storeName: string) {
    const store = this.findStore(storeName);
    if (store) {
      this.setActiveTab('orders');
      this.selectStoreFilter(store);
      this.showVoiceSuccess(`✅ Showing orders for ${store.storeName}`);
    } else {
      this.showVoiceError(`Store "${storeName}" not found`);
    }
  }

  voiceCreateOrder(action: any) {
    this.setActiveTab('addOrder');
    this.newOrder = {
      storeId: action.storeId || '',
      status: 'Pending',
      newItems: (action.items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity)
      })),
      returnItems: (action.returnItems || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity)
      })),
      notes: action.notes || ''
    };
    const storeName = this.stores.find(s => s.id === action.storeId)?.storeName
      || action.storeName || 'store';
    this.showVoiceSuccess(`✅ Order ready for ${storeName} — review & save`);
    this.cdr.detectChanges();
  }

  voiceUpdateStatus(action: any) {
    const store = this.findStore(action.storeName);
    if (!store) { this.showVoiceError(`Store "${action.storeName}" not found`); return; }

    const storeOrders = this.orders.filter(o => o.storeId === store.id);
    if (!storeOrders.length) { this.showVoiceError(`No orders found for ${store.storeName}`); return; }

    const latest = storeOrders[storeOrders.length - 1];
    latest.status = action.status;
    this.updateOrderStatus(latest);
    this.showVoiceSuccess(`✅ ${store.storeName}'s order → ${action.status}`);
  }

  voiceSendInvoice(storeName: string) {
    const store = this.findStore(storeName);
    if (!store) { this.showVoiceError(`Store "${storeName}" not found`); return; }

    const invoicedOrders = this.orders.filter(o => o.storeId === store.id && o.invoice);
    if (!invoicedOrders.length) {
      this.showVoiceError(`No saved invoice found for ${store.storeName}`);
      return;
    }

    const order = invoicedOrders[invoicedOrders.length - 1];
    this.voiceState = 'processing';
    this.voiceMessage = `Sending invoice to ${order.email}…`;
    this.cdr.detectChanges();
    this.sendInvoiceEmail(order);
  }

  sendInvoiceEmail(order: any) {
    const { base64, invoiceNumber } = this.invoicePdfService.generateInvoiceBase64(order);
    this.http.post('http://localhost:3000/send-invoice', {
      order,
      pdfBase64: base64,
      invoiceNumber
    }).subscribe({
      next: () => this.showVoiceSuccess(`✅ Invoice sent to ${order.email}`),
      error: () => this.showVoiceError('Failed to send invoice email')
    });
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

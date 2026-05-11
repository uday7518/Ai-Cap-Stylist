import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../../firebase.config';
import { FirebaseProduct } from '../../services/firebase-product';

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
  isEditMode = false;

  newCap: any = emptyCap();

  constructor(
    private productService: FirebaseProduct,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.loadCaps();
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

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../services/product';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {
  caps: any[] = [];
  categories = ['Beach', 'Dinner', 'Vacation', 'Picnic', 'Sports', 'Casual'];
  selectedCategory = 'All';
  isEditMode = false;

  newCap: any = {
    name: '',
    category: '',
    price: null,
    stock: null,
    image: '',
    description: ''
  };

  constructor(private productService: Product) {
    this.loadCaps();
  }

  loadCaps() {
    this.productService.getProducts().subscribe((data: any[]) => {
      this.caps = data;
    });
  }

  get filteredCaps() {
    if (this.selectedCategory === 'All') {
      return this.caps;
    }

    return this.caps.filter(cap => cap.category === this.selectedCategory);
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

  addCap() {
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

    if (this.isEditMode) {
      this.productService.updateProduct(this.newCap).subscribe(() => {
        alert('Cap updated successfully!');
        this.resetForm();
        this.loadCaps();
      });
    } else {
      this.productService.addProduct(this.newCap).subscribe(() => {
        alert('Cap added successfully!');
        this.resetForm();
        this.loadCaps();
      });
    }
  }

  editCap(cap: any) {
    this.newCap = { ...cap };
    this.isEditMode = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteCap(cap: any) {
    this.productService.deleteProduct(cap._id).subscribe(() => {
      this.loadCaps();
    });
  }

  resetForm() {
    this.newCap = {
      name: '',
      category: '',
      price: null,
      stock: null,
      image: '',
      description: ''
    };

    this.isEditMode = false;
  }
}

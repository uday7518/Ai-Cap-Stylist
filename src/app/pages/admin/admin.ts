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

  newCap = {
    id: 0,
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
    this.caps = this.productService.getProducts();
  }

  get filteredCaps() {
    if (this.selectedCategory === 'All') {
      return this.caps;
    }

    return this.caps.filter(cap => cap.category === this.selectedCategory);
  }

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

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
      this.productService.updateProduct({ ...this.newCap });
      this.isEditMode = false;
      alert('Cap updated successfully!');
    } else {
      const capToAdd = {
        ...this.newCap,
        id: Date.now()
      };

      this.productService.addProduct(capToAdd);
      alert('Cap added successfully!');
    }

    this.newCap = {
      id: 0,
      name: '',
      category: '',
      price: null,
      stock: null,
      image: '',
      description: ''
    };

    this.loadCaps();
  }

  editCap(cap: any) {
    this.newCap = { ...cap };
    this.isEditMode = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteCap(cap: any) {
    this.productService.deleteProductById(cap.id);
    this.loadCaps();
  }
}

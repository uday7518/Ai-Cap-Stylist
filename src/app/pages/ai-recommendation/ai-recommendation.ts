import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ai-recommendation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-recommendation.html',
  styleUrl: './ai-recommendation.css'
})
export class AiRecommendationComponent {
  imagePreview: string | ArrayBuffer | null = null;
  occasion: string = '';
  recommendation: string = '';
  loading = false;
  matchedCaps: any[] = [];

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
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b',
    },
  ];

  constructor(private http: HttpClient) {}

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreview = reader.result;
    };

    reader.readAsDataURL(file);
  }

  getRecommendation() {
    if (!this.imagePreview || !this.occasion) {
      this.recommendation = 'Please upload your photo and select an occasion.';
      return;
    }

    this.loading = true;
    this.recommendation = '';

    this.http.post<any>('http://localhost:3000/recommend', {
      image: this.imagePreview,
      occasion: this.occasion
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.recommendation = res.result.replace(/\*\*/g, '');
        this.matchedCaps = this.caps.filter(cap =>
          cap.category.toLowerCase() === this.occasion.toLowerCase()
        );

        if (this.matchedCaps.length === 0) {
          this.matchedCaps = this.caps.slice(0, 2);
        }
      },
      error: () => {
        this.loading = false;
        this.recommendation = 'AI service unavailable. Showing default suggestion.';
        this.matchedCaps = this.caps.slice(0, 2);
      }
    });
  }
}

import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { CatalogComponent } from './pages/catalog/catalog';
import { AiRecommendationComponent } from './pages/ai-recommendation/ai-recommendation';
import { Admin } from './pages/admin/admin';
import { Cart } from './pages/cart/cart';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'catalog', component: CatalogComponent },
  { path: 'ai', component: AiRecommendationComponent },
  { path: 'admin', component: Admin },
  { path: 'cart', component: Cart },
];

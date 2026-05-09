import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { firebaseDb } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class FirebaseProduct {
  private productsRef = collection(firebaseDb, 'products');

  constructor(private zone: NgZone) {}

  getProducts(): Observable<any[]> {
    return new Observable<any[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        this.productsRef,
        (snapshot) => {
          const products = snapshot.docs.map((productDoc) => ({
            id: productDoc.id,
            ...productDoc.data()
          }));

          this.zone.run(() => subscriber.next(products));
        },
        (error) => this.zone.run(() => subscriber.error(error))
      );

      return unsubscribe;
    });
  }

  addProduct(product: any) {
    return addDoc(this.productsRef, {
      name: product.name,
      category: product.category,
      price: Number(product.price),
      stock: Number(product.stock),
      image: product.image,
      description: product.description,
      createdAt: new Date()
    });
  }

  updateProduct(product: any) {
    const productDoc = doc(firebaseDb, `products/${product.id}`);

    return updateDoc(productDoc, {
      name: product.name,
      category: product.category,
      price: Number(product.price),
      stock: Number(product.stock),
      image: product.image,
      description: product.description
    });
  }

  deleteProduct(id: string) {
    const productDoc = doc(firebaseDb, `products/${id}`);
    return deleteDoc(productDoc);
  }
}

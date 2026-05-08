import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDkzyWnWbiUH--91SRNVq0jJL18abEvD_Y',
  authDomain: 'ai-cap-stylist.firebaseapp.com',
  projectId: 'ai-cap-stylist',
  storageBucket: 'ai-cap-stylist.firebasestorage.app',
  messagingSenderId: '314939665341',
  appId: '1:314939665341:web:496de3fb5b9bc3423f80d4',
  measurementId: 'G-9NC5S4NKJL'
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

@Injectable({
  providedIn: 'root'
})
export class FirebaseProduct {
  private productsRef = collection(firestore, 'products');

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
    const productDoc = doc(firestore, `products/${product.id}`);

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
    const productDoc = doc(firestore, `products/${id}`);
    return deleteDoc(productDoc);
  }
}

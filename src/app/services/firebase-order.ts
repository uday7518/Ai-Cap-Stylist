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
export class FirebaseOrder {
  private ordersRef = collection(firebaseDb, 'orders');

  constructor(private zone: NgZone) {}

  getOrders(): Observable<any[]> {
    return new Observable<any[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        this.ordersRef,
        (snapshot) => {
          const orders = snapshot.docs.map((orderDoc) => ({
            id: orderDoc.id,
            ...orderDoc.data()
          }));

          this.zone.run(() => subscriber.next(orders));
        },
        (error) => this.zone.run(() => subscriber.error(error))
      );

      return unsubscribe;
    });
  }

  addOrder(order: any) {
    return addDoc(this.ordersRef, {
      ...order,
      createdAt: new Date()
    });
  }

  updateOrderStatus(id: string, status: string) {
    const orderDoc = doc(firebaseDb, `orders/${id}`);

    return updateDoc(orderDoc, {
      status
    });
  }

  deleteOrder(id: string) {
    const orderDoc = doc(firebaseDb, `orders/${id}`);
    return deleteDoc(orderDoc);
  }
}

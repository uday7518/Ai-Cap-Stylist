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
export class FirebaseStore {
  private storesRef = collection(firebaseDb, 'stores');

  constructor(private zone: NgZone) {}

  getStores(): Observable<any[]> {
    return new Observable<any[]>((subscriber) => {
      const unsubscribe = onSnapshot(
        this.storesRef,
        (snapshot) => {
          const stores = snapshot.docs.map((storeDoc) => ({
            id: storeDoc.id,
            ...storeDoc.data()
          }));

          this.zone.run(() => subscriber.next(stores));
        },
        (error) => this.zone.run(() => subscriber.error(error))
      );

      return unsubscribe;
    });
  }

  addStore(store: any) {
    return addDoc(this.storesRef, {
      storeName: store.storeName,
      storeAddress: store.storeAddress,
      ownerName: store.ownerName,
      phone: store.phone,
      createdAt: new Date()
    });
  }

  updateStore(store: any) {
    const storeDoc = doc(firebaseDb, `stores/${store.id}`);

    return updateDoc(storeDoc, {
      storeName: store.storeName,
      storeAddress: store.storeAddress,
      ownerName: store.ownerName,
      phone: store.phone
    });
  }

  deleteStore(id: string) {
    const storeDoc = doc(firebaseDb, `stores/${id}`);
    return deleteDoc(storeDoc);
  }
}

import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../firebase.config';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  return new Promise<boolean | UrlTree>((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe();
      resolve(user ? true : router.createUrlTree(['/login']));
    });
  });
};

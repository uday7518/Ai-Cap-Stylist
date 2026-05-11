import { CommonModule } from '@angular/common';
import { Component, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '../../firebase.config';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private router: Router,
    private zone: NgZone
  ) {
    onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        this.zone.run(() => {
          this.router.navigate(['/admin']);
        });
      }
    });
  }

  login() {
    this.errorMessage = '';
    const email = this.email.trim();
    const password = this.password.trim();

    if (!email || !password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    if (!this.isValidEmail(email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    if (password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    signInWithEmailAndPassword(firebaseAuth, email, password)
      .then(() => {
        this.zone.run(() => {
          this.router.navigate(['/admin']);
        });
      })
      .catch((error) => {
        console.error('Login error:', error);

        this.zone.run(() => {
          if (error.code === 'auth/invalid-email') {
            this.errorMessage = 'Please enter a valid email address.';
          } else if (error.code === 'auth/invalid-credential') {
            this.errorMessage = 'Invalid email or password.';
          } else if (error.code === 'auth/user-not-found') {
            this.errorMessage = 'No admin account found with this email.';
          } else if (error.code === 'auth/wrong-password') {
            this.errorMessage = 'Incorrect password.';
          } else {
            this.errorMessage = 'Login failed. Please try again.';
          }
        });
      });
  }

  private isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

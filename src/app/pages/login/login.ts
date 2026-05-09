import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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

  constructor(private router: Router) {
    onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        this.router.navigate(['/admin']);
      }
    });
  }

  login() {
    this.errorMessage = '';

    signInWithEmailAndPassword(firebaseAuth, this.email, this.password)
      .then(() => {
        this.router.navigate(['/admin']);
      })
      .catch(() => {
        this.errorMessage = 'Invalid email or password';
      });
  }
}

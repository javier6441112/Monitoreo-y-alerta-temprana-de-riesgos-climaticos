import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  error = '';
  providers = { google: false, github: false };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.authService.oauthProviders().subscribe({ next: providers => this.providers = providers });
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('oauth_token');
    const error = params.get('oauth_error');
    if (token) {
      this.loading = true;
      history.replaceState(null, '', window.location.pathname);
      this.authService.completeOAuth(token).subscribe({
        next: () => void this.router.navigateByUrl('/dashboard'),
        error: () => { this.loading = false; this.error = 'No fue posible completar el inicio de sesión externo.'; }
      });
    } else if (error) {
      history.replaceState(null, '', window.location.pathname);
      this.error = error === 'cancelled' ? 'El inicio de sesión externo fue cancelado.' : 'No fue posible iniciar sesión con el proveedor externo.';
    }
  }

  loginWith(provider: 'google' | 'github'): void {
    window.location.assign(`/api/auth/oauth/${provider}`);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.error = '';

    const { username, password } = this.loginForm.getRawValue();
    this.authService.login(username, password).subscribe({
      next: () => {
        this.loading = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/dashboard');
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.detail || err.error?.message || 'No fue posible iniciar sesión. Verifica tus credenciales y la conexión con la API.';
      }
    });
  }
}

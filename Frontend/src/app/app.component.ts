import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div style="min-height:100vh;background:#f5f5f5;">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      ::ng-deep .alerta-snackbar {
        background: #b71c1c;
        color: #fff;
        font-weight: 600;
      }
    `
  ]
})
export class AppComponent {}

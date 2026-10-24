import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="app-footer">
      <p>&copy; 2026 Monitoreo Climático - Todos los derechos reservados</p>
    </footer>
  `,
  styles: [`
    .app-footer {
      background-color: #1a237e;
      color: white;
      padding: 16px;
      text-align: center;
      font-size: 0.9rem;
    }
    .app-footer p {
      margin: 0;
    }
  `]
})
export class FooterComponent {}

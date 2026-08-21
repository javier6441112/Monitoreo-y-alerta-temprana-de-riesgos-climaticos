import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>📜 Historial</h1>
    <p>Historial de eventos (en construcción)</p>
  `,
  styles: [`:host { display: block; padding: 20px; }`]
})
export class HistorialComponent {}

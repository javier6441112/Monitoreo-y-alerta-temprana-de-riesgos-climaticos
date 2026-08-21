import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>🔔 Alertas</h1>
    <p>Lista de alertas (en construcción)</p>
  `,
  styles: [`:host { display: block; padding: 20px; }`]
})
export class AlertasComponent {}

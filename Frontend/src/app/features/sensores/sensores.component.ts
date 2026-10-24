import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sensores',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>📡 Sensores</h1>
    <p>Lista de sensores (en construcción)</p>
  `,
  styles: [`:host { display: block; padding: 20px; }`]
})
export class SensoresComponent {}

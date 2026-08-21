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
  styles: []
})
export class AppComponent {
  constructor() {
    console.log('🚀 AppComponent cargado');
  }
}

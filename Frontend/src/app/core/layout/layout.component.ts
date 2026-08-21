import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-header></app-header>
      <div class="app-body">
        <app-sidebar></app-sidebar>
        <main class="app-content">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .app-body {
      display: flex;
      flex: 1;
    }
    .app-content {
      flex: 1;
      padding: 20px;
      background-color: #f5f5f5;
      min-height: calc(100vh - 128px);
    }
  `]
})
export class LayoutComponent {}

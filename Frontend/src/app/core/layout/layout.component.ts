import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { Signalr } from '../services/signalr/signalr';
import { AlertaNotificationService } from '../services/alerta-notification/alerta-notification.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `<div class="app-container"><app-header></app-header><div class="app-body"><app-sidebar></app-sidebar><main class="app-content"><router-outlet></router-outlet></main></div></div>`,
  styles: [`
    .app-container { display:flex;flex-direction:column;min-height:100vh;background:var(--canvas); }
    .app-body { display:flex;flex:1;min-height:calc(100vh - 66px); }
    .app-content { flex:1;min-width:0;padding:28px clamp(16px,3vw,42px);background:var(--canvas); }
    @media(max-width:800px) { .app-body { flex-direction:column; }.app-content { padding:20px 16px; } }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  constructor(private readonly signalr: Signalr, private readonly notifications: AlertaNotificationService) {}

  ngOnInit(): void { void this.signalr.connect().catch(() => undefined); }
  ngOnDestroy(): void { void this.signalr.disconnect().catch(() => undefined); }
}

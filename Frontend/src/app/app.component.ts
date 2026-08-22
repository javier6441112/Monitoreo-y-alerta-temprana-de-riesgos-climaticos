import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlertaNotificationService } from './core/services/alerta-notification/alerta-notification.service';
import { Signalr } from './core/services/signalr/signalr';

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
export class AppComponent implements OnInit {
  constructor(
    private readonly signalr: Signalr,
    private readonly alertaNotificationService: AlertaNotificationService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.signalr.connect();
    } catch (error) {
      console.error('No se pudo conectar al hub de alertas:', error);
    }
  }
}

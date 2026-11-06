import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertaPopupComponent } from '../../components/alerta-popup/alerta-popup.component';
import { Signalr } from '../signalr/signalr';

@Injectable({
  providedIn: 'root'
})
export class AlertaNotificationService {
  constructor(
    private readonly signalr: Signalr,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {
    this.signalr.alertaGenerada$.subscribe((alerta: any) => {
      this.mostrarAlerta(alerta);
    });
  }

  private mostrarAlerta(alerta: any): void {
    const titulo = `${alerta?.nivel ?? 'ALERTA'} - ${alerta?.fenomeno ?? 'Riesgo climático detectado'}`;
    const descripcion = alerta?.mensaje ?? 'Se detectó una condición crítica en el sistema.';
    const mensaje = `🚨 ${titulo}\n${descripcion}`;

    this.dialog.open(AlertaPopupComponent, {
      width: '420px',
      disableClose: true,
      data: {
        nivel: alerta?.nivel ?? 'ALERTA',
        fenomeno: alerta?.fenomeno ?? 'Riesgo climático',
        mensaje: descripcion
      }
    });

    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 8000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['alerta-snackbar']
    });

    this.reproducirSonido();
    this.mostrarNotificacionNavegador(alerta);
  }

  private reproducirSonido(): void {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 780;
    gainNode.gain.value = 0.08;

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);

    setTimeout(() => {
      context.close().catch(() => undefined);
    }, 400);
  }

  private mostrarNotificacionNavegador(alerta: any): void {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('Alerta climática', {
        body: `${alerta?.fenomeno ?? 'Riesgo'} - ${alerta?.mensaje ?? 'Se detectó una condición crítica.'}`,
        tag: 'alerta-climatica'
      });
      return;
    }

    if (Notification.permission !== 'denied') {
      Notification.requestPermission().catch(() => undefined);
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface AlertaPopupData {
  nivel: string;
  fenomeno: string;
  mensaje: string;
}

@Component({
  selector: 'app-alerta-popup',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="alerta-popup" role="alertdialog" aria-modal="true">
      <div class="alerta-header" [ngClass]="getNivelClass(data.nivel)">
        <span class="alerta-icon">⚠️</span>
        <strong>{{ data.nivel || 'ALERTA' }}</strong>
      </div>

      <h2 mat-dialog-title>{{ data.fenomeno || 'Riesgo climático' }}</h2>

      <mat-dialog-content>
        <p>{{ data.mensaje || 'Se detectó una condición crítica.' }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-flat-button color="warn" (click)="cerrar()">Aceptar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .alerta-popup {
        min-width: 320px;
        max-width: 420px;
        padding: 0;
      }

      .alerta-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 20px;
        font-size: 1.05rem;
        color: white;
        border-radius: 8px 8px 0 0;
      }

      .alerta-header.roja {
        background: #b71c1c;
      }

      .alerta-header.amarilla {
        background: #f9a825;
        color: #111;
      }

      .alerta-header.verde {
        background: #2e7d32;
      }

      .alerta-icon {
        font-size: 1.4rem;
      }

      h2 {
        margin: 16px 20px 0;
        font-size: 1.35rem;
      }

      mat-dialog-content {
        margin: 0 20px;
        padding: 8px 0 0;
      }

      p {
        margin: 0;
        line-height: 1.5;
        color: #333;
      }

      mat-dialog-actions {
        padding: 16px 20px 20px;
      }
    `
  ]
})
export class AlertaPopupComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AlertaPopupData,
    private readonly dialogRef: MatDialogRef<AlertaPopupComponent>
  ) {}

  cerrar(): void {
    this.dialogRef.close();
  }

  getNivelClass(nivel?: string): string {
    const value = (nivel ?? '').toLowerCase();
    if (value.includes('roja')) return 'roja';
    if (value.includes('amarilla')) return 'amarilla';
    if (value.includes('verde')) return 'verde';
    return 'roja';
  }
}

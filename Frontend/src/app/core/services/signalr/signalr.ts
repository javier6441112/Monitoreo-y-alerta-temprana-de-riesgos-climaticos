import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LecturaActualizada {
  sensorId: number;
  valor: number;
  fechaHora: string;
}

@Injectable({
  providedIn: 'root',
})
export class Signalr {
  private readonly connection: HubConnection;
  private readonly lecturaSubject = new Subject<LecturaActualizada>();
  private readonly alertaSubject = new Subject<unknown>();

  constructor() {
    this.connection = new HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        accessTokenFactory: () => localStorage.getItem('auth_token') ?? ''
      })
      .withAutomaticReconnect()
      .configureLogging(environment.production ? LogLevel.Error : LogLevel.Information)
      .build();

    this.connection.on('lecturaActualizada', lectura => this.lecturaSubject.next(lectura));
    this.connection.on('alertaGenerada', alerta => this.alertaSubject.next(alerta));
  }

  connect(): Promise<void> {
    if (this.connection.state === 'Disconnected') {
      return this.connection.start();
    }
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    return this.connection.stop();
  }

  lecturaActualizada$: Observable<LecturaActualizada> = this.lecturaSubject.asObservable();
  alertaGenerada$: Observable<unknown> = this.alertaSubject.asObservable();
}

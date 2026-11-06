import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { AlertaNotificationService } from './alerta-notification.service';
import { Signalr } from '../signalr/signalr';

describe('AlertaNotificationService', () => {
  let alertaGeneradaSubject: Subject<any>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    alertaGeneradaSubject = new Subject<any>();
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        AlertaNotificationService,
        {
          provide: Signalr,
          useValue: {
            alertaGenerada$: alertaGeneradaSubject.asObservable()
          }
        },
        {
          provide: MatSnackBar,
          useValue: snackBar
        }
      ]
    });
  });

  it('debe mostrar un snackbar cuando llega una alerta', () => {
    const service = TestBed.inject(AlertaNotificationService);

    expect(service).toBeTruthy();

    alertaGeneradaSubject.next({
      nivel: 'ROJA',
      fenomeno: 'INUNDACION',
      mensaje: 'Riesgo de inundación alto'
    });

    expect(snackBar.open).toHaveBeenCalled();
  });
});

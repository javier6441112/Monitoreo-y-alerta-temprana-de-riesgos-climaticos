import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Role, UsuarioAdmin, UsuarioRequest } from '../../core/models/api-contract.models';
import { UsuarioService } from '../../core/services/usuario/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="page-shell">
      <header class="page-head"><div><p class="eyebrow">CONTROL DE ACCESO</p><h1>Usuarios</h1><p>Administra cuentas, roles y acceso al sistema.</p></div><button class="button button-primary" type="button" (click)="create()">＋ Nuevo usuario</button></header>
      <form class="filters" (ngSubmit)="load()"><label class="search-field">Buscar<input name="buscar" [(ngModel)]="filters.buscar" placeholder="Nombre o usuario"></label><label>Rol<select name="rol" [(ngModel)]="filters.rol"><option value="">Todos los roles</option><option value="ADMIN">Administrador</option><option value="OPERADOR">Operador</option><option value="CONSULTA">Consulta</option></select></label><label>Estado<select name="activo" [(ngModel)]="filters.activo"><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></label><button class="button button-secondary" type="submit">Aplicar</button></form>
      @if (error) { <div class="notice" role="alert">{{ error }}</div> }
      @if (loading) { <p class="state">Cargando usuarios…</p> }
      @if (!loading && !error && users.length === 0) { <div class="empty"><h2>No hay usuarios para mostrar</h2><p>El listado se cargará cuando la API esté conectada.</p></div> }
      @if (!loading && users.length) { <div class="table-wrap"><table class="data-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Creado</th><th>Último acceso</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>@for (user of users; track user.id) {<tr><td><strong>{{ user.nombre }}</strong><small>{{ user.username }}</small></td><td><span class="role">{{ roleLabel(user.rol) }}</span></td><td>{{ user.fechaCreacion | date:'mediumDate' }}</td><td>{{ user.ultimoAcceso ? (user.ultimoAcceso | date:'short') : 'Sin registro' }}</td><td><span class="status" [class.off]="!user.activo">{{ user.activo ? 'Activo' : 'Inactivo' }}</span></td><td class="actions"><button class="button button-quiet" type="button" (click)="edit(user)">Editar</button><button class="button button-quiet" type="button" (click)="setActive(user)">{{ user.activo ? 'Desactivar' : 'Activar' }}</button></td></tr>}</tbody></table></div> }
      @if (editing) { <div class="backdrop" (click)="cancel()"><section class="panel" role="dialog" aria-modal="true" aria-labelledby="user-title" (click)="$event.stopPropagation()"><header><div><p class="eyebrow">CUENTA</p><h2 id="user-title">{{ editingId ? 'Editar usuario' : 'Crear usuario' }}</h2></div><button class="close" type="button" aria-label="Cerrar" (click)="cancel()">×</button></header><form [formGroup]="form" (ngSubmit)="save()"><label>Nombre completo<input formControlName="nombre"></label><label>Nombre de usuario<input formControlName="username" autocomplete="off"></label><label>Rol<select formControlName="rol"><option value="ADMIN">Administrador</option><option value="OPERADOR">Operador</option><option value="CONSULTA">Consulta</option></select></label><label>{{ editingId ? 'Nueva contraseña (opcional)' : 'Contraseña inicial' }}<input type="password" formControlName="password" autocomplete="new-password"></label>@if (editingId) { <label class="checkbox"><input type="checkbox" formControlName="activo"> Cuenta activa</label> }@if (formError) { <p class="notice">{{ formError }}</p> }<footer><button class="button button-secondary" type="button" (click)="cancel()">Cancelar</button><button class="button button-primary" type="submit" [disabled]="form.invalid || saving">{{ saving ? 'Guardando…' : 'Guardar usuario' }}</button></footer></form></section></div> }
    </section>
  `,
  styles: [`
    :host{display:block}.page-shell{max-width:1440px;margin:0 auto}.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px}.page-head h1,.panel h2{margin:0;font-size:30px;color:var(--ink)}.page-head p:not(.eyebrow){margin:7px 0 0;color:var(--muted)}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:700;letter-spacing:1.2px}.filters{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;padding:16px 0;margin-bottom:12px;border-block:1px solid var(--line)}.filters label,.panel label{display:grid;gap:6px;color:var(--muted);font-size:12px;font-weight:600}.filters input,.filters select,.panel input,.panel select{min-height:40px;padding:8px 10px;border:1px solid var(--line);border-radius:4px;background:#fff;color:var(--ink);font:inherit}.search-field{flex:1 1 260px}.button{min-height:38px;padding:8px 12px;border:1px solid transparent;border-radius:4px;font:inherit;font-size:13px;font-weight:650;cursor:pointer}.button:disabled{opacity:.55;cursor:not-allowed}.button-primary{background:var(--accent);color:#fff}.button-secondary{border-color:var(--line);background:#fff;color:var(--ink)}.button-quiet{background:transparent;color:var(--accent-dark)}.table-wrap{overflow:auto;border-bottom:1px solid var(--line)}.data-table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}.data-table th{padding:12px;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--line);white-space:nowrap}.data-table td{padding:14px 12px;border-bottom:1px solid var(--line-soft)}small{display:block;margin-top:4px;color:var(--muted)}.role{color:var(--ink);font-weight:650}.status{padding:4px 8px;border-radius:3px;background:#e0f2e9;color:#16633d;font-size:11px;font-weight:700}.status.off{background:#edf0ef;color:#636b68}.actions{white-space:nowrap}.notice{padding:12px 14px;margin:16px 0;border-left:3px solid var(--danger);background:#fff1ef;color:#8f3026;font-size:13px}.state,.empty{padding:38px 12px;color:var(--muted);text-align:center}.empty h2{margin:0 0 6px;color:var(--ink);font-size:18px}.empty p{margin:0}.backdrop{position:fixed;inset:0;z-index:20;display:flex;justify-content:flex-end;background:#122b2938}.panel{width:min(500px,100%);height:100%;overflow:auto;padding:26px;background:white;box-shadow:-12px 0 36px #122b291a}.panel>header{display:flex;justify-content:space-between;margin-bottom:22px}.panel h2{font-size:22px}.close{width:36px;height:36px;border:0;border-radius:4px;background:#f0f4f2;font-size:24px;cursor:pointer}.panel form{display:grid;gap:14px}.checkbox{display:flex!important;align-items:center}.checkbox input{min-height:auto}.panel footer{display:flex;justify-content:flex-end;gap:10px;margin-top:8px}@media(max-width:700px){.page-head{align-items:flex-start;flex-direction:column}.panel{padding:20px}}
  `]
})
export class UsuariosComponent implements OnInit {
  users: UsuarioAdmin[] = [];
  loading = false;
  saving = false;
  error = '';
  formError = '';
  editing = false;
  editingId: number | null = null;
  filters = { buscar: '', rol: '', activo: '' };
  form!: FormGroup;

  constructor(private readonly service: UsuarioService, fb: FormBuilder) {
    this.form = fb.group({
      nombre: ['', Validators.required], username: ['', Validators.required], rol: ['CONSULTA' as Role, Validators.required],
      password: ['', Validators.minLength(8)], activo: [true]
    });
  }
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.error = '';
    this.service.getAll(this.filters).subscribe({
      next: data => { this.users = data; this.loading = false; },
      error: () => { this.users = []; this.loading = false; this.error = 'No fue posible cargar usuarios. Verifica que la API esté disponible y que la cuenta tenga rol ADMIN.'; }
    });
  }

  roleLabel(role: Role): string { return ({ ADMIN: 'Administrador', OPERADOR: 'Operador', CONSULTA: 'Consulta' })[role]; }
  create(): void { this.editingId = null; this.form.reset({ nombre: '', username: '', rol: 'CONSULTA', password: '', activo: true }); this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]); this.form.controls.password.updateValueAndValidity(); this.formError = ''; this.editing = true; }
  edit(user: UsuarioAdmin): void { this.editingId = user.id; this.form.reset({ nombre: user.nombre, username: user.username, rol: user.rol, password: '', activo: user.activo }); this.form.controls.password.clearValidators(); this.form.controls.password.addValidators(Validators.minLength(8)); this.form.controls.password.updateValueAndValidity(); this.formError = ''; this.editing = true; }
  cancel(): void { this.editing = false; }

  save(): void {
    if (this.form.invalid || this.saving) return;
    const value = this.form.getRawValue();
    const request: UsuarioRequest = { username: value.username!, nombre: value.nombre!, rol: value.rol!, activo: value.activo!, ...(value.password ? { password: value.password } : {}) };
    this.saving = true; this.formError = '';
    const operation = this.editingId ? this.service.update(this.editingId, request) : this.service.create(request);
    operation.subscribe({ next: () => { this.saving = false; this.editing = false; this.load(); }, error: () => { this.saving = false; this.formError = 'No se pudo guardar el usuario. Revisa los datos o la conexión con la API.'; } });
  }

  setActive(user: UsuarioAdmin): void { this.service.setActive(user.id, !user.activo).subscribe({ next: () => this.load(), error: () => this.error = 'No se pudo cambiar el estado del usuario.' }); }
}

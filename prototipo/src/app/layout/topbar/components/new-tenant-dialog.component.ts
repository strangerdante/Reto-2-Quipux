import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TenantService } from '@core/services/tenant.service';

@Component({
  selector: 'app-new-tenant-dialog',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    @if (isOpen) {
      <div class="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-tenant-title" (keydown.escape)="close()">
        <div class="dialog-card">
          <header class="dialog-header">
            <div>
              <div class="dialog-eyebrow">
                <lucide-icon name="plus" [size]="12"></lucide-icon>
                <span>ONBOARDING MULTITENANT</span>
              </div>
              <h2 id="new-tenant-title">Registrar Nuevo Portal</h2>
              <p>Configura una nueva entidad para administrar campañas, assets y contenedores GTM.</p>
            </div>
            <button class="close-btn" (click)="close()" aria-label="Cerrar modal">
              <lucide-icon name="x" [size]="16"></lucide-icon>
            </button>
          </header>

          <form (ngSubmit)="onSubmit()" class="dialog-form">
            <div class="form-group">
              <label for="tenantName">
                <span>NOMBRE DEL PORTAL O ENTIDAD *</span>
              </label>
              <input
                id="tenantName"
                type="text"
                [(ngModel)]="name"
                name="name"
                (ngModelChange)="onNameChange($event)"
                placeholder="Ej. Alcaldía de Bucaramanga"
                required
                autofocus
              />
            </div>

            <div class="form-group">
              <label for="tenantId">
                <span>IDENTIFICADOR SLUG (CDN) *</span>
              </label>
              <div class="input-with-prefix">
                <span class="prefix">/resources/tenants/</span>
                <input
                  id="tenantId"
                  type="text"
                  [(ngModel)]="slug"
                  name="slug"
                  placeholder="bucaramanga"
                  required
                />
              </div>
              <small class="hint">Usado como identificador en data-tenant y rutas físicas en storage.</small>
            </div>

            <div class="form-group">
              <label for="tenantUrl">
                <span>URL DEL SITIO OFICIAL</span>
              </label>
              <input
                id="tenantUrl"
                type="url"
                [(ngModel)]="portalUrl"
                name="portalUrl"
                placeholder="https://bucaramanga.gov.co"
              />
            </div>

            <div class="form-group">
              <label for="tenantLogo">
                <span>URL DEL LOGOTIPO (OPCIONAL)</span>
              </label>
              <input
                id="tenantLogo"
                type="text"
                [(ngModel)]="logoUrl"
                name="logoUrl"
                placeholder="/brand/logos/valle.svg o URL pública"
              />
            </div>

            @if (errorMessage()) {
              <div class="error-banner" role="alert">
                <lucide-icon name="alert-triangle" [size]="14"></lucide-icon>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <footer class="dialog-footer">
              <button type="button" class="btn-secondary" (click)="close()">
                Cancelar
              </button>
              <button
                type="submit"
                class="btn-primary"
                [disabled]="!isValid() || tenantService.isRegistering()"
              >
                @if (tenantService.isRegistering()) {
                  <span>Registrando portal...</span>
                } @else {
                  <lucide-icon name="plus" [size]="14"></lucide-icon>
                  <span>Registrar Portal</span>
                }
              </button>
            </footer>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(33, 28, 51, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }

    .dialog-card {
      background: #ffffff;
      border: 1px solid var(--line, #e2e8f0);
      border-radius: 12px;
      width: 100%;
      max-width: 520px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      animation: slideUp 0.25s ease;
    }

    .dialog-header {
      padding: 22px 24px 16px;
      border-bottom: 1px solid var(--line, #e2e8f0);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      .dialog-eyebrow {
        display: flex;
        align-items: center;
        gap: 5px;
        color: var(--blue, #2e13f5);
        font: 700 9px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: 0.12em;
        margin-bottom: 6px;
      }

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 900;
        color: var(--ink, #211c33);
        letter-spacing: -0.02em;
      }

      p {
        margin: 4px 0 0;
        font-size: 12px;
        color: var(--sub, #64748b);
      }

      .close-btn {
        background: transparent;
        border: none;
        color: var(--sub, #64748b);
        padding: 6px;
        border-radius: 6px;
        cursor: pointer;
        display: grid;
        place-items: center;

        &:hover {
          background: #f1f5f9;
          color: var(--ink, #211c33);
        }
      }
    }

    .dialog-form {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;

      label span {
        color: var(--ink, #211c33);
        font: 700 10px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: 0.1em;
      }

      input[type="text"],
      input[type="url"] {
        border: 1px solid var(--line, #cbd5e1);
        border-radius: 7px;
        padding: 9px 12px;
        font-size: 13px;
        font-weight: 500;
        color: var(--ink, #211c33);
        outline: none;
        transition: border-color 0.15s ease;

        &:focus {
          border-color: var(--blue, #2e13f5);
          box-shadow: 0 0 0 3px rgba(46, 19, 245, 0.1);
        }

        &::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }
      }

      .input-with-prefix {
        display: flex;
        align-items: center;
        border: 1px solid var(--line, #cbd5e1);
        border-radius: 7px;
        overflow: hidden;

        .prefix {
          background: #f8fafc;
          border-right: 1px solid var(--line, #cbd5e1);
          color: #64748b;
          font-size: 11px;
          font-family: ui-monospace, monospace;
          padding: 9px 10px;
          user-select: none;
        }

        input {
          border: none;
          flex: 1;
          padding: 9px 12px;
          font-size: 13px;
          outline: none;
        }

        &:focus-within {
          border-color: var(--blue, #2e13f5);
          box-shadow: 0 0 0 3px rgba(46, 19, 245, 0.1);
        }
      }

      .hint {
        font-size: 10.5px;
        color: #64748b;
        margin-top: 2px;
      }
    }

    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 8px 12px;
      color: #991b1b;
      font-size: 11.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dialog-footer {
      border-top: 1px solid var(--line, #e2e8f0);
      margin-top: 8px;
      padding-top: 16px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;

      button {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 9px 16px;
        border-radius: 7px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .btn-secondary {
        background: #ffffff;
        border: 1px solid var(--line, #cbd5e1);
        color: var(--ink, #211c33);

        &:hover {
          background: #f8fafc;
        }
      }

      .btn-primary {
        background: var(--blue, #2e13f5);
        border: 1px solid var(--blue, #2e13f5);
        color: #ffffff;

        &:hover:not(:disabled) {
          background: #230ecc;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(12px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class NewTenantDialogComponent {
  readonly tenantService = inject(TenantService);

  @Input() isOpen = false;
  @Output() closeDialog = new EventEmitter<void>();

  name = '';
  slug = '';
  portalUrl = '';
  logoUrl = '';
  readonly errorMessage = signal<string>('');

  onNameChange(val: string): void {
    if (!this.slug || this.slug === this.generateSlug(val.slice(0, -1))) {
      this.slug = this.generateSlug(val);
    }
  }

  generateSlug(val: string): string {
    return (val || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  isValid(): boolean {
    return !!(this.name.trim() && this.slug.trim());
  }

  close(): void {
    this.errorMessage.set('');
    this.closeDialog.emit();
  }

  async onSubmit(): Promise<void> {
    if (!this.isValid()) return;
    this.errorMessage.set('');

    try {
      await this.tenantService.registerTenant({
        id: this.slug,
        name: this.name,
        portalUrl: this.portalUrl || `https://${this.slug}.gov.co`,
        logoUrl: this.logoUrl || undefined
      });

      this.name = '';
      this.slug = '';
      this.portalUrl = '';
      this.logoUrl = '';
      this.close();
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Error al registrar el portal');
    }
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { TenantService } from '@core/services/tenant.service';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-integration',
  imports: [LucideAngularModule],
  template: `
    <div class="page-content">
      <div class="page-heading">
        <div>
          <span class="eyebrow">INTEGRACIÓN NO INVASIVA</span>
          <h1>Google Tag Manager & Cargador</h1>
          <p>
            Cómo opera la publicación sin tocar el contenedor GTM en cada campaña.
            El portal solo requiere un cargador estático idempotente que consume el manifiesto del CDN.
          </p>
        </div>
        <div class="header-actions">
          <button class="q-button primary" (click)="openPortalDemo()" title="Abrir portal simulador externo">
            <lucide-icon name="external-link" [size]="14"></lucide-icon> Abrir Portal Simulador (AC-12)
          </button>
          <button class="q-button secondary" (click)="downloadGtmWorkspace()" title="Exportar contenedor GTM listo para importar">
            <lucide-icon name="download" [size]="14"></lucide-icon> Descargar Workspace GTM (AP-02)
          </button>
          <div class="connection-pill" [class.offline]="serverStatus() === 'offline'">
            <i aria-hidden="true"></i> {{ serverStatus() === 'online' ? 'CDN & API Activos (3000)' : 'Verificando CDN...' }}
          </div>
        </div>
      </div>

      <!-- Arquitectura de planos -->
      <section class="architecture-card">
        <div class="architecture-title">
          <h2>Separación de Planos: Control vs Datos</h2>
          <p>El editor administra el contenido en CDN; el portal consume de forma aislada sin privilegios de escritura.</p>
        </div>

        <div class="plane">
          <span class="plane-label">CONTROL PLANE</span>
          <div class="plane-flow">
            <article>
              <b>01 · EDITOR</b>
              <strong>Operador Quipux</strong>
              <small>Edición visual y reglas</small>
            </article>
            <i>→</i>
            <article>
              <b>02 · PIPELINE</b>
              <strong>Validador</strong>
              <small>Sanitización y checks</small>
            </article>
            <i>→</i>
            <article>
              <b>03 · RELEASE</b>
              <strong>Publicador</strong>
              <small>Versionado inmutable</small>
            </article>
          </div>
        </div>

        <div class="plane data-plane">
          <span class="plane-label">DATA PLANE</span>
          <div class="plane-flow">
            <article>
              <b>04 · CDN REPO</b>
              <strong>resources/tenants/</strong>
              <small>manifest.json estático</small>
            </article>
            <i>→</i>
            <article>
              <b>05 · RUNTIME</b>
              <strong>GTM Loader 3 KB</strong>
              <small>Inyección no intrusiva</small>
            </article>
            <i>→</i>
            <article>
              <b>06 · FRONTEND</b>
              <strong>&lt;quipux-popup&gt;</strong>
              <small>Shadow DOM aislado</small>
            </article>
          </div>
        </div>
      </section>

      <!-- Grid de instalación y gobernanza -->
      <div class="integration-grid">
        <section class="install-card">
          <div class="card-heading">
            <strong>Instalación única en Google Tag Manager</strong>
            <b>HTML PERSONALIZADO</b>
          </div>
          <p>
            Configura una única etiqueta en GTM de tipo <em>HTML personalizado</em> con el siguiente código.
            No requiere volver a editarse cuando cambies de campaña o agregues slides:
          </p>

          <div class="code-block">
            <div>
              <span>GTM TAG · LOADER IDEMPOTENTE</span>
              <button (click)="copySnippet()" style="display: inline-flex; align-items: center; gap: 4px;">
                <lucide-icon name="copy" [size]="12"></lucide-icon> Copiar código
              </button>
            </div>
            <pre><code>{{ gtmSnippet() }}</code></pre>
          </div>

          <div class="trigger-info">
            <span aria-hidden="true"><lucide-icon name="zap" [size]="16"></lucide-icon></span>
            <div>
              <strong>Disparador recomendado: "All Pages" o "Consent Granted"</strong>
              <small>El cargador comprueba internamente la ruta SPA y la regla de frecuencia sin duplicar modales.</small>
            </div>
            <b>IDEMPOTENTE</b>
          </div>
        </section>

        <section class="governance-card">
          <div class="card-heading">
            <strong>Gobernanza del Modal</strong>
            <span>4 ETAPAS</span>
          </div>

          <div class="governance-step done">
            <b><lucide-icon name="check" [size]="12"></lucide-icon></b>
            <div>
              <strong>1. Guardado en borrador</strong>
              <small>Aislamiento de cambios en memoria y servidor.</small>
            </div>
            <i>Completado</i>
          </div>

          <div class="governance-step done">
            <b><lucide-icon name="check" [size]="12"></lucide-icon></b>
            <div>
              <strong>2. Validación pre-flight</strong>
              <small>Sanitización de enlaces y verificación de assets.</small>
            </div>
            <i>Completado</i>
          </div>

          <div class="governance-step active">
            <b>3</b>
            <div>
              <strong>3. Publicación al CDN</strong>
              <small>Generación de manifest inmutable con hash y versión.</small>
            </div>
            <i>Activo</i>
          </div>

          <div class="governance-step done">
            <b><lucide-icon name="check" [size]="12"></lucide-icon></b>
            <div>
              <strong>4. Reversión instantánea</strong>
              <small>Rollback de un clic a cualquier versión previa.</small>
            </div>
            <i>Verificado</i>
          </div>
        </section>
      </div>

      <!-- Tabla de decisiones arquitectónicas -->
      <section class="decision-table">
        <div class="section-title" style="padding: 17px 18px 10px;">
          <div>
            <h2>Matriz de Decisiones Arquitectónicas</h2>
            <small>Criterios aplicados según los requisitos del Reto Quipux 2026</small>
          </div>
        </div>

        <div class="decision-head">
          <span>DECISIÓN</span>
          <span>ENFOQUE ELEGIDO</span>
          <span>JUSTIFICACIÓN TÉCNICA</span>
          <span>ESTADO</span>
        </div>

        <div class="decision-row recommended">
          <span>
            <strong>Cargador desacoplado en GTM</strong>
            <small>Frente a inyección directa de HTML por campaña</small>
          </span>
          <span>Loader JS idempotente de 3 KB</span>
          <span>Evita desplegar workspaces de GTM en cada campaña de mercadeo.</span>
          <b>RECOMENDADO</b>
        </div>

        <div class="decision-row recommended">
          <span>
            <strong>Manifest JSON inmutable en CDN</strong>
            <small>Frente a API backend dependiente en tiempo real</small>
          </span>
          <span>CDN multitenant estático</span>
          <span>Latencia &lt; 20ms, alta disponibilidad y rollback inmediato por ruta.</span>
          <b>RECOMENDADO</b>
        </div>

        <div class="decision-row">
          <span>
            <strong>Eventos nativos a dataLayer</strong>
            <small>Sin telemetría invasiva ni recolección de PII</small>
          </span>
          <span>Eventos estándar Quipux</span>
          <span>Cumplimiento estricto con GDPR / Habeas Data (cero datos personales).</span>
          <b>CUMPLE</b>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page-content {
      width: min(1500px, 100%);
      margin: 0 auto;
      padding: 34px clamp(24px, 3vw, 46px) 54px;
    }

    .page-heading {
      justify-content: space-between;
      align-items: flex-start;
      gap: 30px;
      margin-bottom: 28px;
      display: flex;

      h1 {
        color: var(--ink);
        letter-spacing: -0.035em;
        margin: 0;
        font-size: clamp(28px, 3vw, 40px);
        font-weight: 900;
        line-height: 1.1;
      }

      p {
        color: #6f6b74;
        max-width: 690px;
        margin: 10px 0 0;
        font-size: 13px;
        line-height: 1.55;
      }
    }

    .connection-pill {
      color: #1f6e48;
      background: rgba(93, 201, 154, 0.2);
      border-radius: 99px;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      font-size: 10.5px;
      font-weight: 800;
      display: inline-flex;
      flex-shrink: 0;

      i {
        background: var(--green);
        border-radius: 50%;
        width: 8px;
        height: 8px;
      }
    }

    .architecture-card {
      border: 1px solid var(--line);
      background: #fff;
      margin-bottom: 18px;
      border-radius: 8px;
      overflow: hidden;
    }

    .architecture-title {
      border-bottom: 1px solid var(--line);
      padding: 20px 22px;

      h2 {
        color: var(--ink);
        letter-spacing: -0.02em;
        margin: 0;
        font-size: 18px;
        font-weight: 900;
      }

      p {
        color: #7d7881;
        margin: 5px 0 0;
        font-size: 10.5px;
      }
    }

    .plane {
      border-bottom: 1px solid var(--line-soft);
      grid-template-columns: 140px 1fr;
      align-items: center;
      gap: 18px;
      padding: 18px 22px;
      display: grid;

      &:last-child {
        border-bottom: 0;
      }

      &.data-plane {
        background: var(--cool);

        .plane-label {
          color: #286d73;
        }
      }
    }

    .plane-label {
      color: var(--blue);
      letter-spacing: 0.15em;
      font: 700 9px/1.2 ui-monospace, monospace;
    }

    .plane-flow {
      align-items: center;
      gap: 12px;
      display: flex;

      article {
        border: 1px solid var(--line);
        background: #fcfcfd;
        flex: 1;
        align-content: center;
        gap: 3px;
        min-width: 0;
        min-height: 74px;
        padding: 12px;
        display: grid;
        border-radius: 6px;

        b {
          color: var(--sky);
          font: 800 8px/1 ui-monospace, monospace;
        }

        strong {
          color: var(--ink);
          font-size: 11px;
        }

        small {
          color: #88838d;
          font-size: 9px;
        }
      }

      i {
        color: #aaa5ae;
        font-style: normal;
        font-weight: bold;
      }
    }

    .integration-grid {
      grid-template-columns: 1.35fr 0.65fr;
      gap: 14px;
      margin-bottom: 18px;
      display: grid;
    }

    .install-card, .governance-card {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
    }

    .install-card > p {
      color: #77727c;
      margin: 15px 18px 0;
      font-size: 11px;
      line-height: 1.5;
    }

    .code-block {
      background: var(--ink);
      border: 1px solid #332e40;
      margin: 14px 18px;
      border-radius: 6px;
      overflow: hidden;

      div {
        color: rgba(255, 255, 255, 0.48);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: #15121f;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        font: 700 8px/1 ui-monospace, monospace;
        display: flex;

        button {
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
          border: 0;
          padding: 5px 9px;
          font-size: 8px;
          font-weight: 800;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background: rgba(255, 255, 255, 0.22);
          }
        }
      }

      pre {
        color: #e6e2f2;
        margin: 0;
        padding: 16px;
        font: 10px/1.65 ui-monospace, monospace;
        overflow: auto;
      }
    }

    .trigger-info {
      background: var(--cool);
      grid-template-columns: 28px 1fr auto;
      align-items: center;
      gap: 12px;
      margin: 0 18px 18px;
      padding: 12px 14px;
      display: grid;
      border-radius: 6px;

      > span {
        width: 28px;
        height: 28px;
        color: var(--blue);
        background: #fff;
        place-items: center;
        display: grid;
        border-radius: 50%;
        font-size: 14px;
      }

      div {
        gap: 2px;
        display: grid;

        strong {
          color: var(--ink);
          font-size: 11px;
        }

        small {
          color: #77727c;
          font-size: 9.5px;
        }
      }

      b {
        color: #286d73;
        font-size: 8.5px;
        letter-spacing: 0.1em;
      }
    }

    .card-heading {
      border-bottom: 1px solid var(--line);
      justify-content: space-between;
      align-items: center;
      min-height: 57px;
      padding: 13px 18px;
      display: flex;

      strong {
        color: var(--ink);
        font-size: 13px;
        font-weight: 800;
      }

      b, span {
        color: #77727b;
        text-transform: uppercase;
        background: #f0eff2;
        padding: 4px 8px;
        font-size: 8.5px;
        border-radius: 4px;
      }
    }

    .governance-step {
      border-bottom: 1px solid var(--line-soft);
      grid-template-columns: 28px 1fr auto;
      align-items: center;
      gap: 12px;
      min-height: 64px;
      margin: 0 18px;
      padding: 10px 0;
      display: grid;

      &:last-child {
        border-bottom: 0;
      }

      b {
        border: 1px solid var(--line);
        width: 28px;
        height: 28px;
        color: var(--sub);
        place-items: center;
        font-size: 10px;
        display: grid;
        border-radius: 50%;
      }

      div {
        gap: 2px;
        display: grid;

        strong {
          color: var(--ink);
          font-size: 11px;
        }

        small {
          color: #8d8892;
          font-size: 9px;
        }
      }

      i {
        color: var(--sub);
        font-size: 9px;
        font-style: normal;
      }

      &.done {
        b {
          border-color: var(--green);
          color: #1f6e48;
          background: rgba(93, 201, 154, 0.18);
        }
        i {
          color: #1f6e48;
          font-weight: bold;
        }
      }

      &.active {
        b {
          border-color: var(--blue);
          background: var(--blue);
          color: #fff;
        }
        i {
          color: var(--blue);
          background: rgba(46, 19, 245, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
        }
      }
    }

    .decision-table {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 8px;
      overflow-x: auto;
    }

    .decision-head, .decision-row {
      grid-template-columns: 1.2fr 1fr 1.2fr 0.7fr;
      align-items: center;
      gap: 16px;
      min-width: 800px;
      display: grid;
    }

    .decision-head {
      min-height: 38px;
      color: var(--sub);
      letter-spacing: 0.11em;
      text-transform: uppercase;
      background: #fafafb;
      padding: 0 18px;
      font: 700 8.5px/1 ui-monospace, monospace;
    }

    .decision-row {
      border-top: 1px solid var(--line-soft);
      color: #68636d;
      min-height: 68px;
      padding: 10px 18px;
      font-size: 11px;

      strong {
        color: var(--ink);
        font-size: 12px;
      }

      small {
        color: #8b8690;
        font-size: 9.5px;
      }

      b {
        color: #716c76;
        background: #efedf1;
        width: max-content;
        padding: 5px 9px;
        font-size: 8.5px;
        border-radius: 4px;
      }

      &.recommended {
        background: rgba(93, 201, 154, 0.07);

        b {
          color: #1f6e48;
          background: rgba(93, 201, 154, 0.22);
        }
      }
    }

    @media (width <= 900px) {
      .plane {
        grid-template-columns: 1fr;
      }
      .plane-flow {
        flex-direction: column;
        align-items: stretch;

        i {
          text-align: center;
          transform: rotate(90deg);
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .q-button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid var(--line);

      &.primary {
        background: var(--blue);
        color: #fff;
        border-color: var(--blue);

        &:hover {
          background: #250ecc;
        }
      }

      &.secondary {
        background: #fff;
        color: var(--ink);

        &:hover {
          background: #f8f9fa;
        }
      }
    }
  `]
})
export class IntegrationComponent {
  readonly tenantService = inject(TenantService);
  private readonly toastService = inject(ToastService);

  readonly serverStatus = signal<'online' | 'offline'>('online');

  readonly gtmSnippet = computed(() => {
    const tenantId = this.tenantService.activeTenantId();
    return `<!-- Quipux Popup Studio Loader (Idempotente AC-16) -->
<script
  async
  src="http://localhost:3000/resources/runtime/quipux-popup-runtime.js"
  data-tenant="${tenantId}"
  data-campaign="active">
</script>`;
  });

  copySnippet(): void {
    navigator.clipboard?.writeText(this.gtmSnippet());
    this.toastService.show('Snippet de GTM copiado al portapapeles');
  }

  openPortalDemo(): void {
    window.open('http://localhost:3000/portal-demo', '_blank');
  }

  downloadGtmWorkspace(): void {
    const tenant = this.tenantService.activeTenantId();
    window.open(`http://localhost:3000/api/gtm/workspace-export?tenant=${tenant}`, '_blank');
    this.toastService.show(`Contenedor GTM JSON generado para ${tenant}`);
  }
}

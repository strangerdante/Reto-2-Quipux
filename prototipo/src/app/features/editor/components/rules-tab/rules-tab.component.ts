import { Component, inject } from '@angular/core';
import { CampaignService } from '@core/services/campaign.service';
import { TenantService } from '@core/services/tenant.service';

@Component({
  selector: 'app-rules-tab',
  imports: [],
  template: `
    <div class="panel-heading">
      <h2>Reglas de aparición</h2>
    </div>
    <p class="panel-copy">
      Define cuándo y con qué frecuencia se desplegará este modal en el portal de {{ tenantService.activeTenant().name }}.
    </p>

    <div class="field">
      <span>Retardo inicial de despliegue</span>
      <div class="input-suffix">
        <input
          type="number"
          min="0"
          max="30"
          [value]="campaignService.activeCampaign().rules.delay"
          (input)="onDelayChange($event)"
        />
        <b>segundos</b>
      </div>
      <small>Espera tras la carga inicial de la página antes de activar el modal.</small>
    </div>

    <div class="two-fields">
      <label class="field">
        <span>Fecha y hora de inicio (AC-09)</span>
        <input
          type="datetime-local"
          [value]="campaignService.activeCampaign().rules.startDate || ''"
          (input)="onDateChange('startDate', $event)"
        />
        <small>Momento exacto en que la campaña se activa en el portal.</small>
      </label>

      <label class="field">
        <span>Fecha y hora de vencimiento (AC-09)</span>
        <input
          type="datetime-local"
          [value]="campaignService.activeCampaign().rules.endDate || ''"
          (input)="onDateChange('endDate', $event)"
        />
        <small>Momento en que el modal deja de aparecer automáticamente.</small>
      </label>
    </div>

    <label class="field">
      <span>Frecuencia de aparición</span>
      <select
        [value]="campaignService.activeCampaign().rules.frequency"
        (change)="onFrequencyChange($event)"
      >
        <option value="Una vez por sesión">Una vez por sesión (SessionStorage)</option>
        <option value="Una vez por día">Una vez por día (LocalStorage 24h)</option>
        <option value="Siempre al ingresar">Siempre al ingresar (Sin persistencia)</option>
      </select>
    </label>

    <label class="field">
      <span>Patrón de ruta o URL (SPA)</span>
      <input
        type="text"
        [value]="campaignService.activeCampaign().rules.pathRule"
        (input)="onPathRuleChange($event)"
        placeholder="/portal-movilidad/*"
      />
      <small>Usa comodines como /* para abarcar subsecciones completas del portal.</small>
    </label>

    <div class="rule-toggle">
      <span>
        <strong>Cierre con tecla ESC y clic exterior</strong>
        <small>Criterio de accesibilidad WCAG 2.1 AA obligatorio.</small>
      </span>
      <button
        class="toggle"
        [class.on]="campaignService.activeCampaign().rules.escToggle"
        (click)="toggleRule('escToggle')"
        type="button"
        aria-label="Alternar cierre con tecla ESC"
      >
        <i></i>
      </button>
    </div>

    <div class="rule-toggle">
      <span>
        <strong>Autoplay continuo de diapositivas</strong>
        <small>Pausa automática al situar el puntero o enfocar con teclado.</small>
      </span>
      <button
        class="toggle"
        [class.on]="campaignService.activeCampaign().rules.autoplayToggle"
        (click)="toggleRule('autoplayToggle')"
        type="button"
        aria-label="Alternar autoplay"
      >
        <i></i>
      </button>
    </div>

    <div class="rule-toggle">
      <span>
        <strong>Telemetría Quipux dataLayer</strong>
        <small>Dispara eventos de apertura, visualización, clic y cierre sin PII.</small>
      </span>
      <button
        class="toggle"
        [class.on]="campaignService.activeCampaign().rules.dataLayerToggle"
        (click)="toggleRule('dataLayerToggle')"
        type="button"
        aria-label="Alternar telemetría dataLayer"
      >
        <i></i>
      </button>
    </div>

    <div class="spa-note">
      <span>SPA</span>
      <p>
        El cargador GTM escucha eventos de <code>popstate</code> y <code>pushState</code> para
        desmontar o remontar el modal de forma idempotente sin duplicar estilos en el DOM.
      </p>
    </div>
  `,
  styles: [`
    .panel-heading h2 {
      color: var(--ink);
      letter-spacing: -0.025em;
      margin: 0;
      font-size: 20px;
      font-weight: 900;
    }

    .panel-copy {
      color: #7d7882;
      margin: 8px 0 20px;
      font-size: 11px;
      line-height: 1.5;
    }

    .field {
      margin-bottom: 14px;
      display: block;

      span {
        color: var(--ink);
        margin-bottom: 5px;
        font-size: 11px;
        font-weight: 800;
        display: block;
      }

      input, select {
        width: 100%;
        color: var(--body);
        background: #fff;
        border: 1.5px solid #dddae5;
        border-radius: 7px;
        outline: 0;
        padding: 9px 12px;
        font-size: 11.5px;

        &:focus {
          border-color: var(--blue);
        }
      }

      small {
        color: var(--sub);
        margin-top: 4px;
        font-size: 9.5px;
        display: block;
      }
    }

    .input-suffix {
      grid-template-columns: 1fr auto;
      display: grid;

      input {
        border-radius: 7px 0 0 7px;
      }

      b {
        color: #77727c;
        background: #f4f3f6;
        border: 1.5px solid #dddae5;
        border-left: 0;
        padding: 9px 12px;
        font-size: 10.5px;
        border-radius: 0 7px 7px 0;
        display: grid;
        place-items: center;
      }
    }

    .rule-toggle {
      border-top: 1px solid var(--line-soft);
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      min-height: 56px;
      display: flex;
      padding: 6px 0;

      > span {
        gap: 2px;
        display: grid;

        strong {
          color: var(--ink);
          font-size: 11px;
        }

        small {
          color: var(--sub);
          font-size: 9.5px;
        }
      }
    }

    .toggle {
      background: #cbc8ce;
      border: 0;
      border-radius: 99px;
      width: 36px;
      height: 20px;
      padding: 2px;
      cursor: pointer;
      transition: background 0.2s ease;
      flex-shrink: 0;

      i {
        background: #fff;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        display: block;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease;
      }

      &.on {
        background: var(--blue);

        i {
          transform: translateX(16px);
        }
      }
    }

    .spa-note {
      border-left: 3px solid var(--purple);
      background: rgba(91, 25, 209, 0.08);
      grid-template-columns: 34px 1fr;
      align-items: center;
      gap: 10px;
      margin-top: 16px;
      padding: 12px;
      display: grid;
      border-radius: 6px;

      span {
        color: var(--purple);
        font: 900 11px/1 ui-monospace, monospace;
      }

      p {
        color: #655f6a;
        margin: 0;
        font-size: 10px;
        line-height: 1.45;

        code {
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 4px;
          border-radius: 3px;
        }
      }
    }

    .two-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }

    @media (width <= 620px) {
      .two-fields {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RulesTabComponent {
  readonly campaignService = inject(CampaignService);
  readonly tenantService = inject(TenantService);

  onDelayChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value) || 0;
    this.campaignService.updateRules({ delay: val });
  }

  onDateChange(field: 'startDate' | 'endDate', event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.campaignService.updateRules({ [field]: val });
  }

  onFrequencyChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.campaignService.updateRules({ frequency: val });
  }

  onPathRuleChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.campaignService.updateRules({ pathRule: val });
  }

  toggleRule(field: 'escToggle' | 'autoplayToggle' | 'dataLayerToggle'): void {
    const current = this.campaignService.activeCampaign().rules[field];
    this.campaignService.updateRules({ [field]: !current });
  }
}

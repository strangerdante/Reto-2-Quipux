import { Component, inject, OnInit } from '@angular/core';
import { CampaignService } from '@core/services/campaign.service';
import { TenantService } from '@core/services/tenant.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-rules-tab',
  imports: [LucideAngularModule],
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
          [value]="getNormalizedDelay()"
          (input)="onDelayChange($event)"
        />
        <b>segundos</b>
      </div>
      <small>Espera tras la carga inicial de la página antes de activar el modal.</small>
    </div>

    <!-- Sección de programación temporal en formato 24 horas (AC-09) -->
    <div class="schedule-section">
      <div class="schedule-card">
        <div class="schedule-header">
          <span class="schedule-title">Fecha y hora de inicio (AC-09)</span>
          <span class="badge-24h" title="Formato 24 horas sin sufijos a.m./p.m.">
            <lucide-icon name="clock" [size]="10"></lucide-icon> 24h
          </span>
        </div>
        <div class="schedule-controls">
          <div class="date-col">
            <span class="input-sublabel">Fecha</span>
            <input
              type="date"
              class="date-input"
              [value]="getDatePart('startDate')"
              (change)="onDatePartChange('startDate', $event)"
              aria-label="Fecha de inicio"
            />
          </div>
          <div class="time-col">
            <span class="input-sublabel">Hora (24h)</span>
            <div class="time-box">
              <input
                type="text"
                class="time-input"
                maxlength="5"
                placeholder="00:00"
                list="quipux-time-presets"
                [value]="getTimePart('startDate')"
                (input)="onTimePartChange('startDate', $event)"
                (blur)="onTimeBlur('startDate', $event)"
                (keydown)="onTimeKeyDown('startDate', $event)"
                aria-label="Hora de inicio en formato 24 horas"
                title="Formato 24 horas (00:00 a 23:59). Flechas Arriba/Abajo para cambiar la hora."
              />
              <span class="time-unit">hrs</span>
            </div>
          </div>
        </div>
        <small class="field-hint">Momento exacto en que la campaña se activa en el portal.</small>
      </div>

      <div class="schedule-card">
        <div class="schedule-header">
          <span class="schedule-title">Fecha y hora de vencimiento (AC-09)</span>
          <span class="badge-24h" title="Formato 24 horas sin sufijos a.m./p.m.">
            <lucide-icon name="clock" [size]="10"></lucide-icon> 24h
          </span>
        </div>
        <div class="schedule-controls">
          <div class="date-col">
            <span class="input-sublabel">Fecha</span>
            <input
              type="date"
              class="date-input"
              [value]="getDatePart('endDate')"
              (change)="onDatePartChange('endDate', $event)"
              aria-label="Fecha de vencimiento"
            />
          </div>
          <div class="time-col">
            <span class="input-sublabel">Hora (24h)</span>
            <div class="time-box">
              <input
                type="text"
                class="time-input"
                maxlength="5"
                placeholder="23:59"
                list="quipux-time-presets"
                [value]="getTimePart('endDate')"
                (input)="onTimePartChange('endDate', $event)"
                (blur)="onTimeBlur('endDate', $event)"
                (keydown)="onTimeKeyDown('endDate', $event)"
                aria-label="Hora de vencimiento en formato 24 horas"
                title="Formato 24 horas (00:00 a 23:59). Flechas Arriba/Abajo para cambiar la hora."
              />
              <span class="time-unit">hrs</span>
            </div>
          </div>
        </div>
        <small class="field-hint">Momento en que el modal deja de aparecer automáticamente.</small>
      </div>

      <!-- Presets de horas frecuentes para selección rápida -->
      <datalist id="quipux-time-presets">
        <option value="00:00">00:00 (Medianoche)</option>
        <option value="06:00">06:00 (Apertura matutina)</option>
        <option value="08:00">08:00 (Inicio jornada laboral)</option>
        <option value="12:00">12:00 (Mediodía)</option>
        <option value="14:00">14:00 (Inicio turno tarde)</option>
        <option value="18:00">18:00 (Fin jornada laboral)</option>
        <option value="20:00">20:00 (Noche)</option>
        <option value="23:59">23:59 (Fin del día)</option>
      </datalist>
    </div>

    <label class="field">
      <span>Frecuencia de aparición</span>
      <select
        [value]="getNormalizedFrequency()"
        (change)="onFrequencyChange($event)"
      >
        <option value="Una vez por sesión" [selected]="getNormalizedFrequency() === 'Una vez por sesión'">Una vez por sesión (SessionStorage)</option>
        <option value="Una vez por día" [selected]="getNormalizedFrequency() === 'Una vez por día'">Una vez por día (LocalStorage 24h)</option>
        <option value="Siempre al ingresar" [selected]="getNormalizedFrequency() === 'Siempre al ingresar'">Siempre al ingresar (Sin persistencia)</option>
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

    .schedule-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 14px;
    }

    .schedule-card {
      background: #faf9fd;
      border: 1.5px solid #e3e0ea;
      border-radius: 8px;
      padding: 10px 12px;
      transition: border-color 0.15s ease, background 0.15s ease;

      &:focus-within {
        border-color: var(--blue);
        background: #fff;
      }
    }

    .schedule-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .schedule-title {
      color: var(--ink);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .badge-24h {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .schedule-controls {
      display: grid;
      grid-template-columns: 1fr 108px;
      gap: 8px;
      align-items: end;
    }

    .input-sublabel {
      display: block;
      color: #716b7a;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }

    .date-input {
      width: 100%;
      color: var(--body);
      background: #fff;
      border: 1.5px solid #dddae5;
      border-radius: 6px;
      outline: 0;
      padding: 7px 9px;
      font-size: 11.5px;
      font-family: inherit;
      transition: border-color 0.15s ease;

      &:focus {
        border-color: var(--blue);
      }
    }

    .time-box {
      display: flex;
      align-items: center;
      background: #fff;
      border: 1.5px solid #dddae5;
      border-radius: 6px;
      overflow: hidden;
      transition: border-color 0.15s ease;

      &:focus-within {
        border-color: var(--blue);
      }

      .time-input {
        width: 100%;
        border: 0;
        outline: 0;
        padding: 7px 4px 7px 8px;
        font-size: 11.5px;
        font-weight: 700;
        color: var(--ink);
        background: transparent;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: 0.05em;
        text-align: center;
      }

      .time-unit {
        color: #8b8593;
        font-size: 9px;
        font-weight: 700;
        background: #f4f3f6;
        padding: 7px 6px;
        border-left: 1px solid #e3e0ea;
        user-select: none;
      }
    }

    .field-hint {
      color: var(--sub);
      margin-top: 5px;
      font-size: 9.5px;
      display: block;
    }
  `]
})
export class RulesTabComponent implements OnInit {
  readonly campaignService = inject(CampaignService);
  readonly tenantService = inject(TenantService);

  ngOnInit(): void {
    const currentFreq = this.campaignService.activeCampaign().rules?.frequency;
    if (!currentFreq || currentFreq === 'once_per_session') {
      this.campaignService.updateRules({ frequency: 'Una vez por sesión' });
    }
  }

  getNormalizedFrequency(): string {
    const freq = this.campaignService.activeCampaign().rules?.frequency;
    if (!freq || freq === 'once_per_session' || freq === 'Una vez por sesión') {
      return 'Una vez por sesión';
    }
    if (freq === 'once_per_device' || freq === 'Una vez por día') {
      return 'Una vez por día';
    }
    if (freq === 'always' || freq === 'Siempre al ingresar') {
      return 'Siempre al ingresar';
    }
    return 'Una vez por sesión';
  }

  getNormalizedDelay(): number {
    const d = this.campaignService.activeCampaign().rules?.delay;
    if (d && d > 60) return Math.round(d / 1000);
    return d ?? 0;
  }

  onDelayChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value) || 0;
    this.campaignService.updateRules({ delay: val });
  }

  getDatePart(field: 'startDate' | 'endDate'): string {
    const val = this.campaignService.activeCampaign().rules?.[field];
    if (!val) return '';
    if (val.includes('T')) return val.split('T')[0];
    if (val.length === 10) return val;
    return '';
  }

  getTimePart(field: 'startDate' | 'endDate'): string {
    const val = this.campaignService.activeCampaign().rules?.[field];
    if (!val) return field === 'endDate' ? '23:59' : '00:00';
    if (val.includes('T')) {
      const time = val.split('T')[1];
      if (time) return time.substring(0, 5);
    }
    return field === 'endDate' ? '23:59' : '00:00';
  }

  onDatePartChange(field: 'startDate' | 'endDate', event: Event): void {
    const dateVal = (event.target as HTMLInputElement).value;
    if (!dateVal) {
      this.campaignService.updateRules({ [field]: '' });
      return;
    }
    const currentTime = this.getTimePart(field) || (field === 'endDate' ? '23:59' : '00:00');
    this.campaignService.updateRules({ [field]: `${dateVal}T${currentTime}` });
  }

  onTimePartChange(field: 'startDate' | 'endDate', event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const rawVal = inputEl.value.trim();
    const match = rawVal.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const hh = match[1].padStart(2, '0');
      const mm = match[2];
      const hNum = parseInt(hh, 10);
      const mNum = parseInt(mm, 10);
      if (hNum >= 0 && hNum <= 23 && mNum >= 0 && mNum <= 59) {
        const validTime = `${hh}:${mm}`;
        const currentDate = this.getDatePart(field) || new Date().toISOString().split('T')[0];
        this.campaignService.updateRules({ [field]: `${currentDate}T${validTime}` });
      }
    }
  }

  onTimeBlur(field: 'startDate' | 'endDate', event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const formatted = this.normalize24hTime(inputEl.value.trim(), field);
    inputEl.value = formatted;
    const currentDate = this.getDatePart(field) || new Date().toISOString().split('T')[0];
    this.campaignService.updateRules({ [field]: `${currentDate}T${formatted}` });
  }

  onTimeKeyDown(field: 'startDate' | 'endDate', event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const inputEl = event.target as HTMLInputElement;
      const current = this.getTimePart(field);
      let [h, m] = current.split(':').map(Number);
      if (isNaN(h)) h = 0;
      if (isNaN(m)) m = 0;
      const delta = event.key === 'ArrowUp' ? 1 : -1;
      h = (h + delta + 24) % 24;
      const newTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      inputEl.value = newTime;
      const currentDate = this.getDatePart(field) || new Date().toISOString().split('T')[0];
      this.campaignService.updateRules({ [field]: `${currentDate}T${newTime}` });
    }
  }

  private normalize24hTime(val: string, field: 'startDate' | 'endDate'): string {
    if (!val) return field === 'endDate' ? '23:59' : '00:00';
    const cleaned = val.replace(/[^\d:]/g, '');
    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      let h = parseInt(parts[0], 10) || 0;
      let m = parseInt(parts[1], 10) || 0;
      h = Math.max(0, Math.min(23, h));
      m = Math.max(0, Math.min(59, m));
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else if (cleaned.length === 4) {
      let h = parseInt(cleaned.substring(0, 2), 10) || 0;
      let m = parseInt(cleaned.substring(2, 4), 10) || 0;
      h = Math.max(0, Math.min(23, h));
      m = Math.max(0, Math.min(59, m));
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else if (cleaned.length > 0 && cleaned.length <= 2) {
      let h = parseInt(cleaned, 10) || 0;
      h = Math.max(0, Math.min(23, h));
      return `${String(h).padStart(2, '0')}:00`;
    }
    return field === 'endDate' ? '23:59' : '00:00';
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

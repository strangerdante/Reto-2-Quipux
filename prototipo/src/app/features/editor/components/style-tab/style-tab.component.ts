import { Component } from '@angular/core';

@Component({
  selector: 'app-style-tab',
  imports: [],
  template: `
    <div class="panel-heading">
      <h2>Estilo y apariencia</h2>
    </div>
    <p class="panel-copy">
      Línea gráfica gobernada Quipux 2026. Los componentes respetan tokens globales sin CSS arbitrario ni estilos que rompan accesibilidad.
    </p>

    <div class="theme-card">
      <div class="theme-swatches">
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
        <i aria-hidden="true"></i>
      </div>
      <span>
        <strong>Quipux Institucional 2026</strong>
        <small>Paleta de contraste AA/AAA validada</small>
      </span>
      <b>ACTIVO</b>
    </div>

    <div class="token-list">
      <div>
        <span>Acción principal (CTA / Foco)</span>
        <code>#2e13f5 (--blue)</code>
        <i class="token blue" aria-hidden="true"></i>
      </div>
      <div>
        <span>Acentos y resalte secundario</span>
        <code>#61c7d0 (--sky)</code>
        <i class="token sky" aria-hidden="true"></i>
      </div>
      <div>
        <span>Fondos oscuros y tipografía principal</span>
        <code>#211c33 (--ink)</code>
        <i class="token ink" aria-hidden="true"></i>
      </div>
      <div>
        <span>Estados de éxito y verificación</span>
        <code>#5dc99a (--green)</code>
        <i class="token green" aria-hidden="true"></i>
      </div>
    </div>

    <div class="safe-info">
      <span aria-hidden="true">✓</span>
      <p>
        <strong>Gobernanza de diseño activa</strong>
        El componente consume únicamente variables CSS aprobadas. No es posible inyectar reglas destructivas ni alterar tipografías corporativas.
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

    .theme-card {
      border: 1px solid var(--line);
      background: #fff;
      grid-template-columns: 80px 1fr auto;
      align-items: center;
      gap: 11px;
      margin: 7px 0 16px;
      padding: 14px;
      display: grid;
      border-radius: 6px;

      > span {
        gap: 3px;
        display: grid;

        strong {
          color: var(--ink);
          font-size: 11.5px;
          font-weight: 800;
        }

        small {
          color: var(--sub);
          font-size: 9.5px;
        }
      }

      b {
        color: #1f6e48;
        background: rgba(93, 201, 154, 0.2);
        padding: 4px 8px;
        font-size: 8.5px;
        border-radius: 4px;
      }
    }

    .theme-swatches {
      display: flex;

      i {
        border: 2px solid #fff;
        width: 23px;
        height: 34px;
        margin-left: -4px;
        border-radius: 3px;

        &:first-child {
          background: var(--ink);
          margin-left: 0;
        }
        &:nth-child(2) {
          background: var(--blue);
        }
        &:nth-child(3) {
          background: var(--sky);
        }
        &:nth-child(4) {
          background: var(--green);
        }
      }
    }

    .token-list {
      border: 1px solid var(--line);
      border-radius: 6px;
      overflow: hidden;

      > div {
        border-top: 1px solid var(--line-soft);
        grid-template-columns: 1fr auto 25px;
        align-items: center;
        gap: 10px;
        min-height: 46px;
        padding: 8px 12px;
        display: grid;

        &:first-child {
          border-top: 0;
        }

        span {
          color: #6d6871;
          font-size: 10.5px;
        }

        code {
          color: var(--ink);
          font-size: 10px;
          background: #f4f3f6;
          padding: 3px 6px;
          border-radius: 4px;
        }
      }
    }

    .token {
      width: 25px;
      height: 25px;
      border-radius: 4px;

      &.blue { background: var(--blue); }
      &.ink { background: var(--ink); }
      &.sky { background: var(--sky); }
      &.green { background: var(--green); }
    }

    .safe-info {
      background: var(--cool);
      color: #286d73;
      gap: 10px;
      margin-top: 18px;
      padding: 13px;
      display: flex;
      border-radius: 6px;

      span {
        background: var(--sky);
        width: 24px;
        height: 24px;
        color: var(--ink);
        border-radius: 50%;
        flex: none;
        place-items: center;
        font-size: 10px;
        font-weight: 900;
        display: grid;
      }

      p {
        gap: 3px;
        margin: 0;
        font-size: 10px;
        line-height: 1.4;
        display: grid;

        strong {
          font-size: 11px;
        }
      }
    }
  `]
})
export class StyleTabComponent {}

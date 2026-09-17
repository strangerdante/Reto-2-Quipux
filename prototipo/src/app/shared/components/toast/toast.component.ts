import { Component, inject } from '@angular/core';
import { ToastService } from '@core/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  imports: [LucideAngularModule],
  template: `
    @if (toastService.message(); as msg) {
      <div class="toast" role="status" aria-live="polite">
        <span><lucide-icon name="check" [size]="14"></lucide-icon></span>
        <p>{{ msg }}</p>
      </div>
    }
  `,
  styles: [`
    .toast {
      z-index: 100;
      background: var(--ink);
      color: #fff;
      align-items: center;
      gap: 10px;
      min-height: 45px;
      padding: 10px 16px 10px 12px;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      position: fixed;
      bottom: 24px;
      right: 24px;
      box-shadow: 0 14px 36px rgba(33, 28, 51, 0.3);
      border-radius: 6px;
      animation: slideIn 0.2s ease-out;

      p {
        margin: 0;
      }

      span {
        background: var(--green);
        width: 24px;
        height: 24px;
        color: var(--ink);
        border-radius: 50%;
        place-items: center;
        display: grid;
        font-size: 12px;
        font-weight: 900;
        flex-shrink: 0;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateY(10px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}

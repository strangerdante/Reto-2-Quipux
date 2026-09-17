import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private _message = signal<string | null>(null);
  readonly message = this._message.asReadonly();

  private _timer: ReturnType<typeof setTimeout> | null = null;

  show(msg: string, durationMs = 2400): void {
    if (this._timer) {
      clearTimeout(this._timer);
    }
    this._message.set(msg);
    this._timer = setTimeout(() => {
      this._message.set(null);
      this._timer = null;
    }, durationMs);
  }

  clear(): void {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this._message.set(null);
  }
}

import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  LucideAngularModule,
  Layers, Folder, Zap, Clock, ShieldCheck, Check, CheckCircle2, FileEdit,
  Plus, Download, Search, ArrowRight, ArrowLeft, RefreshCw, Copy, Save,
  Rocket, GitCompare, GripVertical, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff,
  Trash2, Monitor, Laptop, Smartphone, X, ExternalLink, History,
  Images, Megaphone, AlertTriangle, Star, FileText, Upload,
  Bell, CircleHelp
} from 'lucide-angular';

import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { APP_CONFIG, resolveAppConfig } from './core/config/app-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    { provide: APP_CONFIG, useValue: resolveAppConfig() },
    provideRouter(routes, withComponentInputBinding()),
    importProvidersFrom(
      LucideAngularModule.pick({
        Layers, Folder, Zap, Clock, ShieldCheck, Check, CheckCircle2, FileEdit,
        Plus, Download, Search, ArrowRight, ArrowLeft, RefreshCw, Copy, Save,
        Rocket, GitCompare, GripVertical, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff,
        Trash2, Monitor, Laptop, Smartphone, X, ExternalLink, History,
        Images, Megaphone, AlertTriangle, Star, FileText, Upload,
        Bell, CircleHelp
      })
    )
  ]
};

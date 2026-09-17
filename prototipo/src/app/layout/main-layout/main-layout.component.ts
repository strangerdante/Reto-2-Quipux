import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastComponent } from '@shared/components/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastComponent],
  template: `
    <div class="studio-app">
      <app-sidebar />
      <div class="main-shell">
        <app-topbar />
        <main class="page-container">
          <router-outlet />
        </main>
      </div>
      <app-toast />
    </div>
  `,
  styles: [`
    .studio-app {
      background: #f7f7f9;
      grid-template-columns: 252px minmax(0, 1fr);
      min-height: 100vh;
      display: grid;
    }

    .main-shell {
      min-width: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .page-container {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    @media (width <= 1180px) {
      .studio-app {
        grid-template-columns: 210px minmax(0, 1fr);
      }
    }

    @media (width <= 900px) {
      .studio-app {
        grid-template-columns: 72px minmax(0, 1fr);
      }
    }
  `]
})
export class MainLayoutComponent {}

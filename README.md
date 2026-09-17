# Quipux Popup Studio — Reto #2 Frontend

Plataforma integral y autónoma para la creación, edición, previsualización, publicación y reversión de modales y sliders informativos multitenant, desacoplando al 100% la intervención del equipo de desarrollo Frontend y eliminando la edición manual recurrente en Google Tag Manager (GTM).

---

## 🏛️ Arquitectura de Dos Planos

El proyecto implementa una arquitectura estrictamente desacoplada regida por la **Regla de Oro de Cero Simulaciones** y principios de **Alta Cohesión, Bajo Acoplamiento y Patrones Pragmáticos (YAGNI & KISS)**:

```
┌────────────────────────────────────────────────────────┐
│             PLANO DE CONTROL (Control Plane)           │
│         Quipux Popup Studio (Angular 21 en prototipo/) │
│  - Editor visual reactivo de 3 columnas con Signals    │
│  - Administración multitenant (Valle, Medellín, etc.)  │
│  - Carga multipart y validación física (< 500 KB)      │
│  - Preflight checks dinámicos y versionado inmutable   │
│  - AP-01: Aprobación por roles (Editor/Revisor/Pub)    │
│  - AP-03: Visualizador de diferencias (Diff Viewer)    │
│  - AP-04: Conversor de modales legacy AngularJS        │
└──────────────────────────┬─────────────────────────────┘
                           │ Publica active.json & snapshots v{N}.json
                           ▼
┌────────────────────────────────────────────────────────┐
│            ALMACENAMIENTO MULTITENANT (CDN)            │
│                 Servidor Express (server/)             │
│  - resources/tenants/{tenant}/manifests/{camp}/...     │
│  - resources/tenants/{tenant}/assets/{desktop|mobile}/ │
│  - AP-02: Exportador de Workspace GTM (/api/gtm/export)│
└──────────────────────────┬─────────────────────────────┘
                           │ Consulta manifest activo al instante
                           ▼
┌────────────────────────────────────────────────────────┐
│             PLANO DE DATOS (Data Plane / Runtime)      │
│     Web Component autónomo en JS Vanilla (runtime/)    │
│  - Inyectado 1 sola vez vía GTM en el portal cliente   │
│  - Aislamiento absoluto con Shadow DOM (22.84 KB)      │
│  - Idempotente (window.__QUIPUX_POPUP_LOADED__)        │
│  - Escucha de rutas SPA (popstate & pushState)         │
│  - Accesibilidad WCAG 2.1 AA (Focus Trap & Esc key)    │
│  - Emisión de eventos anónimos a dataLayer sin PII     │
└──────────────────────────┬─────────────────────────────┘
                           │ Renderiza en vivo
                           ▼
┌────────────────────────────────────────────────────────┐
│          PORTAL CIUDADANO SIMULADOR (portal-demo/)     │
│  - Simula portal de Impuesto Vehicular y Trámites      │
│  - Rutas SPA interactivas (/tramites, /pagos, etc.)    │
│  - Consola HUD en vivo de dataLayer con escudo anti-PII│
│  - Botón interactivo de prueba de idempotencia (AC-16) │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js**: v18+ (recomendado v20+)
- **NPM**: v9+

### Instalación de Dependencias
```bash
# Instalar dependencias raíz y dependencias de Angular
npm install
cd prototipo && npm install && cd ..
cd runtime && npm install && cd ..
```

### Ejecutar Todo el Entorno (Un Solo Comando)
```bash
npm run dev
```

Este comando inicia de forma concurrente los dos planos de la arquitectura:

| Módulo | URL de Acceso | Descripción |
|---|---|---|
| 🎨 **Plano de Control (Studio)** | [http://localhost:4200](http://localhost:4200) | **Interfaz principal (Angular 21)**. Creación, edición, previsualización en vivo y publicación de popups. |
| 🌐 **Portal Ciudadano Simulador** | [http://localhost:3000/portal-demo](http://localhost:3000/portal-demo) | **Plano de Datos en vivo**. Portal externo con SPA router y HUD de analítica dataLayer. |
| 📡 **Servidor CDN y API REST** | [http://localhost:3000](http://localhost:3000) | Almacenamiento multitenant, endpoints de publicación y verificación de salud (`/api/health`). |

> [!NOTE]
> El puerto **3000** aloja el backend y CDN. Si accedes a la raíz (`/`) encontrarás el Hub central de navegación con accesos directos al Studio (`:4200`) y al Portal Simulador (`:3000/portal-demo`).

---

## 🧪 Comandos Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia simultáneamente el servidor backend y el estudio Angular. |
| `npm run server` | Inicia únicamente el servidor Express (API REST y CDN local). |
| `npm run studio` | Inicia la aplicación Angular 21 en `http://localhost:4200`. |
| `npm run build:runtime` | Compila y empaqueta el Web Component autónomo (`runtime/dist/quipux-popup-runtime.js`). |
| `npm run build` | Compila el runtime y genera el bundle de producción de Angular. |
| `npm test` | Ejecuta la suite de pruebas unitarias automatizadas (Vitest / Angular). |

---

## 📋 Guion de Demostración en 10 Pasos (Límite 8 Minutos)

Para la sustentación en vivo ante el jurado calificador (AC-25), siga los pasos descritos a continuación:

1. **Min 0:00 - 0:45 | Edición de Campaña (AC-01, AC-04):**
   - Ingrese a [http://localhost:4200](http://localhost:4200) con tenant *Valle del Cauca*.
   - Abra la campaña *"Cobro Coactivo 2026"*.
   - Modifique el título y el CTA en el formulario. Observe la reactividad instantánea en el previsualizador en vivo mediante Signals.

2. **Min 0:45 - 1:30 | Gestión de Slides (AC-03):**
   - Agregue un nuevo slide con el botón *"+ Agregar Slide"*.
   - Utilice los controles de reordenamiento (flechas Subir/Bajar) o duplique un slide.

3. **Min 1:30 - 2:15 | Validación Multimedia (AC-05, AC-06):**
   - Intente subir el archivo `test-assets/imagen-pesada-750kb.png`. La interfaz rechazará el archivo mostrando una alerta roja indicando que supera los 500 KB.
   - Suba el archivo válido `test-assets/banner-valido-100kb.png`. El archivo se cargará físicamente a la ruta multitenant de almacenamiento en disco.

4. **Min 2:15 - 3:00 | Aislamiento Multitenant (AC-02):**
   - Cambie el tenant en el Topbar a *Medellín*.
   - Compruebe que las campañas de Valle desaparecen y solo se muestran las de Medellín.
   - Abra *Recursos CDN* y verifique el aislamiento estricto de rutas de storage.

5. **Min 3:00 - 3:45 | Reglas de Aparición (AC-09):**
   - En la pestaña *Reglas*, configure la vigencia, retardo (segundos), frecuencia y ruta SPA `/tramites/*`.

6. **Min 3:45 - 4:30 | Previsualización y Accesibilidad (AC-07, AC-18):**
   - Alterne entre la vista *Desktop* y *Mobile*.
   - Navegue por teclado con `Tab` y cierre la vista previa presionando la tecla `Escape`.

7. **Min 4:30 - 5:30 | Publicación en Caliente (AC-11, AC-12, AC-13):**
   - Presione *"Publicar"*. El modal ejecutará los *Preflight Checks*.
   - Revise la pestaña *Comparador de Versiones (AP-03)* para inspeccionar el diff visual.
   - Confirme la publicación. Se generará la versión inmutable `v2.json`.
   - Abra [http://localhost:3000/portal-demo](http://localhost:3000/portal-demo). El modal se actualizará al instante **sin tocar código ni reconfigurar GTM**.

8. **Min 5:30 - 6:15 | Prueba de Idempotencia (AC-16):**
   - En el portal demo, presione el botón *"🔄 Probar Doble Inyección (AC-16)"*.
   - Compruebe que la guarda interna impide la duplicación del componente o listeners en el DOM.

9. **Min 6:15 - 7:00 | Reversión Segura (AC-14, AC-15):**
   - En Quipux Studio, pestaña *Versiones*, seleccione la versión previa `v1` y presione *"Revertir a esta versión"*.
   - Compruebe que se genera un snapshot seguro hacia adelante (`v3`) y que el portal demo refleja de inmediato los datos de `v1`.
   - Ingrese a la vista */audit* para comprobar la trazabilidad del evento con fecha, usuario y rol.

10. **Min 7:00 - 8:00 | Analítica dataLayer y Cierre (AC-21, AC-25):**
    - En el portal demo, observe la consola inferior HUD que intercepta `window.dataLayer`.
    - Resalte ante el comité evaluador que los eventos (`impression`, `slide_view`, `cta_click`, `close`) no contienen ningún dato personal identificable (PII Shield activo).

---

## 📦 Características Adicionales de Valor (APs Implementadas)

- **AP-01:** Flujo de aprobación por roles (`Editor`, `Revisor`, `Publicador`).
- **AP-02:** Asistente de exportación de Workspace GTM en formato JSON (`/api/gtm/export`).
- **AP-03:** Visualizador de diferencias (Diff Viewer) entre versiones.
- **AP-04:** Importador y conversor de modales HTML / AngularJS legacy.

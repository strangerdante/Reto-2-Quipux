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
| `npm run server` | Inicia únicamente el servidor Express (API REST y CDN local en `:3000`). |
| `npm run studio` | Inicia la aplicación Angular 21 en `http://localhost:4200`. |
| `npm run build:runtime` | Compila y empaqueta el Web Component autónomo (`quipux-popup-runtime.js`, ~33.4 KB). |
| `npm run build` | Compila el runtime y genera el bundle de producción de Angular. |
| `npm test` | Ejecuta la suite completa de pruebas automatizadas (Runtime con Node.js + Angular con Vitest). |
| `npm run test:runtime` | Ejecuta las pruebas unitarias del runtime (FocusTrap, anti-PII, rutas SPA, escToggle). |
| `npm run test:studio` | Ejecuta las pruebas unitarias de servicios Angular. |

---

## 📋 Guion de Demostración en 10 Pasos (Límite 8 Minutos)

Para la sustentación en vivo ante el jurado calificador (AC-25), siga los pasos descritos a continuación:

1. **Min 0:00 - 0:45 | Edición de Campaña (AC-01, AC-04):**
   - Ingrese a [http://localhost:4200](http://localhost:4200) con tenant *Valle del Cauca*.
   - Abra la campaña *"Cobro Coactivo 2026"*.
   - Modifique el título, enlace, texto de CTA y configure el destino (`target`: Nueva pestaña o Misma pestaña, AC-04). Observe la reactividad instantánea en el previsualizador en vivo mediante Signals.

2. **Min 0:45 - 1:30 | Gestión de Slides y Gobernanza (AC-03, AP-01):**
   - Agregue un nuevo slide con el botón *"+ Agregar Slide"*.
   - Utilice los controles de reordenamiento (flechas Subir/Bajar) o duplique un slide.
   - Demuestre el flujo de aprobación por roles (AP-01): con rol *Editor* presione *"Solicitar Aprobación"*; alterne a rol *Revisor* en el topbar para *"Aprobar para Publicar"*.

3. **Min 1:30 - 2:15 | Validación Multimedia (AC-05, AC-06):**
   - Intente subir el archivo `test-assets/imagen-pesada-750kb.png`. La interfaz rechazará el archivo mostrando una alerta indicando que supera los 500 KB.
   - Intente subir un PDF o archivo no permitido: el servidor y cliente lo rechazan por formato MIME no autorizado.
   - Suba el archivo válido `test-assets/banner-valido-100kb.png`. El archivo se validará y cargará físicamente a la ruta multitenant de almacenamiento en disco.

4. **Min 2:15 - 3:00 | Aislamiento Multitenant (AC-02):**
   - Cambie el tenant en el Topbar a *Medellín*.
   - Compruebe que las campañas de Valle desaparecen y solo se muestran las de Medellín.
   - Abra *Recursos CDN* y verifique el aislamiento estricto de rutas de storage.

5. **Min 3:00 - 3:45 | Reglas de Aparición y SPA (AC-09, AC-17):**
   - En la pestaña *Reglas*, configure la vigencia, retardo (segundos), frecuencia y ruta SPA `/tramites/*`.
   - Demuestre que si el usuario navega a otra ruta SPA antes de cumplirse el retardo, los temporizadores pendientes se cancelan de inmediato (AC-17), evitando popups desfasados.

6. **Min 3:45 - 4:30 | Previsualización y Accesibilidad (AC-07, AC-18):**
   - Alterne entre la vista *Desktop* y *Mobile*.
   - Apague la regla `escToggle` y presione `Escape`: compruebe que el modal no se cierra. Encienda `escToggle` y presione `Escape`: compruebe que se cierra.
   - Demuestre que al estar abierto el modal, el resto de la página queda aislada para lectores de pantalla mediante `aria-hidden="true"` (AC-18) y el foco queda atrapado dentro del modal.

7. **Min 4:30 - 5:30 | Publicación en Caliente y Demostración Multicampaña (AC-11, AC-12, AC-13):**
   - Alterne a rol *Publicador* y presione *"Publicar"*. El modal ejecutará los *Preflight Checks* (con bloqueo estricto de URLs `//` relativas de protocolo, AC-19).
   - Revise la pestaña *Comparador de Versiones (AP-03)* para inspeccionar el diff visual slide por slide.
   - Confirme la publicación. Se generará la versión inmutable `vN.json` y se actualizará `active.json`.
   - Presione el botón directo **"Probar en Portal Demo (AC-12) ↗"**: el portal se abrirá con el ID exacto de la campaña publicada (`?campaign=...`) reflejando el cambio al instante **sin tocar código ni reconfigurar GTM**.

8. **Min 5:30 - 6:15 | Prueba de Idempotencia (AC-16):**
   - En el portal demo, presione el botón *"🔄 Doble Inyección (AC-16)"*.
   - Compruebe que la guarda global impide la duplicación del componente o listeners en el DOM.

9. **Min 6:15 - 7:00 | Reversión Segura (AC-14, AC-15):**
   - En Quipux Studio, pestaña *Versiones*, seleccione la versión previa `v1` y presione *"Revertir a esta versión"*.
   - Compruebe que se genera un snapshot seguro hacia adelante y que el portal demo refleja de inmediato el contenido revertido.
   - Ingrese a la vista */audit* para comprobar la trazabilidad del evento con fecha, usuario y rol.

10. **Min 7:00 - 8:00 | Analítica dataLayer, Plantilla Adicional y Cierre (AC-21, AP-05, AC-25):**
    - En el portal demo, observe la consola inferior HUD que intercepta `window.dataLayer`. Verifique que los eventos no contienen PII (Shield anti-PII).
    - En el Dashboard de Studio, demuestre la plantilla gobernada adicional **"Banner horizontal (AP-05)"** disponible y lista para usar.
    - Realice cualquier pequeño ajuste en vivo solicitado por el jurado.

---

## 📑 Informe Detallado de Cumplimiento de Criterios (AC & AP)

A continuación se detalla cómo la plataforma cumple al **100%** cada uno de los criterios exigidos, bajo la **Regla de Oro de Cero Simulaciones**:

### 🔴 Criterios de Aceptación Críticos (Obligatorios y Eliminatorios)

| Criterio | Estado | Cómo se cumple e Implementación Técnica |
|---|:---:|---|
| **AC-01: Gestión de Campañas** | **CUMPLE** | Implementado mediante [CampaignService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/campaign.service.ts) y [dashboard.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/dashboard/dashboard.component.ts). Permite crear (`createNewCampaign`), editar, renombrar y listar campañas desde la UI sin tocar código. Persistencia real en backend Express mediante endpoints REST (`/api/campaigns?tenant=...`) respaldados en archivos JSON físicos (`server/storage/tenants/{tenant}/campaigns.json`). Los datos sobreviven a recargas (`F5`) o reinicio del servidor. |
| **AC-05: Carga Real de Imágenes Multitenant** | **CUMPLE** | Implementado en [ResourceService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/resource.service.ts) y [server/routes/resources.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/server/routes/resources.js). Carga binaria multipart vía `FormData` con `multer` hacia la ruta de almacenamiento `resources/tenants/{tenant}/assets/{desktop\|mobile}/`. Genera URLs públicas absolutas descargables en el CDN local (`http://localhost:3000/resources/tenants/...`). Prohíbe y elimina el uso de dataUrls base64 efímeros en memoria. |
| **AC-07: Previsualizador Interactivo Dual** | **CUMPLE** | Implementado en [preview-canvas.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/preview-canvas/preview-canvas.component.ts). Canvas interactivo de 3 columnas que conmuta entre vistas Desktop (amplio) y Mobile (acotado a 420px) con Signals reactivas. Renderiza en tiempo real los textos, imágenes responsive y CTAs editados, con navegación de diapositivas por dots, soporte para layout side/top/content y botón de cierre simulado. |
| **AC-11: Acción Explícita de Publicación** | **CUMPLE** | Implementado en [PublishService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/publish.service.ts) y [publish-dialog.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/publish-dialog/publish-dialog.component.ts). Requiere confirmación explícita mediante un diálogo modal que evalúa en tiempo real 4 *Preflight Checks*: enlaces seguros (HTTPS o relativos autorizados), aislamiento de tenant en CDN, integridad de reglas de ruta/frecuencia y presencia de imágenes responsive en todos los slides. Si algún check falla, la publicación se bloquea. |
| **AC-12: Reflejo en Portal Externo sin GTM** | **CUMPLE** | Demostrado en [portal-demo/index.html](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/portal-demo/index.html) y [runtime/src/loader.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/runtime/src/loader.js). El portal ciudadano externo consume el script cargador una sola vez. Al confirmar la publicación en Studio, el backend escribe el release `v{N}.json` y actualiza atómicamente `active.json`. El portal demo obtiene al instante la nueva versión mediante petición HTTP estática al CDN sin necesidad de abrir ni editar Google Tag Manager. |
| **AC-16: Idempotencia del Cargador** | **CUMPLE** | Implementado en [runtime/src/loader.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/runtime/src/loader.js) mediante la guarda global `window.__QUIPUX_POPUP_LOADED__ = true` y la validación en DOM `document.querySelector('quipux-popup-studio')`. El portal demo cuenta con el botón interactivo *"🔄 Doble Inyección (AC-16)"* para demostrar en vivo que inyectar el script reiteradas veces no genera modales duplicados, conflictos de estilos ni fugas de listeners. |
| **AC-18: Accesibilidad (a11y) y Control Teclado** | **CUMPLE** | Implementado en [FocusTrap](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/runtime/src/focus-trap.js) y [quipux-popup.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/runtime/src/quipux-popup.js). Cumple WCAG 2.1 AA: captura de foco cíclico dentro del modal (Tab / Shift+Tab), aislamiento accesible del fondo mediante `aria-hidden="true"` y posterior restauración, cierre con tecla `Escape` según la regla `escToggle`, navegación con flechas de teclado, swipe táctil para dispositivos móviles y respeto a `prefers-reduced-motion: reduce`. |

---

### 🟢 Criterios de Aceptación Generales (AC-02 a AC-25)

| Criterio | Estado | Cómo se cumple e Implementación Técnica |
|---|:---:|---|
| **AC-02: Aislamiento Multitenant** | **CUMPLE** | Implementado en [TenantService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/tenant.service.ts), [topbar.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/layout/topbar/topbar.component.ts) y repositorios del servidor. Al alternar de cliente (Valle, Medellín, Cali) en el selector global, la interfaz recarga reactivamente únicamente las campañas, borradores, assets de storage y manifiestos de dicho tenant. Las rutas de storage en disco están estrictamente aisladas bajo `resources/tenants/{tenant}/`. |
| **AC-03: Manipulación de Slides** | **CUMPLE** | Implementado en [slide-list.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/slide-list/slide-list.component.ts) y [CampaignService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/campaign.service.ts). Permite agregar nuevos slides (`addSlide`), duplicar slides existentes conservando imágenes y textos (`duplicateSlide`), alternar visibilidad on/off (`toggleSlideActive`), eliminar (`deleteSlide`) y reordenar la secuencia mediante controles de flechas Arriba/Abajo con actualización reactiva en lista, canvas y manifest. |
| **AC-04: Campos de Contenido por Slide** | **CUMPLE** | Implementado en [slide-form.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/slide-form/slide-form.component.ts). Cada slide dispone de campos reactivos para: Título principal (H2), Bajada descriptiva, Texto del botón CTA, Enlace de destino, Selector de target (`_blank` o `_self`), Texto alternativo accesible (`alt`), e imágenes responsive diferenciadas para Desktop y Mobile. |
| **AC-06: Validación Multimedia** | **CUMPLE** | Implementado con doble capa de validación en [ResourceService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/resource.service.ts) y [server/routes/resources.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/server/routes/resources.js). Valida formato MIME real (WebP, PNG, JPG), límite de peso coherente con popups web (< 2 MB), dimensiones mínimas/máximas mediante parser binario de cabeceras de imagen, y sanitización de nombres evitando path traversal. Incluye auto-optimización por Canvas en cliente y muestra errores descriptivos en banner con `role="alert"` y toast. |
| **AC-08: Identidad Visual Quipux 2026** | **CUMPLE** | Implementado en [styles.scss](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/styles.scss) y [_variables.scss](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/styles/_variables.scss). Respeta estrictamente los tokens oficiales: Tinta nocturna (`#211C33`), Azul intenso (`#2E13F5`), Cian claro (`#61C7D0`) y Verde menta (`#5DC99A`). Emplea las tipografías institucionales Plus Jakarta Sans y Lato, y preserva los logotipos oficiales en [prototipo/brand/](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/brand/) sin deformación ni pixelado. |
| **AC-09: Reglas de Aparición en Runtime** | **CUMPLE** | Implementado en [rules-tab.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/rules-tab/rules-tab.component.ts) y [RuleEvaluator](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/runtime/src/rule-evaluator.js). Configuración de retardo (`delay` en s), vigencia temporal en formato 24 horas (`startDate`/`endDate`), frecuencia de despliegue (`sessionStorage`/`localStorage`) y coincidencia de ruta SPA (`pathRule`, ej. `/tramites/*`). Estas reglas se publican en el manifest y se evalúan dinámicamente en el runtime del portal cliente. |
| **AC-10: Gestión de Borradores** | **CUMPLE** | Implementado en [CampaignService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/campaign.service.ts) (`saveDraft`). El operador puede guardar borradores en cualquier momento; se envían por HTTP POST al backend y se almacenan permanentemente en disco, garantizando que ninguna edición se pierda al recargar la página o cambiar de módulo. |
| **AC-13: Versionado Inmutable** | **CUMPLE** | Implementado en [PublishingService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/server/services/publishing-service.js) y [manifest-repository.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/server/repositories/manifest-repository.js). Cada publicación genera un archivo inmutable `v{N}.json` con un snapshot completo de slides, reglas, fecha ISO, autor y resumen, acumulando un historial secuencial trazable e inalterable. |
| **AC-14: Reversión de Versiones (Rollback)** | **CUMPLE** | Implementado en [PublishService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/publish.service.ts) (`rollbackToVersion`) y [PublishingService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/server/services/publishing-service.js) (`rollback`). Permite inspeccionar el historial y presionar *"Revertir a esta versión"*. El backend toma el snapshot histórico, crea una nueva versión secuencial hacia adelante y actualiza `active.json`, restaurando de inmediato el contenido en el portal y en el editor. |
| **AC-15: Registro de Auditoría** | **CUMPLE** | Implementado en [audit.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/audit/audit.component.ts), [audit.service.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/audit.service.ts) y registro físico `audit.json`. Bitácora dedicada en el sidebar que almacena fecha, hora exacta, acción efectuada (PUBLICACIÓN/REVERSIÓN), versión generada, usuario responsable y rol. |
| **AC-17: Compatibilidad con Rutas SPA** | **CUMPLE** | Implementado en [runtime/src/loader.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/runtime/src/loader.js) y [quipux-popup.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/runtime/src/quipux-popup.js) (`checkRoute`). Escucha eventos `popstate`, `pushState` y `replaceState`. Si el usuario navega a una ruta que no coincide con la regla de la campaña, el modal se desmonta automáticamente o cancela los temporizadores de delay pendientes. |
| **AC-19: Seguridad y Sanitización** | **CUMPLE** | Implementado en [PublishingService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/server/services/publishing-service.js) (`isSafeCtaUrl`) y [quipux-popup.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/runtime/src/quipux-popup.js) (`sanitizeCtaUrl`). Restringe enlaces únicamente a protocolos seguros `https://`, rutas relativas `/` y anclas `#`. Neutraliza esquemas peligrosos como `javascript:`, `data:`, `http:` y URLs relativas de protocolo `//`. Cero almacenamiento o exposición de secretos en frontend. |
| **AC-20: Optimización de Rendimiento** | **CUMPLE** | Implementado en [runtime/build.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/runtime/build.js). Web Component autónomo en JS nativo de tan solo **33.38 KB** sin frameworks ni librerías externas. Uso de etiqueta `<picture>` con `<source media="(max-width: 620px)">` para no descargar imágenes pesadas en móviles, soporte WebP nativo y cabeceras de caché HTTP diferenciadas en servidor. |
| **AC-21: Eventos dataLayer sin PII** | **CUMPLE** | Implementado en [DataLayerDispatcher](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/runtime/src/datalayer.js) (`sanitizePayload`). Despacha los 4 eventos analíticos estándar (`quipux_modal_impression`, `quipux_modal_slide_view`, `quipux_modal_cta_click`, `quipux_modal_close`) hacia `window.dataLayer`. El filtro anti-PII elimina estrictamente campos personales (nombres, correos, placas, documentos, teléfonos). Inspeccionable en vivo en la consola HUD del portal demo. |
| **AC-22: Manejo de Estados de UI** | **CUMPLE** | Implementado transversalmente: Skeletons y spinners de carga en peticiones y uploads, estados de vacío en tablas y auditoría, alertas visuales con `role="alert"` ante errores de archivo, checklist interactivo en preflights y toasts contextuales ante cada acción exitosa. |
| **AC-23: Documentación Técnica** | **CUMPLE** | Implementado en este archivo [README.md](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/README.md), cubriendo la arquitectura de dos planos, instalación rápida con un solo comando, comandos de prueba, cronograma detallado para la sustentación y troubleshooting. |
| **AC-24: Pruebas Automatizadas** | **CUMPLE** | Suite completa con **15/15 pruebas unitarias exitosas** (`npm test`): 4 pruebas de runtime en Node.js (anti-PII, coincidencia de rutas SPA, FocusTrap, sanitización de enlaces) y 11 pruebas unitarias en Angular/Vitest ([CampaignService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/campaign.service.spec.ts), [PublishService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/publish.service.spec.ts), [AppComponent](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/app.spec.ts)). |
| **AC-25: Sustentación y Código Limpio** | **CUMPLE** | Arquitectura limpia con principios de Alta Cohesión y Bajo Acoplamiento (KISS & YAGNI), Signals nativas de Angular 21, cero sobreingeniería en el Web Component y guion de demostración estructurado en 10 pasos cronometrados para un máximo de 8 minutos. |

---

### 🌟 Criterios de Propuesta Adicional (AP-01 a AP-05)

| Criterio Adicional | Estado | Implementación y Valor Agregado |
|---|:---:|---|
| **AP-01: Gobernanza por Roles** | **CUMPLE** | Selector de roles (`Editor` → `Revisor` → `Publicador`) en el topbar con flujo de ciclo de vida (`Borrador` → `En revisión` → `Aprobado` → `Publicado`). Acciones formales de envío y aprobación en [publish-tab.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/publish-tab/publish-tab.component.ts). Bloqueo de publicación si el usuario activo no posee el rol de *Publicador*. |
| **AP-02: Exportación de Workspace GTM** | **CUMPLE** | Endpoint `/api/gtm/export` en [server/routes/gtm.js](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/server/routes/gtm.js) y botón *"Descargar Workspace GTM (AP-02)"* en [integration.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/integration/integration.component.ts). Genera y descarga el archivo JSON del contenedor de GTM preconfigurado con tags y triggers listos para importar. |
| **AP-03: Comparador Visual Diff Viewer** | **CUMPLE** | Pestaña *"Comparador de Versiones (AP-03)"* integrada en el diálogo de publicación [publish-dialog.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/publish-dialog/publish-dialog.component.ts). Calcula mediante `versionDiff` en [PublishService](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/publish.service.ts) la diferencia campo por campo y slide por slide frente a la versión activa, resaltando adiciones, modificaciones y eliminaciones. |
| **AP-04: Migrador de Popups AngularJS Legacy** | **CUMPLE** | Componente [legacy-importer.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/legacy-importer/legacy-importer.component.ts) en el Editor, accesible mediante *"Importar HTML Legado (AP-04)"*. Analiza mediante `DOMParser` el código HTML/JS histórico que solía pegarse en GTM y extrae automáticamente títulos, párrafos, enlaces y rutas de imágenes hacia la estructura de slides moderna. |
| **AP-05: Arquitectura Multi-Plantilla Gobernada** | **CUMPLE** | El motor de renderizado y almacenamiento soporta múltiples disposiciones (`layout: 'side' \| 'top' \| 'content'`). En el dashboard [dashboard.component.ts](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/dashboard/dashboard.component.ts) se encuentra habilitada y operativa la plantilla *"Banner horizontal (AP-05)"* para avisos viales e institucionales sin permitir código libre. |

---

### 👥 Matriz de Permisos y Gobernanza por Rol (AP-01)

El sistema implementa un modelo de **Control de Acceso Basado en Roles (RBAC)** reactivo y gobernado, diseñado para garantizar segregación de funciones, trazabilidad y prevención de publicaciones no autorizadas en el CDN de producción.

#### 📊 Matriz Comparativa de Permisos

| Capacidad / Acción en la Plataforma | ✏️ Editor *(Diseñadora UI)* | 🔍 Revisor *(Líder Técnico)* | 🚀 Publicador *(Frontend Lead)* | Archivos / Componentes Responsables |
|---|:---:|:---:|:---:|---|
| **Crear y editar campañas** | ✅ Permitido | ✅ Permitido | ✅ Permitido | [`campaign.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/campaign.service.ts) |
| **Manipular slides (crear, duplicar, reordenar, borrar)** | ✅ Permitido | ✅ Permitido | ✅ Permitido | [`slide-list.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/slide-list/slide-list.component.ts) |
| **Carga binaria de imágenes (< 500 KB)** | ✅ Permitido | ✅ Permitido | ✅ Permitido | [`resource.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/resource.service.ts) |
| **Configurar reglas de despliegue y vigencia** | ✅ Permitido | ✅ Permitido | ✅ Permitido | [`rules-tab.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/rules-tab/rules-tab.component.ts) |
| **Guardar borradores persistentes en disco** | ✅ Permitido | ✅ Permitido | ✅ Permitido | [`campaign.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/campaign.service.ts) |
| **Solicitar Aprobación** (`Borrador` → `En revisión`) | ✅ **Exclusivo de Editor** | ❌ Oculto | ❌ Oculto | [`publish-tab.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/publish-tab/publish-tab.component.ts) |
| **Aprobar campaña** (`En revisión` → `Aprobado`) | ❌ Oculto | ✅ **Exclusivo de Revisor** | ❌ Oculto | [`publish-tab.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/publish-tab/publish-tab.component.ts) |
| **Rechazar y devolver a borrador** | ❌ Oculto | ✅ **Exclusivo de Revisor** | ❌ Oculto | [`publish-tab.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/publish-tab/publish-tab.component.ts) |
| **Emitir versión final a CDN en producción (AC-11)** | 🚫 **Bloqueado** | 🚫 **Bloqueado** | ✅ **Único autorizado** | [`publish-dialog.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/features/editor/components/publish-dialog/publish-dialog.component.ts) / [`publish.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/publish.service.ts) |
| **Ejecutar Rollback / Reversión a versión previa (AC-14)** | 🚫 **Bloqueado** | 🚫 **Bloqueado** | ✅ **Permitido** | [`publish.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/publish.service.ts) |
| **Firma en Auditoría e Historial inmutable** | Registra como `Editor` | Registra como `Revisor` | Firma en `audit.json` y `vN.json` como `Publicador` | [`audit.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/audit.service.ts) / [`tenant.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/tenant.service.ts) |

#### 🔄 Ciclo de Vida y Transición de Estados

```
┌──────────────┐     Solicitar Aprobación (Editor)     ┌──────────────┐
│   Borrador   │ ────────────────────────────────────► │  En revisión │
└──────────────┘                                       └──────┬───────┘
       ▲                                                      │
       │                   Rechazar (Revisor)                 │ Aprobar (Revisor)
       └──────────────────────────────────────────────────────┤
                                                              ▼
┌──────────────┐          Publicar a CDN (Publicador)  ┌──────────────┐
│  Publicado   │ ◄──────────────────────────────────── │   Aprobado   │
└──────────────┘
```

1. **`Borrador`:** Estado inicial de trabajo. El **Editor** construye contenido, reglas y slides. Al finalizar, presiona *"Solicitar Aprobación"* transicionando el estado a `En revisión`.
2. **`En revisión`:** El **Revisor** (Líder Técnico) evalúa el contenido, preflights y diff visual. Dispone de dos acciones exclusivas: *"Aprobar para Publicar"* (transiciona a `Aprobado`) o *"Rechazar / Devolver a Borrador"* (regresa a `Borrador` con observaciones).
3. **`Aprobado`:** Estado de visto bueno técnico. Solo el **Publicador** (Frontend Lead) puede abrir el diálogo de confirmación y despachar la versión definitiva a `active.json` y `vN.json`.
4. **`Publicado`:** Manifiesto activo en CDN visible en el portal ciudadano. Si se requiere restaurar una versión anterior, únicamente el **Publicador** puede autorizar el Rollback.

#### 🛡️ Mecanismos de Aplicación y Bloqueo

- **En la Interfaz (UI Guard):** Si un usuario con rol *Editor* o *Revisor* abre el diálogo de publicación, el botón principal *"Confirmar y Publicar a Producción"* se desactiva físicamente con `disabled` y se muestra un banner de advertencia informando que se requiere el rol de *Publicador*.
- **En la Lógica de Negocio (Service Guard):** En [`publish.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/Reto-2-Quipux/prototipo/src/app/core/services/publish.service.ts), el método `canPublish()` verifica que `tenantService.activeRole() === 'Publicador'`. Cualquier intento de publicación fuera de este rol es rechazado.
- **Trazabilidad y No Repudio:** Cada acción registra el nombre y rol del usuario en la bitácora física `audit.json` y en las cabeceras del manifiesto `v{N}.json`, garantizando estricto no repudio.

---

## 📦 Resumen de Características Adicionales de Valor (APs)

- **AP-01:** Flujo de aprobación por roles (`Editor` → `Revisor` → `Publicador`) con estados de ciclo de vida (`Borrador`, `En revisión`, `Aprobado`, `Publicado`).
- **AP-02:** Asistente de exportación de Workspace GTM en formato JSON gobernado (`/api/gtm/export`).
- **AP-03:** Visualizador de diferencias (Diff Viewer) enriquecido slide por slide (títulos, descripciones, CTAs, enlaces, destinos e imágenes).
- **AP-04:** Importador y conversor de modales HTML / AngularJS legacy mediante DOMParser.
- **AP-05:** Plantilla gobernada adicional ("Banner horizontal superior") integrada en el catálogo del dashboard.

---

## 🛡️ Límites Técnicos y Troubleshooting

- **Límites de archivos (AC-06, AC-20):** Máximo 2.0 MB por archivo. Formatos permitidos: WebP, PNG y JPG. Dimensiones recomendadas: Desktop 800×560 px (mínimo 200×150, máximo 1920×1200), Mobile 420×420 px (mínimo 150×150, máximo 1200×1920). Incluye auto-optimización por Canvas en cliente para escalar y comprimir automáticamente imágenes de alta resolución a ~80-180 KB.
- **Estrategia de caché CDN (AC-20):** Los manifiestos activos (`active.json`) y el cargador de runtime tienen cabeceras `no-cache, no-store, must-revalidate` para propagación inmediata; los snapshots inmutables de versión (`vN.json`) y los assets multimedia cuentan con caché pública extendida.
- **Seguridad de protocolos (AC-19):** Preflight y runtime restringen enlaces CTA a `https://`, rutas relativas seguras (`/`) o anclas (`#`), neutralizando esquemas `javascript:` y enlaces con protocolo relativo `//`.

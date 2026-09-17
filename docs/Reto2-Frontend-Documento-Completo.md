# Reto #2 de Frontend — Documento Completo de Requisitos y Detalles

---

## 1. Contexto General

### 1.1 ¿Qué es el reto?
Es un **reto interno abierto y voluntario** dirigido al equipo de **Frontend** (y a cualquier persona interesada del equipo), con el objetivo de **mejorar el proceso de creación, modificación, actualización e implementación de popups/modales** que actualmente se gestionan mediante **Google Tag Manager (GTM)**.

El reto nace de un **"sentir"** del equipo (mencionado por Sebas) que se abordará en una reunión posterior ("mañana lo hablaremos").

### 1.2 Características del reto
- **No es obligatorio** ni exigido.
- Es una forma de **retarse**, **crear algo nuevo**, **cambiar un poco la mente**, **oxigenarla** y **ayudar a los procesos del equipo de Frontend**.
- Se puede participar **individualmente** o en equipo (se menciona que alguien "iba a apoyar" a otro).
- Se debe dar **prioridad a las actividades contractuales** de la empresa; el reto **no debe intervenir en las actividades diarias**.
- Se puede usar **tiempo personal** si el participante lo desea.

---

## 2. Situación Actual (Problemática)

### 2.1 Cómo funcionan hoy los popups/modales
- Los servicios digitales y los **impuestos** (ej. Impuesto Vehicular, módulo de Manizales / Valle / Medellín / Cali / Sabaneta) tienen **popups o modales**.
- Algunos tienen **más de un slide** (es el mismo popup, pero funciona como un **carrusel** donde se pasan diferentes imágenes).
- **No todas las imágenes tienen una acción.** Al hacer clic, algunas llevan a:
  - Un **módulo interno**, o
  - Una **URL pública** (redirección).
- Estos popups se **gestionan y construyen desde Google Tag Manager (GTM)**.

### 2.2 ¿Qué es Google Tag Manager en este contexto?
- Descrito como **"una cajita vacía"** presente en las plataformas transaccionales.
- En esa caja vacía se puede **implementar código HTML** y muchas otras etiquetas (para medir eventos en Analytics, etc.).
- Aprovechando esa caja vacía, se **crean los popups/modales literalmente con código HTML**.
- Se le meten **estilos propios** (se reconoce que "no es tan chévere", pero la necesidad lo obligó).
- Las **imágenes se suben a un CDN** para acceder a ellas fácilmente sin esperar a subir las fuentes del proyecto.
- El popup se **inyecta en el proyecto cuando el DOM está listo / se renderiza**: se activa el código y se inyecta en el portal.

### 2.3 Problema principal
- Hoy la modificación, actualización e implementación de estos popups **depende del equipo de Frontend**.
- Se quiere **eliminar esa dependencia**, permitiendo que una **diseñadora gráfica** o un **equipo de UI** pueda editar y publicar los popups sin depender de Frontend.

---

## 3. Objetivo del Reto

> **Objetivo principal:** Crear una solución (con interfaz o similar) que permita **llevar este popup / este código HTML** a un formato donde una **diseñadora gráfica o equipo de UI** pueda:
> 1. **Copiar y pegar** (no tan literal, pero que sea sencillo),
> 2. **Reemplazar la ruta de la imagen**,
> 3. **Publicarlo**,
> **sin depender del equipo de Frontend.**

### 3.1 Objetivo resumido (versión corta)
Crear algo o llevar este HTML que **permita la edición de ese popup por cada una de las operaciones** (no solo Valle, sino también Medellín, Cali, Sabaneta, etc.).

### 3.2 Necesidad de escalabilidad
- La tarea de edición de popups **se frecuenta más de lo que uno espera**, por eso se busca una solución con **interfaz** o algo similar.

---

## 4. Escenarios Técnicos y Compatibilidad

### 4.1 Frameworks a soportar
- **Angular 21** y **AngularJS** deben quedar cubiertos.
- Actualmente **ningún proyecto tiene modales en Angular 21**; los modales existentes están en **AngularJS**.
- Se busca una solución que funcione **mientras se migra el resto de ciudades a Angular 21**.
- Se plantea el futuro: la idea es llegar a migrar todo a Angular 21 (y posiblemente 22, 23, si el tiempo lo permite).

### 4.2 Debate sobre "una o dos soluciones"
- **Sebas** propone pensar en **una sola solución** para un solo framework, en lugar de mantener dos soluciones (lo cual sería "ambiguo").
- **Contraargumento (Angie):** actualmente los modales están en AngularJS y es lo que toma tiempo hoy.
- **Conclusión:** es parte del reto que **cada participante busque la solución más óptima, escalable y que sirva tanto en el presente como a futuro**.

### 4.3 Propuesta clave: Web Component (spoiler)
- **Idea propuesta por Sebas:** convertir esto en un **Web Component**, igual que el **plugin de accesibilidad** u otros web components existentes.
- Ventaja: **independiente del framework/tecnología** (AngularJS, Angular, React, cualquier parte) — **funciona igual**.
- Flujo propuesto:
  1. Desde una **interfaz** (lo que se cree) se **publica un JS en el CDN**.
  2. A partir de ese **JS** se construye el popup (así como se construyó en un front).
- Debe hacerse en **JavaScript vanilla / nativo** para que corra en cualquier entorno.
- Se pensó incluso en **integrarlo con Tag Manager** (no se llegó a definir si es posible o no).
- **Aclaración:** la decisión de cómo implementarlo es de cada participante; es parte del reto.

---

## 5. Entregables y Criterios de Aceptación

### 5.1 Prototipo / Base de Maquetación de Referencia

> **⚠️ IMPORTANTE — La carpeta `prototipo/` es la BASE DE MAQUETACIÓN obligatoria:**
> La propuesta toma como punto de partida la aplicación contenida en la carpeta **`prototipo/`** (**Quipux Popup Studio**, desarrollada en **Angular 21**).
> 
> Sin embargo, se establece formalmente que:
> 1. **SOLO SE TOMA COMO BASE LA MAQUETACIÓN VISUAL:** la arquitectura de vistas, el layout responsive, el sistema de componentes visuales (sidebar, topbar, formularios, tarjetas, tablas, previsualizador) y los tokens de diseño de la paleta oficial **Quipux 2026**.
> 2. **FALTA LA IMPLEMENTACIÓN DE FUNCIONALIDADES Y REACTIVIDAD:** la aplicación en `prototipo/` es actualmente una **maqueta interactiva con fines demostrativos**. Carece de lógica de negocio real, persistencia, validaciones de entrada, reactividad integral de estados, y conexión con un entorno de almacenamiento o runtime ejecutable.
> 3. **TIENE MÚLTIPLES ELEMENTOS HARDCODEADOS / SIMULADOS:** gran cantidad de datos, métricas, estructuras de carpetas, previsualizaciones base64, historiales de versión y verificaciones están cableados en duro en el código TypeScript y plantillas HTML.
> 4. **OBJETIVO DEL RETO SOBRE LA BASE:** sustituir cada uno de los elementos simulados o hardcodeados por **comportamientos dinámicos, reactivos y verificables** que cumplan rigurosamente con los Criterios de Aceptación (AC) del reto.

- Se cuenta con el proyecto en la carpeta **`prototipo/`** como base de maquetación visual.
- **NO debe quedar tal cual en su lógica**: es una base de diseño y layout para no empezar desde cero en lo visual, pero su comportamiento debe pasar de "demo estática simulada" a "solución dinámica y funcional".
- El reto exige además construir o integrar el **plano de ejecución (Web Component / Runtime autónomo en JS vanilla)** que consuma los datos publicados por la interfaz y se monte en el portal o simulador externo sin tocar GTM en cada campaña.

> **📎 Base local del proyecto:**
> - **Ubicación:** Carpeta [`prototipo/`](../prototipo/) del repositorio.
> - **Tecnología base:** **Angular 21** (`@angular/core: ^21.2.0`, Angular CLI 21.2.24), componentes standalone, Signals y Lucide Icons.
> - **Assets de marca:** Carpeta [`prototipo/brand/`](../prototipo/brand/) y [`prototipo/public/`](../prototipo/public/).
> - **Cómo ejecutar el entorno local de maquetación:**
>   ```bash
>   cd prototipo
>   npm install
>   npm start    # Levanta el servidor en http://localhost:4200/
>   ```

#### 5.1.1 Elementos de maquetación y diseño heredados del prototipo (a conservar)

La solución debe **conservar la estructura visual y de experiencia de usuario** ya maquetada en el prototipo:

**a) Arquitectura de Vistas y Layout General**
- **Sidebar de navegación global:** accesos a `Componentes`, `Recursos CDN`, `Integración GTM` y sección de `Auditoría`.
- **Topbar global:** indicador contextual de portal activo con selector dinámico de **tenant**, y accesos a notificaciones/perfil.
- **Vista "Componentes" (Dashboard):** cabecera con botón de acción "Nuevo componente", cuadrícula de métricas de resumen, catálogo de plantillas preconfiguradas y tabla de campañas/modales con buscador.
- **Vista "Recursos CDN":** visualizador de ruta raíz CDN por tenant, cuadrícula de carpetas del storage, visualizador jerárquico tipo árbol y tabla de assets con detalles técnicos.
- **Vista "Integración GTM":** diagrama de arquitectura de dos planos (Control Plane vs Data Plane), snippet de instalación del loader idempotente, flujo de gobierno y directrices técnicas.
- **Vista "Editor" (Layout de 3 columnas):**
  - Columna 1: Pestañas de navegación de configuración (`Contenido`, `Diseño`, `Audiencia y reglas`, `Versiones`).
  - Columna 2: Panel de edición contextual (lista de slides, campos del slide seleccionado, toggles de reglas, selector de paleta, historial de versiones).
  - Columna 3: Panel de vista previa en vivo (Canvas con mock del portal, switcher de dispositivo Desktop/Mobile, renderizado del modal, navegación de slides y botón de cierre).
- **Modales y Diálogos:** Diálogo de confirmación de publicación (*Preflight checks* y resumen de destino) y sistema de notificaciones contextuales (*Toast*).

**b) Sistema de Diseño e Identidad Quipux 2026**
- Paleta oficial Quipux: Tinta nocturna (`#211C33`), Azul intenso (`#2E13F5`), Cian claro (`#61C7D0`), Verde menta (`#5DC99A`).
- Tipografía institucional, micro-tokens de estado (badges, botones con estados hover/focus/active, bordes, sombras y espaciados).
- Comportamiento responsive maquetado para breakpoints en 1180px, 900px y 620px, y compatibilidad con `prefers-reduced-motion`.

---

#### 5.1.2 Lista de Elementos Hardcodeados en el Prototipo → Comportamiento Dinámico Requerido

A continuación se detalla el análisis exhaustivo de todos los elementos, datos y flujos que actualmente se encuentran **hardcodeados o simulados** en los componentes y servicios de `prototipo/src/app/`, y que **deben ser implementados de forma dinámica y reactiva** para el reto:

| Módulo / Archivo en `prototipo/` | Elemento Hardcodeado / Simulado Actual | Comportamiento Actual en la Maqueta | Comportamiento Dinámico y Reactivo Requerido para el Reto | Criterio AC Relacionado |
|---|---|---|---|:---:|
| **Dashboard**<br>[`dashboard.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/dashboard/dashboard.component.ts) | **Métricas de resumen** (`summary-grid`) | Valores estáticos en HTML: "Activos hoy: 2", "CDN Storage: 16.8 MB", "Versión activa: v12 (ID: modal-cobro-2026)". | Deben calcularse reactivamente: conteo real de campañas activas según vigencia/estado, suma de peso en KB/MB de assets reales del tenant y versión actualmente publicada en el portal. | **AC-01, AC-02, AC-22** |
| **Dashboard**<br>[`dashboard.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/dashboard/dashboard.component.ts) | **Catálogo de plantillas** | Botones de "Banner horizontal" y "Alerta vial" marcados fijos como `disabled` ("Próximo"). | Aunque el foco obligatorio es Modal/Slider, la arquitectura debe permitir seleccionar y crear instancias basadas en plantillas gobernadas sin romper el flujo. | **AP-05** |
| **Dashboard & Core**<br>[`campaign.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/core/services/campaign.service.ts) | **Persistencia de campañas** | Array estático de 3 campañas (`camp-1`, `camp-2`, `camp-3`) en una señal en memoria. Al refrescar (`F5`) se pierde cualquier cambio o nueva campaña creada. | Implementar persistencia real (LocalStorage, IndexedDB o backend/API/Firebase). Debe guardar, recuperar, actualizar y filtrar campañas por tenant sin pérdida de datos. | **AC-01, AC-10** |
| **Topbar & Tenant**<br>[`topbar.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/layout/topbar/topbar.component.ts)<br>[`tenant.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/core/services/tenant.service.ts) | **Aislamiento Multitenant** | El `<select>` cambia el string `activeTenantId`, pero no filtra las campañas en el dashboard ni aísla los archivos o versiones de cada cliente. | El cambio de tenant debe ser reactivo y estricto: aislar completamente las campañas, manifiestos y recursos para que un tenant jamás acceda o sobrescriba datos de otro. | **AC-02** |
| **Editor: Slides**<br>[`slide-form.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/editor/components/slide-form/slide-form.component.ts)<br>[`resource.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/core/services/resource.service.ts) | **Carga de imágenes (Desktop / Mobile)** | `simulateImageUpload()` lee el archivo con `FileReader` y genera un dataUrl en base64 local. No sube a ningún CDN ni storage. Nombres de archivo fijos (`cobro-coactivo-desktop.webp`). | Carga real del archivo binario a la ruta multitenant (`resources/tenants/{tenant}/...`). Generación de URL pública/absoluta o ruta relativa al CDN. Nombres normalizados y trazables. | **AC-05, AC-20** |
| **Editor: Slides**<br>[`slide-form.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/editor/components/slide-form/slide-form.component.ts) | **Validación de archivos multimedia** | Se acepta cualquier imagen sin validar peso, dimensiones ni tipo MIME. No hay feedback de error. | Validación previa obligatoria: peso máximo (ej. < 500 KB), formatos autorizados (WebP, PNG, JPG), dimensiones recomendadas (800×560 desktop, 420×420 móvil) y nombres sin caracteres ilegales. Alerta visual en caso de error. | **AC-06, AC-22** |
| **Editor: Slides**<br>[`slide-list.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/editor/components/slide-list/slide-list.component.ts) | **Reordenamiento de slides** | El ícono `grip-vertical` es decorativo. No existe evento de drag-and-drop ni botones de desplazamiento para alterar el orden. | Reordenamiento interactivo y reactivo (drag & drop con CDK o botones Subir/Bajar) que actualice inmediatamente la secuencia en el estado, en el previsualizador y en el manifiesto final. | **AC-03** |
| **Editor: Slides**<br>[`slide-list.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/editor/components/slide-list/slide-list.component.ts) | **Duplicación y visibilidad de slides** | No existen opciones para duplicar un slide existente ni para ocultarlo/desactivarlo temporalmente sin tener que borrarlo. | Acciones reactivas para clonar un slide completo (con sus textos e imágenes) y switch de activación para excluir slides del carrusel sin eliminarlos del catálogo. | **AC-03** |
| **Editor: Reglas**<br>[`rules-tab.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/editor/components/rules-tab/rules-tab.component.ts) | **Vigencia temporal (Fechas y horas)** | No existen campos en la interfaz para ingresar fecha/hora de inicio y fecha/hora de vencimiento del popup. | Formulario reactivo con selectores de fecha/hora de inicio y expiración de la campaña, con validación de rango coherente y evaluación automática en runtime para no mostrar modales vencidos. | **AC-09** |
| **Editor: Reglas**<br>[`rules-tab.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/editor/components/rules-tab/rules-tab.component.ts) | **Reglas de ruta y frecuencia** | Inputs de retardo, frecuencia y patrón de ruta solo guardan valores en memoria; no se evalúan ni aplican a un entorno real. | Las reglas deben incluirse en el `manifest.json` y ser interpretadas en runtime: retardo con `setTimeout`, frecuencia con `sessionStorage`/`localStorage`, y coincidencia de ruta SPA mediante escuchas al historial de navegación (`popstate`/`pushState`). | **AC-09, AC-17** |
| **Editor: Previsualización**<br>[`preview-canvas.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/editor/components/preview-canvas/preview-canvas.component.ts) | **Simulador del portal y autoplay** | Mock estático de líneas grises (`portal-mock`). El toggle de autoplay en reglas no produce un carrusel con temporizador automático real en el canvas. | Previsualización fiel y dinámica: autoplay temporizado (con pausa en hover/focus), transición suave de slides, y representación reactiva de los textos y fotos editadas al instante. | **AC-07, AC-18** |
| **Editor: Previsualización**<br>[`preview-canvas.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/editor/components/preview-canvas/preview-canvas.component.ts) | **Accesibilidad y tecla ESC** | El botón de cerrar solo dispara un toast. No hay captura de foco (*focus trap*), ni escucha de la tecla `Esc`, ni restauración de foco. | Implementar accesibilidad real: trampa de foco dentro del modal, cierre reactivo con tecla `Esc`, atributos ARIA dinámicos (`aria-hidden` en fondo) y respeto a `prefers-reduced-motion`. | **AC-18** |
| **Editor: Publicación**<br>[`publish.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/core/services/publish.service.ts)<br>[`publish-dialog.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/editor/components/publish-dialog/publish-dialog.component.ts) | **Confirmación de publicación y preflight** | `confirmPublish()` usa un `setTimeout` de 900 ms, incrementa un número falso (`v13`) y muestra un toast. Los *preflight checks* son estáticos (`passed: true` fijo). | Validación preflight dinámica (revisa que todas las URLs tengan HTTPS, que existan imágenes cargadas y reglas válidas). Publicación real que guarde el manifiesto JSON inmutable en el repositorio/CDN del tenant. | **AC-06, AC-11, AC-13** |
| **Editor: Versiones**<br>[`publish-tab.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/editor/components/publish-tab/publish-tab.component.ts)<br>[`publish.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/core/services/publish.service.ts) | **Historial de versiones y Rollback** | Lista estática de versiones (`v12`, `v11`, `v10`) con datos fijos ("Carlos Mario R.", "Ana María G."). Al presionar "Revertir" solo cambia un texto y lanza un toast sin restaurar los datos reales de la campaña. | Registro histórico inmutable de versiones reales (guardando el payload completo de cada publicación). El botón "Revertir" debe restaurar el contenido, slides y reglas del snapshot seleccionado y publicar la versión reactivada. | **AC-13, AC-14, AC-15** |
| **Recursos CDN**<br>[`resources.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/resources/resources.component.ts)<br>[`resource.service.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/core/services/resource.service.ts) | **Estructura y assets de almacenamiento** | Carpetas (`components/modal/`, `brand/assets/`, etc.), árbol de directorios y lista de assets (`cobro-coactivo-desktop.webp`, etc.) hardcodeados en arrays fijos. El botón "Cargar recurso" solo emite un toast. | Explorador reactivo de recursos: debe reflejar los archivos verdaderamente cargados por el tenant, sus dimensiones, pesos reales, URLs y permitir copiar rutas válidas o cargar recursos independientes. | **AC-05, AC-20** |
| **Integración GTM**<br>[`integration.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/features/integration/integration.component.ts) | **Verificación del cargador y pruebas** | Indicador visual "Cargador verificado en GTM" con píldora verde fija. No hay conexión ni comprobación con un portal de pruebas externo. | Verificación interactiva del estado del loader. Enlace o embebido de un portal o simulador externo donde se demuestre la carga del modal vía script de GTM sin tocar el contenedor en cada cambio. | **AC-12, AC-16** |
| **Sidebar & Auditoría**<br>[`sidebar.component.ts`](file:///c:/Users/Rapture/Desktop/Reto%20quipux/prototipo/src/app/layout/sidebar/sidebar.component.ts) | **Datos de usuario y sesión** | Usuario estático en el sidebar: "Carlos Rodríguez · Frontend Lead (CR)". El ítem de navegación "Auditoría" está deshabilitado como "Próximo". | Identificación del usuario activo que realiza las ediciones y publicaciones para alimentar el registro de auditoría exigido (nombre, correo/rol, fecha, hora y acción realizada). | **AC-15** |
| **Runtime de Ejecución**<br>*(Ausente en `prototipo/`)* | **Web Component / Cargador ejecutable** | La carpeta `prototipo/` contiene únicamente la interfaz de administración en Angular. No incluye el script que corre en el cliente final. | Construcción del componente de ejecución (Web Component en JS vanilla o cargador autónomo) que se inyecta vía GTM en el portal externo, consulta el manifiesto activo y renderiza el modal con Shadow DOM, eventos dataLayer e idempotencia. | **AC-12, AC-16, AC-17, AC-21** |

> **⚠️ Regla de Oro de Evaluación:**
> Una función que en la demostración del reto **solo cambie un texto estático, active un `setTimeout`, muestre un toast o dependa de datos cableados en duro en el código** se calificará como **NO CUMPLE**. 
> La evaluación exige comprobar el efecto real:
> - El archivo subido debe existir y ser descargable desde una URL de recurso real.
> - La campaña publicada debe actualizar un manifiesto consultable externamente.
> - El portal de prueba externo debe cargar el popup automáticamente sin editar la etiqueta en GTM.
> - La reversión debe restaurar íntegramente los textos e imágenes del release previo.

#### 🎨 Paleta de colores Quipux 2026 (usada en el prototipo)

El prototipo utiliza la paleta oficial **Quipux 2026**. Se recomienda respetarla para mantener la identidad visual de la marca en cualquier propuesta:

| Color | Hex | Uso principal en el prototipo |
|-------|-----|-------------------------------|
| 🟣 **Tinta nocturna** | `#211C33` | Fondo del sidebar, textos de títulos, overlays y bloques de código. |
| 🔵 **Azul intenso** | `#2E13F5` | Color de acento principal, botones primarios, enlaces y estados activos. |
| 🩵 **Cian claro** | `#61C7D0` | Acentos secundarios, íconos del sidebar, gradientes y detalles decorativos. |
| 🟢 **Verde menta** | `#5DC99A` | Estados de éxito, indicadores "publicado" y confirmaciones. |

```css
:root {
  --quipux-ink:    #211C33; /* Tinta nocturna */
  --quipux-blue:   #2E13F5; /* Azul intenso    */
  --quipux-sky:    #61C7D0; /* Cian claro      */
  --quipux-green:  #5DC99A; /* Verde menta     */
}
```

> **Nota:** los criterios de aceptación **AC-08** exigen mantener la identidad visual Quipux y no deformar ni alterar el logo, por lo que esta paleta es la referencia recomendada.

### 5.2 Criterios de calificación
- Que **cumpla con los criterios de aceptación**.
- Que **esté funcional**.
- **Se puede usar IA** (no hay problema con eso; "si es con IA mejor, así vamos adquiriendo más cosas con IA").
- **Explicación / socialización:** el participante debe ser capaz de **explicar cómo se construyó, cómo funciona, qué hace**, etc. No basta con mirar el código: **hay que saber explicar lo que se hizo**.

### 5.3 Restricciones de tecnología
- **No hay restricción de tecnología.** Cada uno lo maneja como quiera.
- Se sugiere usar lo que el equipo ya maneja (Angular, AngularJS, etc.), pero no es obligatorio.


---

## 8. Recursos Brindados / Accesos

- **Acceso a Google Tag Manager** para pruebas (Sebas lo brindará).
- **Una URL** de pruebas donde se puede entrar a probar.
- **Landing / prototipo de referencia** (compartido por enlace).
- **Formulario de inscripción** (español y portugués).
- **Enlace del reto** compartido por el organizador.
- Apoyo de **IA** permitido y recomendado.

---

## 9. Preguntas y Dudas Resueltas (Reunión de Reglas)

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cómo puedo hacer pruebas con Google Tag Manager? ¿Puedo crear uno? | Se brindará **acceso a GTM** y una **URL de pruebas**. |
| ¿Puede ser en cualquier lenguaje o con lo que ya tenemos (Angular)? | **No hay restricción de tecnología**; se sugiere usar lo que el equipo maneja. |
| ¿Se debe tener en cuenta AngularJS y Angular 21? | Sí, ambos deben considerarse. |
| ¿Cuánto es el aporte? | **20.000 COP** por persona (≈32,58 reales). |
| ¿Cuándo inicia y cuánto dura? | Lunes **7 de septiembre**, **20 días** (hasta el **2 de octubre** originalmente, ajustado a entrega el **30**). |
| ¿Cuándo se entrega y cuándo se anuncia el ganador? | Entrega/socialización el **30 de septiembre**; ganador el **viernes** siguiente. |
| ¿Todos tienen el dinero para darlo ya? | Algunos lo darán el **30**; los de Brasil vía **PIX** (requiere CPF y cuenta bancaria de Brasil). |

---

## 10. Resumen de Decisiones Finales

1. **Reto voluntario** para mejorar la gestión de popups/modales vía GTM, eliminando la dependencia de Frontend.
2. **La carpeta `prototipo/` es la base de maquetación:** Se adopta la aplicación maquetada en Angular 21 (`prototipo/`) como punto de partida visual, respetando su arquitectura de vistas, diseño institucional Quipux 2026 y flujo de interacción (ver sección 5.1.1).
3. **Implementación obligatoria de funcionalidad y reactividad:** Toda la lógica de negocio, reactividad de estados, persistencia, validaciones y aislamiento multitenant debe construirse para reemplazar los elementos hardcodeados y simulaciones actuales (ver tabla en sección 5.1.2). Una función que solo cambie texto o muestre un aviso sin efecto real **NO CUMPLE**.
4. **Solución propuesta:** Web Component en JS vanilla, publicable como JS en CDN, editable desde una interfaz, compatible con cualquier framework.
5. **Compatibilidad:** AngularJS y Angular 21.
6. **Libertad de tecnología** y **uso de IA permitido**.
---

# Reto #2 de Frontend — Quipux Popup Studio

> **Fuente:** Página oficial del reto
> https://qloudsi.com/servicios/canales-digitales/frontend/reto-frontend-gtm/reto-2-frontend.html
>
> **Título de la página:** Quipux Popup Studio
> **Categoría:** Reto Frontend · 2026
> **Nota:** Este documento consolida **toda** la información publicada en la página, sin omitir detalles.

---

## Encabezado / Hero

**Reto Frontend · 2026**

### Quipux Popup Studio

Reto voluntario para el equipo de **Desarrollo Frontend**: diseñar y construir una herramienta amigable para **crear, editar, previsualizar y publicar popups o modales con sliders sin tocar código**, conservando la línea gráfica de Quipux, administrando imágenes en el **CDN multitenant** y reflejando las publicaciones en un **portal de prueba** desde la misma interfaz.


Enlace adicional: **Prototipo de referencia ↗** → https://qloudsi.com/servicios/canales-digitales/frontend/reto-frontend-gtm/prototipo/index.html

---

## 01 · Propósito y necesidad

Hoy la creación o modificación de estos popups exige intervenir **HTML, CSS, JavaScript, rutas de imágenes y etiquetas de Google Tag Manager**. Esto vuelve el proceso **lento, dependiente del conocimiento técnico y propenso a errores**. El reto busca demostrar que el equipo puede convertir esta necesidad real en una **experiencia visual, gobernada y reutilizable**.

**Resultado esperado:**
Una persona autorizada debe poder **editar el contenido de un popup o modal, previsualizarlo y publicarlo desde la misma herramienta**. La publicación **no debe exigir editar manualmente la etiqueta de GTM** en cada campaña.

---

## 05 · Libertad de propuesta

Cada participante puede proponer **arquitectura, stack, componentes y experiencia de usuario** internos. Sin embargo, **el prototipo compartido es la base de referencia obligatoria**: la propuesta debe **respetar su estructura, su diseño y su conjunto de funciones**, y llevar cada función **simulada o hardcodeada** a un estado **real y verificable**.

**Qué significa "usar el prototipo como base":**
- **Estructura:** conservar la arquitectura de vistas y el flujo de trabajo (biblioteca de componentes → editor → vista previa → publicación → versiones), el sidebar, el topbar con selector de tenant y el layout del editor de tres columnas.
- **Diseño:** mantener la identidad visual Quipux 2026, los componentes de UI, los estados (badges, toasts, diálogos) y el comportamiento responsive.
- **Funciones:** todas las funciones que el prototipo *muestra* deben quedar **operativas de verdad**. Las funciones que hoy solo cambian texto, muestran un aviso o dependen de datos fijos **no cumplen** los criterios de aceptación.

> El prototipo **no se copia tal cual** (no es una solución cerrada), pero **tampoco se acepta una propuesta que se desvíe de su estructura, diseño o conjunto de funciones**. La propuesta será válida si respeta las restricciones del reto, mantiene la **identidad de Quipux** y demuestra **de extremo a extremo la edición y publicación** con funciones reales.

> **📎 Prototipo local de referencia:** [`prototipo/index.html`](../prototipo/index.html) — aplicación *standalone* en HTML/CSS/JS vanilla. Se abre directamente en el navegador (no requiere servidor). Assets de marca en [`prototipo/brand/`](../prototipo/brand/).

---

## 06 · Definición de alcance

### 6.1 · Alcance obligatorio

- Aplicación administrativa con una **interfaz clara** para crear y editar instancias de popup o modal.
- Soporte para un **modal informativo** y su variante con **slider o carrusel**.
- Campos editables para **títulos, textos, llamados a la acción, enlaces, texto alternativo e imágenes responsive**.
- **Selección de tenant y portal**, con aislamiento de configuraciones y recursos.
- **Carga segura de imágenes** hacia la estructura multitenant `cdn.quipux.com/resources/tenants/`. *(Solicitar acceso o simular un S3 con MinIO)*
- **Vista previa** en escritorio y móvil antes de publicar.
- **Reglas de aparición** por ruta, fechas, retardo y frecuencia. *(Opcional)*
- **Flujo de borrador, confirmación, publicación y reversión.** *(Opcional)*
- **Publicación desde la interfaz** hacia un entorno verificable, sin editar GTM manualmente en cada campaña.
- **Accesibilidad del modal**, validaciones, manejo de errores y **eventos en dataLayer sin datos personales**.

### 6.2 · Publicar desde la interfaz: qué significa

1. El editor **guarda el popup como borrador**.
2. La herramienta **valida** contenido, enlaces, recursos y reglas.
3. El participante **revisa la vista previa** y confirma la publicación.
4. El sistema **publica una configuración versionada** y sus recursos en el espacio correcto del tenant.
5. El **portal de prueba** obtiene la versión activa mediante un **cargador estable** instalado previamente en GTM.
6. La nueva versión **se visualiza sin copiar o pegar código manualmente**.
7. Una **versión anterior puede restaurarse** desde la misma herramienta.

> **Criterio esencial:** No se considera publicación mostrar el modal únicamente dentro del editor ni generar un bloque de código para que otra persona lo copie. El cambio debe reflejarse en un **portal o simulador externo verificable**.

### 6.3 · Fuera de alcance

- Constructor universal o editor libre de HTML, CSS y JavaScript.
- Ejecución de código arbitrario proporcionado por el usuario.
- Formularios que capturen datos personales, pagos o decisiones transaccionales críticas.
- Gestión completa de banners, alertas, tooltips, encuestas u otros componentes diferentes al popup/modal.
- Segmentación avanzada, pruebas A/B, traducciones o analítica ejecutiva.
- Publicación directa sobre portales productivos durante el reto.

---

## 07 · Criterios de aceptación

> Cada criterio se calificará como **CUMPLE** o **NO CUMPLE** según la evidencia presentada durante la demo. Un criterio **parcial, no demostrable o que solo exista en el diseño** se calificará como **NO CUMPLE**. Los criterios marcados como **críticos** deben cumplirse para que una solución sea elegible como ganadora.

| ID | Criterio verificable | Crítico |
|----|----------------------|:-------:|
| **AC-01** | Permite crear, abrir y editar una campaña de popup desde la interfaz sin modificar código. | **Sí** |
| **AC-02** | Permite seleccionar tenant y portal sin mezclar configuraciones ni recursos. | — |
| **AC-03** | Permite agregar, editar, duplicar, eliminar, activar y reordenar slides. | — |
| **AC-04** | Cada slide admite título, texto, CTA, enlace, destino, texto alternativo e imágenes. | — |
| **AC-05** | Carga imágenes desktop y mobile desde la interfaz hacia una ruta multitenant verificable. | **Sí** |
| **AC-06** | Valida formato, peso, dimensiones y nombre del archivo, y muestra errores comprensibles. | — |
| **AC-07** | Muestra una vista previa funcional en escritorio y móvil con los datos actuales. | **Sí** |
| **AC-08** | Mantiene la identidad visual Quipux y no deforma ni altera el logo. | — |
| **AC-09** | Configura rutas, vigencia, retardo y frecuencia de aparición. | — |
| **AC-10** | Guarda borradores y permite reabrirlos sin perder información. | — |
| **AC-11** | Publica desde la misma interfaz mediante una acción explícita y confirmada. | **Sí** |
| **AC-12** | La publicación se refleja en un portal o simulador externo sin edición manual de GTM. | **Sí** |
| **AC-13** | Cada publicación genera una versión identificable y conserva la versión anterior. | — |
| **AC-14** | Permite revertir desde la interfaz a una versión publicada previamente. | — |
| **AC-15** | Registra al menos usuario, fecha, acción y versión publicada. | — |
| **AC-16** | El cargador es idempotente: ejecuciones repetidas no duplican modal, estilos o listeners. | **Sí** |
| **AC-17** | Responde a cambios de ruta en una SPA y desmonta o actualiza el popup correctamente. | — |
| **AC-18** | El modal gestiona foco, teclado, tecla Esc, ARIA y reducción de movimiento. | **Sí** |
| **AC-19** | Sanitiza textos y URLs, restringe protocolos y no expone secretos en el frontend. | — |
| **AC-20** | Optimiza la carga de imágenes y evita dependencias desproporcionadas para el caso. | — |
| **AC-21** | Envía eventos de apertura, vista, clic y cierre a dataLayer sin datos personales. | — |
| **AC-22** | Presenta estados de carga, vacío, error, validación y éxito. | — |
| **AC-23** | Incluye README con ejecución, arquitectura, decisiones, límites y pasos de publicación. | — |
| **AC-24** | Incluye pruebas automatizadas relevantes y demuestra el flujo principal. | — |
| **AC-25** | El participante explica el código y realiza un cambio pequeño solicitado durante la demo. | — |

---

## 08 · Criterios adicionales por propuesta

> Las siguientes mejoras son **opcionales**, pero también **suman al conteo total** si funcionan y se demuestran. Permiten que cada participante aporte una mirada propia sin ampliar el núcleo obligatorio.

| ID | Mejora propuesta |
|----|------------------|
| **AP-01** | Incluye flujo editor → revisor → publicación con permisos diferenciados. |
| **AP-02** | Instala o actualiza el cargador inicial mediante un workspace controlado de GTM. |
| **AP-03** | Compara versiones y explica claramente qué cambió antes de publicar. |
| **AP-04** | Importa o transforma información útil del modal heredado entregado como referencia. |
| **AP-05** | Demuestra que la arquitectura puede incorporar otra plantilla gobernada sin aceptar código libre. |

---

## 09 · Cómo se determina el ganador

1. Primero se valida que la solución **cumpla todos los criterios críticos**.
2. Entre las soluciones elegibles, gana quien tenga la **mayor cantidad total de criterios AC y AP en estado CUMPLE**.
3. Cada criterio vale **una unidad**. **No existen medios puntos**.
4. En caso de **empate**, gana quien cumpla **más criterios AP**.
5. Si continúa el empate, el jurado solicitará la **misma modificación en vivo** y elegirá la solución que la implemente correctamente en **menor tiempo**, sin romper el flujo existente.
6. Si **ninguna solución cumple los criterios críticos**, **no se declara ganador** y los aportes son devueltos.

---

## 10 · Entregables

- Repositorio accesible con el **código fuente**.
- **README** con instalación, ejecución, arquitectura y decisiones.
- Aplicación funcional con **al menos dos tenants de prueba**.
- **Campaña de ejemplo** con mínimo **tres slides**.
- **Portal o simulador externo** donde se compruebe la publicación.
- **Pruebas automatizadas** y evidencia de su ejecución.
- Datos y credenciales **únicamente de prueba**; nunca secretos productivos.
- **Demo de máximo 8 minutos**.

---

## 11 · Prueba común de la demo

1. Abrir una campaña existente y **modificar su contenido**.
2. **Agregar un slide** y reorganizar el carrusel.
3. Intentar cargar un **recurso inválido** y luego uno **válido**.
4. **Cambiar de tenant** y verificar el aislamiento de rutas.
5. Configurar **vigencia, frecuencia y una ruta de la SPA**.
6. **Previsualizar** en escritorio y móvil.
7. **Publicar** desde la interfaz y comprobar el resultado en el **portal externo**.
8. Ejecutar **dos veces el cargador** y demostrar que **no hay duplicados**.
9. **Revertir** a la versión anterior.
10. Mostrar **eventos en dataLayer** y responder preguntas técnicas.

---

## 12 · Condiciones finales

- El **prototipo compartido** representa el flujo y la necesidad; **no es una solución obligatoria para copiar**.
- Los **recursos de marca** y el **código base** se entregarán a todos bajo las **mismas condiciones**.
- Las **dudas funcionales** respondidas durante el reto se **compartirán con todos los participantes**.
- **No se permite** usar credenciales productivas, datos personales ni publicar en portales reales.
- El **jurado podrá revisar el repositorio** y solicitar **evidencia adicional** de cualquier criterio marcado como cumplido.

---

## Idea central

> El reto **no consiste únicamente en crear un modal bonito**. Consiste en **construir un proceso confiable para editarlo y publicarlo desde una interfaz amigable**, manteniendo el **control técnico**, la **marca Quipux** y la **compatibilidad con los portales** donde deberá funcionar.

---


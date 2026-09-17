(()=>{var v=Object.defineProperty;var b=(r,n,e)=>n in r?v(r,n,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[n]=e;var o=(r,n,e)=>b(r,typeof n!="symbol"?n+"":n,e);var m=class extends HTMLElement{constructor(){super();o(this,"shadow");o(this,"manifest",null);o(this,"currentSlideIndex",0);o(this,"activeSlides",[]);o(this,"isVisible",!1);o(this,"autoplayTimer",null);o(this,"previousActiveElement",null);o(this,"openTimestamp",0);o(this,"boundKeyHandler",null);this.shadow=this.attachShadow({mode:"open"})}static get observedAttributes(){return["tenant","campaign","manifest-url"]}attributeChangedCallback(e,t,i){t!==i&&this.isConnected&&this.init()}connectedCallback(){this.init()}disconnectedCallback(){this.stopAutoplay(),this.removeEventListeners()}async init(){let e=this.getAttribute("tenant")||"valle",t=this.getAttribute("campaign")||"modal-cobro-2026",a=this.getAttribute("manifest-url")||`http://localhost:3000/resources/tenants/${e}/manifests/${t}/active.json`;try{let s=await fetch(a,{cache:"no-cache"});if(!s.ok){console.warn(`[Quipux Runtime] No se pudo obtener el manifiesto activo desde: ${a} (${s.status})`);return}this.manifest=await s.json(),this.evaluateAndMount()}catch(s){console.error("[Quipux Runtime] Error cargando manifiesto:",s)}}evaluateAndMount(){if(!this.manifest)return;if(this.manifest.status==="Inactivo"||rules?.enabled===!1){console.info(`[Quipux Runtime] La campa\xF1a "${this.manifest.name}" est\xE1 desactivada / inactiva temporalmente.`),this.closeModal("campaign_inactive",!1);return}if(this.activeSlides=(this.manifest.slides||[]).filter(s=>s.active!==!1),this.activeSlides.length===0)return;let e=window.location.pathname;if(!this.matchesRoute(e,rules.pathRule)){this.closeModal("route_mismatch",!1);return}let t=new Date;if(rules.startDate){let s=new Date(rules.startDate);if(t<s)return}if(rules.endDate){let s=new Date(rules.endDate);if(rules.endDate.length<=10&&s.setHours(23,59,59,999),t>s)return}let i=`quipux_popup_${this.manifest.tenant}_${this.manifest.id}`;if(rules.frequency==="once_per_session"&&sessionStorage.getItem(i)||rules.frequency==="once_per_device"&&localStorage.getItem(i))return;let a=rules.delay||0;setTimeout(()=>{this.render(),this.showModal()},a*1e3)}matchesRoute(e,t){if(!t||t==="/*"||t==="*")return!0;let i=e.endsWith("/")&&e.length>1?e.slice(0,-1):e,a=t.endsWith("/")&&t.length>1?t.slice(0,-1):t;if(a.endsWith("/*")){let s=a.slice(0,-2);return i.startsWith(s)}return i===a}sanitize(e){let t=document.createElement("div");return t.textContent=e||"",t.innerHTML}sanitizeUrl(e){return e&&(e.startsWith("https://")||e.startsWith("/"))?e:"#"}render(){!this.manifest||this.activeSlides.length===0||(this.shadow.innerHTML=`
      <style>
        :host {
          --q-ink: #211C33;
          --q-blue: #2E13F5;
          --q-sky: #61C7D0;
          --q-green: #5DC99A;
          --q-text-dark: #1E293B;
          --q-text-muted: #64748B;
          --q-radius: 16px;
          display: block;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(33, 28, 51, 0.72);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
          padding: 16px;
          box-sizing: border-box;
        }

        .backdrop.visible {
          opacity: 1;
          visibility: visible;
        }

        .dialog-container {
          background: #FFFFFF;
          border-radius: var(--q-radius);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          width: 100%;
          max-width: 820px;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          transform: translateY(20px) scale(0.97);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .backdrop.visible .dialog-container {
          transform: translateY(0) scale(1);
        }

        .close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #E2E8F0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          color: var(--q-ink);
          font-size: 18px;
          font-weight: bold;
          transition: background 0.2s, transform 0.1s;
        }

        .close-btn:hover, .close-btn:focus-visible {
          background: #FFFFFF;
          transform: scale(1.08);
          outline: 2px solid var(--q-blue);
        }

        .slider-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .slides-track {
          display: flex;
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
          width: 100%;
        }

        .slide-item {
          min-width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: row;
          background: #FFFFFF;
        }

        .slide-media {
          flex: 1.1;
          background: #F8FAFC;
          min-height: 380px;
          max-height: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .slide-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .slide-body {
          flex: 1;
          padding: 36px 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-sizing: border-box;
        }

        .tenant-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(46, 19, 245, 0.08);
          color: var(--q-blue);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 10px;
          border-radius: 20px;
          margin-bottom: 12px;
          align-self: flex-start;
        }

        .slide-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--q-ink);
          margin: 0 0 12px 0;
          line-height: 1.25;
        }

        .slide-desc {
          font-size: 15px;
          line-height: 1.6;
          color: var(--q-text-muted);
          margin: 0 0 24px 0;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--q-blue);
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          align-self: flex-start;
          transition: background 0.2s, transform 0.1s;
          border: none;
          cursor: pointer;
        }

        .cta-btn:hover, .cta-btn:focus-visible {
          background: #240dc5;
          transform: translateY(-1px);
          outline: 2px solid var(--q-sky);
        }

        .nav-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #CBD5E1;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
          color: var(--q-ink);
          font-size: 18px;
          transition: all 0.2s;
        }

        .nav-arrow:hover, .nav-arrow:focus-visible {
          background: #FFFFFF;
          outline: 2px solid var(--q-blue);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .nav-arrow.prev { left: 12px; }
        .nav-arrow.next { right: 12px; }

        .dots-container {
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: #FFFFFF;
          border-top: 1px solid #F1F5F9;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #CBD5E1;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .dot.active {
          background: var(--q-blue);
          transform: scale(1.3);
        }

        /* Responsive Mobile Breakpoint (< 680px) */
        @media (max-width: 680px) {
          .slide-item {
            flex-direction: column;
          }
          .slide-media {
            min-height: 200px;
            max-height: 240px;
          }
          .slide-body {
            padding: 20px 18px;
          }
          .slide-title {
            font-size: 19px;
          }
          .slide-desc {
            font-size: 14px;
            margin-bottom: 16px;
          }
          .nav-arrow {
            display: none; /* En m\xF3vil se usa touch swipe o dots */
          }
        }

        /* prefers-reduced-motion (AC-18) */
        @media (prefers-reduced-motion: reduce) {
          .backdrop, .dialog-container, .slides-track, .close-btn, .cta-btn, .dot {
            transition: none !important;
            animation: none !important;
          }
        }
      </style>

      <div class="backdrop" id="backdrop" role="presentation">
        <div class="dialog-container"
             role="dialog"
             aria-modal="true"
             aria-labelledby="modal-title"
             aria-describedby="modal-desc"
             tabindex="-1"
             id="dialog">

          <button class="close-btn" id="closeBtn" aria-label="Cerrar ventana emergente">\u2715</button>

          <div class="slider-wrapper" id="sliderWrapper">
            ${this.activeSlides.length>1?`
              <button class="nav-arrow prev" id="prevBtn" aria-label="Slide anterior">\u2039</button>
              <button class="nav-arrow next" id="nextBtn" aria-label="Slide siguiente">\u203A</button>
            `:""}

            <div class="slides-track" id="track">
              ${this.activeSlides.map((e,t)=>`
                <div class="slide-item" role="group" aria-roledescription="slide" aria-label="${t+1} de ${this.activeSlides.length}">
                  <div class="slide-media">
                    <picture>
                      ${e.mobilePreview?`<source media="(max-width: 680px)" srcset="${e.mobilePreview}">`:""}
                      <img src="${e.desktopPreview||e.mobilePreview||"http://localhost:3000/resources/tenants/valle/assets/desktop/valle-cobro-desktop-1.png"}"
                           alt="${this.sanitize(e.alt||e.title)}"
                           loading="lazy">
                    </picture>
                  </div>
                  <div class="slide-body">
                    <div class="tenant-badge">Quipux \xB7 ${this.sanitize(this.manifest.tenant)}</div>
                    <h2 class="slide-title" id="${t===0?"modal-title":""}">${this.sanitize(e.title)}</h2>
                    <p class="slide-desc" id="${t===0?"modal-desc":""}">${this.sanitize(e.description)}</p>
                    ${e.cta?`
                      <a class="cta-btn"
                         href="${this.sanitizeUrl(e.link)}"
                         target="_blank"
                         rel="noopener noreferrer"
                         data-slide-index="${t}">
                        ${this.sanitize(e.cta)} \u2192
                      </a>
                    `:""}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          ${this.activeSlides.length>1?`
            <div class="dots-container" role="tablist">
              ${this.activeSlides.map((e,t)=>`
                <button class="dot ${t===0?"active":""}"
                        role="tab"
                        aria-selected="${t===0?"true":"false"}"
                        aria-label="Ir al slide ${t+1}"
                        data-index="${t}">
                </button>
              `).join("")}
            </div>
          `:""}
        </div>
      </div>
    `,this.setupEvents())}setupEvents(){let e=this.shadow.getElementById("backdrop"),t=this.shadow.getElementById("dialog"),i=this.shadow.getElementById("closeBtn"),a=this.shadow.getElementById("prevBtn"),s=this.shadow.getElementById("nextBtn"),u=this.shadow.querySelectorAll(".dot"),h=this.shadow.querySelectorAll(".cta-btn"),d=this.shadow.getElementById("sliderWrapper");i?.addEventListener("click",()=>this.closeModal("close_button")),e?.addEventListener("click",l=>{l.target===e&&this.closeModal("backdrop_click")}),a?.addEventListener("click",()=>this.prevSlide()),s?.addEventListener("click",()=>this.nextSlide()),u.forEach(l=>{l.addEventListener("click",p=>{let c=parseInt(p.currentTarget.dataset.index||"0",10);this.goToSlide(c)})}),h.forEach(l=>{l.addEventListener("click",p=>{let c=parseInt(p.currentTarget.dataset.slideIndex||"0",10),f=this.activeSlides[c];this.pushDataLayer("quipux_modal_cta_click",{slideIndex:c,slideId:f.id,ctaText:f.cta,targetUrl:f.link})})});let g=0;d?.addEventListener("touchstart",l=>{g=l.changedTouches[0].screenX,this.pauseAutoplay()},{passive:!0}),d?.addEventListener("touchend",l=>{let p=l.changedTouches[0].screenX,c=g-p;Math.abs(c)>45&&(c>0?this.nextSlide():this.prevSlide()),this.resumeAutoplay()},{passive:!0}),d?.addEventListener("mouseenter",()=>this.pauseAutoplay()),d?.addEventListener("mouseleave",()=>this.resumeAutoplay()),t?.addEventListener("focusin",()=>this.pauseAutoplay()),t?.addEventListener("focusout",()=>this.resumeAutoplay()),this.boundKeyHandler=this.handleKeyDown.bind(this),window.addEventListener("keydown",this.boundKeyHandler)}handleKeyDown(e){if(this.isVisible){if(e.key==="Escape"){e.preventDefault(),this.closeModal("esc_key");return}if(e.key==="ArrowRight"){this.nextSlide();return}if(e.key==="ArrowLeft"){this.prevSlide();return}if(e.key==="Tab"){let t=this.shadow.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');if(t.length===0)return;let i=t[0],a=t[t.length-1];e.shiftKey?this.shadow.activeElement===i&&(e.preventDefault(),a.focus()):this.shadow.activeElement===a&&(e.preventDefault(),i.focus())}}}removeEventListeners(){this.boundKeyHandler&&window.removeEventListener("keydown",this.boundKeyHandler)}showModal(){if(this.isVisible)return;this.isVisible=!0,this.openTimestamp=Date.now(),this.previousActiveElement=document.activeElement;let e=this.shadow.getElementById("backdrop"),t=this.shadow.getElementById("dialog");e?.classList.add("visible");let i=this.shadow.getElementById("closeBtn");setTimeout(()=>{(i||t)?.focus()},50),this.pushDataLayer("quipux_modal_impression",{totalSlides:this.activeSlides.length}),this.trackSlideView(0),this.manifest?.rules.autoplayToggle&&this.startAutoplay()}closeModal(e="close_button",t=!0){if(!this.isVisible)return;this.isVisible=!1,this.stopAutoplay(),this.shadow.getElementById("backdrop")?.classList.remove("visible");let a=Math.round((Date.now()-this.openTimestamp)/1e3);if(this.pushDataLayer("quipux_modal_close",{closeReason:e,timeViewedSeconds:a}),t&&this.manifest){let s=`quipux_popup_${this.manifest.tenant}_${this.manifest.id}`;this.manifest.rules.frequency==="once_per_session"?sessionStorage.setItem(s,"true"):this.manifest.rules.frequency==="once_per_device"&&localStorage.setItem(s,"true")}this.previousActiveElement&&typeof this.previousActiveElement.focus=="function"&&this.previousActiveElement.focus()}goToSlide(e){if(e<0||e>=this.activeSlides.length)return;this.currentSlideIndex=e;let t=this.shadow.getElementById("track");t&&(t.style.transform=`translateX(-${e*100}%)`),this.shadow.querySelectorAll(".dot").forEach((a,s)=>{a.classList.toggle("active",s===e),a.setAttribute("aria-selected",s===e?"true":"false")}),this.trackSlideView(e)}nextSlide(){let e=(this.currentSlideIndex+1)%this.activeSlides.length;this.goToSlide(e)}prevSlide(){let e=(this.currentSlideIndex-1+this.activeSlides.length)%this.activeSlides.length;this.goToSlide(e)}trackSlideView(e){let t=this.activeSlides[e];t&&this.pushDataLayer("quipux_modal_slide_view",{slideIndex:e,slideId:t.id,slideTitle:t.title})}startAutoplay(){this.stopAutoplay(),this.autoplayTimer=setInterval(()=>{this.nextSlide()},4500)}pauseAutoplay(){this.autoplayTimer&&(clearInterval(this.autoplayTimer),this.autoplayTimer=null)}resumeAutoplay(){this.manifest?.rules.autoplayToggle&&!this.autoplayTimer&&this.startAutoplay()}stopAutoplay(){this.autoplayTimer&&(clearInterval(this.autoplayTimer),this.autoplayTimer=null)}pushDataLayer(e,t){!this.manifest||this.manifest.rules.dataLayerToggle===!1||(window.dataLayer=window.dataLayer||[],window.dataLayer.push({event:e,modal:{campaignId:this.manifest.id,tenantId:this.manifest.tenant,version:this.manifest.version,timestamp:new Date().toISOString(),...t}}),window.dispatchEvent(new CustomEvent("quipux_datalayer_event",{detail:{event:e,modal:{...t,campaignId:this.manifest.id,tenantId:this.manifest.tenant}}})))}};(function(){"use strict";if(window.__QUIPUX_POPUP_LOADED__){console.warn("[Quipux Runtime] El cargador ya ha sido inicializado en esta p\xE1gina. Se omite la inyecci\xF3n duplicada para evitar colisiones.");return}window.__QUIPUX_POPUP_LOADED__=!0,customElements.get("quipux-popup-studio")||customElements.define("quipux-popup-studio",m);function r(){let e=document.querySelector("quipux-popup-studio");if(!e){e=document.createElement("quipux-popup-studio");let t=document.currentScript||document.querySelector("script[data-tenant]"),i=t?.getAttribute("data-tenant")||"",a=t?.getAttribute("data-campaign")||"",s=t?.getAttribute("data-manifest-url");if(typeof window<"u"&&window.location){let u=new URLSearchParams(window.location.search),h=u.get("tenant"),d=u.get("campaign");h&&(i=h),d&&(a=d)}i||(i="valle"),a||(a=i==="movilidad-medellin"?"camp-medellin-1":"modal-cobro-2026"),e.setAttribute("tenant",i),e.setAttribute("campaign",a),s&&e.setAttribute("manifest-url",s),document.body.appendChild(e)}}function n(){let e=()=>{let i=document.querySelector("quipux-popup-studio");i&&typeof i.evaluateAndMount=="function"&&i.evaluateAndMount()};window.addEventListener("popstate",e);let t=i=>{let a=history[i];return function(...s){let u=a.apply(this,s);return setTimeout(e,50),u}};history.pushState=t("pushState"),history.replaceState=t("replaceState")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{r(),n()}):(r(),n())})();})();

/* Nur für die Testseiten: ersetzt <ha-icon> durch MDI-Symbole (außerhalb von Home Assistant gibt es das Element nicht). */
if (!customElements.get('ha-icon')) {
  const cache = {};
  class HaIcon extends HTMLElement {
    static get observedAttributes() { return ['icon']; }
    connectedCallback() { if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._r(); }
    attributeChangedCallback() { this._r(); }
    async _r() {
      if (!this.shadowRoot) return;
      const n = (this.getAttribute('icon') || '').replace('mdi:', '');
      this.shadowRoot.innerHTML = '<style>:host{display:inline-flex;width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px)}svg{width:100%;height:100%;fill:currentColor}</style>';
      if (!n) return;
      let t = cache[n];
      if (!t) {
        try { t = cache[n] = await (await fetch('https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/' + n + '.svg')).text(); } catch (e) { return; }
      }
      this.shadowRoot.innerHTML += t;
    }
  }
  customElements.define('ha-icon', HaIcon);
}

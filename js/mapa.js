/* ============================================
   EncuestaPe — Mapa Interactivo Controller
   ============================================ */

const MapaController = {
  selectedRegion: null,
  svgContainer: null,
  tooltip: null,
  regionStats: {},

  /**
   * Initialize map: load SVG, attach events, highlight regions
   */
  async init(containerId) {
    this.svgContainer = document.getElementById(containerId);
    if (!this.svgContainer) return;

    // SVG should already be inline in the HTML
    // If not, try fetching as fallback
    if (!this.svgContainer.querySelector('.mapa-region')) {
      try {
        const res = await fetch('assets/peru-map.svg');
        const svgText = await res.text();
        this.svgContainer.innerHTML = svgText;
      } catch (err) {
        console.error('Error loading map SVG:', err);
        return;
      }
    }

    // Create tooltip
    this.tooltip = document.getElementById('mapaTooltip');

    // Attach event listeners to region paths
    this.svgContainer.querySelectorAll('.mapa-region').forEach(path => {
      path.addEventListener('click', () => this.selectRegion(path.dataset.region));
      path.addEventListener('mouseenter', (e) => this.showTooltip(e, path.dataset.region));
      path.addEventListener('mousemove', (e) => this.moveTooltip(e));
      path.addEventListener('mouseleave', () => this.hideTooltip());
    });

    // Build region list sidebar
    this.buildRegionList();

    // Update highlights
    this.updateHighlights();
  },

  /**
   * Toggle region selection
   */
  selectRegion(regionCode) {
    if (this.selectedRegion === regionCode) {
      // Deselect
      this.selectedRegion = null;
    } else {
      this.selectedRegion = regionCode;
    }

    // Update SVG classes
    this.svgContainer.querySelectorAll('.mapa-region').forEach(p => {
      p.classList.toggle('selected', p.dataset.region === this.selectedRegion);
    });

    // Update sidebar list
    document.querySelectorAll('.mapa-region-item').forEach(item => {
      item.classList.toggle('active', item.dataset.region === this.selectedRegion);
    });

    // Update info bar
    this.updateInfoBar();

    // Dispatch event for landing.js to filter encuestas
    document.dispatchEvent(new CustomEvent('regionChanged', {
      detail: { region: this.selectedRegion }
    }));
  },

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedRegion = null;
    this.svgContainer.querySelectorAll('.mapa-region').forEach(p => {
      p.classList.remove('selected');
    });
    document.querySelectorAll('.mapa-region-item').forEach(item => {
      item.classList.remove('active');
    });
    this.updateInfoBar();
    document.dispatchEvent(new CustomEvent('regionChanged', {
      detail: { region: null }
    }));
  },

  /**
   * Update map highlights based on which regions have active encuestas
   */
  updateHighlights() {
    this.regionStats = API.getRegionStats();

    this.svgContainer.querySelectorAll('.mapa-region').forEach(path => {
      const region = path.dataset.region;
      const hasData = this.regionStats[region] > 0;
      path.classList.toggle('has-encuestas', hasData);
    });

    // Update sidebar counts
    document.querySelectorAll('.mapa-region-item').forEach(item => {
      const region = item.dataset.region;
      const count = this.regionStats[region] || 0;
      const countEl = item.querySelector('.mapa-region-item-count');
      if (countEl) countEl.textContent = count;
      item.classList.toggle('has-data', count > 0);
    });
  },

  /**
   * Build the region list sidebar
   */
  buildRegionList() {
    const list = document.getElementById('mapaRegionList');
    if (!list) return;

    list.innerHTML = '';
    const sortedRegions = Object.entries(REGIONES_PERU)
      .filter(([key]) => key !== 'NACIONAL')
      .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));

    sortedRegions.forEach(([key, data]) => {
      const item = document.createElement('div');
      item.className = 'mapa-region-item';
      item.dataset.region = key;
      item.innerHTML = `
        <span class="mapa-region-item-name">${data.nombre}</span>
        <span class="mapa-region-item-count">0</span>
      `;
      item.addEventListener('click', () => this.selectRegion(key));
      // Hover sync with map
      item.addEventListener('mouseenter', () => {
        const path = this.svgContainer.querySelector(`[data-region="${key}"]`);
        if (path) path.style.fill = '';
        if (path) path.classList.add('hover-highlight');
      });
      item.addEventListener('mouseleave', () => {
        const path = this.svgContainer.querySelector(`[data-region="${key}"]`);
        if (path) path.classList.remove('hover-highlight');
      });
      list.appendChild(item);
    });
  },

  /**
   * Update the info bar showing selected region details
   */
  updateInfoBar() {
    const infoBar = document.getElementById('mapaInfo');
    const filterBar = document.getElementById('mapaActiveFilter');
    const filterLabel = document.getElementById('mapaFilterLabel');

    if (this.selectedRegion) {
      const regionData = REGIONES_PERU[this.selectedRegion];
      const count = this.regionStats[this.selectedRegion] || 0;
      const name = regionData ? regionData.nombre : this.selectedRegion;

      if (infoBar) {
        infoBar.querySelector('.mapa-info-title').textContent = name;
        infoBar.querySelector('.mapa-info-stats').innerHTML = count > 0
          ? `<span class="mono">${count}</span> encuesta${count !== 1 ? 's' : ''} activa${count !== 1 ? 's' : ''}`
          : 'Sin encuestas activas por el momento';
        infoBar.style.display = '';
      }

      if (filterBar && filterLabel) {
        filterLabel.textContent = name;
        filterBar.classList.add('visible');
      }
    } else {
      if (infoBar) {
        infoBar.querySelector('.mapa-info-title').textContent = 'Todo el Peru';
        infoBar.querySelector('.mapa-info-stats').innerHTML = 'Selecciona una region en el mapa';
        infoBar.style.display = '';
      }
      if (filterBar) {
        filterBar.classList.remove('visible');
      }
    }
  },

  /**
   * Tooltip handlers
   */
  showTooltip(e, regionCode) {
    if (!this.tooltip) return;
    const regionData = REGIONES_PERU[regionCode];
    const count = this.regionStats[regionCode] || 0;
    const name = regionData ? regionData.nombre : regionCode;
    const countText = count > 0 ? `<span class="mapa-tooltip-count">${count} encuesta${count !== 1 ? 's' : ''}</span>` : '';
    this.tooltip.innerHTML = `${name}${countText}`;
    this.tooltip.classList.add('visible');
    this.moveTooltip(e);
  },

  moveTooltip(e) {
    if (!this.tooltip) return;
    this.tooltip.style.left = (e.clientX + 14) + 'px';
    this.tooltip.style.top = (e.clientY - 10) + 'px';
  },

  hideTooltip() {
    if (!this.tooltip) return;
    this.tooltip.classList.remove('visible');
  }
};

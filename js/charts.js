/* ============================================
   EncuestaPe — Charts Module (Chart.js)
   ============================================ */

const Charts = {
  instances: {},

  /**
   * Create horizontal bar chart for results
   */
  createBarChart(canvasId, resultados, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    const colors = getChartColors(resultados.length);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: resultados.map(r => r.opcion.length > 35 ? r.opcion.substring(0, 35) + '...' : r.opcion),
        datasets: [{
          data: resultados.map(r => r.cantidad),
          backgroundColor: colors,
          borderRadius: 4,
          barThickness: options.barThickness || 36
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0A1E3D',
            titleFont: { family: 'Outfit', size: 13 },
            bodyFont: { family: 'JetBrains Mono', size: 12 },
            callbacks: {
              label: (ctx) => {
                const r = resultados[ctx.dataIndex];
                return ` ${r.cantidad} votos (${r.porcentaje}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              font: { family: 'JetBrains Mono', size: 11 },
              color: options.darkMode ? 'rgba(255,255,255,0.5)' : '#5A6B7F'
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { family: 'Outfit', size: 13 },
              color: options.darkMode ? 'rgba(255,255,255,0.8)' : '#0F1C2E'
            }
          }
        },
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        }
      }
    });

    return this.instances[canvasId];
  },

  /**
   * Create doughnut chart
   */
  createDoughnutChart(canvasId, resultados) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    const colors = getChartColors(resultados.length);

    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: resultados.map(r => r.opcion.length > 30 ? r.opcion.substring(0, 30) + '...' : r.opcion),
        datasets: [{
          data: resultados.map(r => r.cantidad),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              font: { family: 'Outfit', size: 12 },
              usePointStyle: true,
              pointStyleWidth: 10
            }
          },
          tooltip: {
            backgroundColor: '#0A1E3D',
            bodyFont: { family: 'JetBrains Mono', size: 12 },
            callbacks: {
              label: (ctx) => {
                const r = resultados[ctx.dataIndex];
                return ` ${r.porcentaje}% (${r.cantidad} votos)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          duration: 1200
        }
      }
    });

    return this.instances[canvasId];
  },

  /**
   * Create line chart (for admin — votes per hour)
   */
  createLineChart(canvasId, labels, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
    }

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: '#1A4B8C',
          backgroundColor: 'rgba(26, 75, 140, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1A4B8C',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0A1E3D',
            bodyFont: { family: 'JetBrains Mono', size: 12 }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { family: 'Outfit', size: 11 }, color: '#5A6B7F' }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { family: 'JetBrains Mono', size: 11 }, color: '#5A6B7F' }
          }
        },
        animation: { duration: 1000 }
      }
    });

    return this.instances[canvasId];
  },

  /**
   * Update existing chart data
   */
  updateChart(canvasId, newData) {
    const chart = this.instances[canvasId];
    if (!chart) return;

    chart.data.datasets[0].data = newData;
    chart.update('active');
  }
};

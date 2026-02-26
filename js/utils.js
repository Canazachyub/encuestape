/* ============================================
   EncuestaPe — Utility Functions
   ============================================ */

/**
 * Hash a string using SHA-256 (Web Crypto API)
 */
async function hashSHA256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate DNI format (8 numeric digits)
 */
function validateDNI(dni) {
  return /^\d{8}$/.test(dni);
}

/**
 * Format number with comma separators
 */
function formatNumber(num) {
  return new Intl.NumberFormat('es-PE').format(num);
}

/**
 * Animate counter from 0 to target value
 */
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();
  const isDecimal = String(target).includes('.');

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = start + (target - start) * eased;

    if (isDecimal) {
      element.textContent = current.toFixed(1);
    } else {
      element.textContent = formatNumber(Math.floor(current));
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      if (isDecimal) {
        element.textContent = target.toFixed ? target.toFixed(1) : target;
      } else {
        element.textContent = formatNumber(target);
      }
    }
  }

  requestAnimationFrame(update);
}

/**
 * Relative time string
 */
function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `hace ${seconds} segundos`;
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} minutos`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} horas`;
  return `hace ${Math.floor(seconds / 86400)} días`;
}

/**
 * Format date to locale string
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Debounce function
 */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * IntersectionObserver helper for animations
 */
function observeElements(selector, callback, options = {}) {
  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, ...options });

  elements.forEach(el => observer.observe(el));
}

/**
 * Get display name from option (string or object)
 */
function getOptionName(opt) {
  if (typeof opt === 'object' && opt !== null) return opt.nombre;
  return opt;
}

/**
 * Find candidate data from encuesta opciones by name
 */
function findCandidateData(encuesta, optionName) {
  if (!encuesta || !encuesta.opciones) return null;
  return encuesta.opciones.find(o =>
    typeof o === 'object' && o.nombre === optionName
  ) || null;
}

/**
 * Generate initials from a name (for avatar fallback)
 */
function getInitials(name) {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

/**
 * Generate chart colors
 */
function getChartColors(count) {
  const palette = [
    '#D4A012', '#1A4B8C', '#0A1E3D', '#1B8C5A',
    '#D91023', '#5A6B7F', '#E6A817', '#8B5CF6',
    '#2563EB', '#DC2626', '#059669', '#D97706',
    '#7C3AED', '#DB2777', '#0891B2', '#4F46E5',
    '#EA580C', '#16A34A', '#9333EA', '#E11D48',
    '#0284C7', '#65A30D', '#C026D3', '#CA8A04',
    '#0D9488', '#6366F1', '#F59E0B', '#EF4444',
    '#10B981', '#8B5CF6', '#F97316', '#06B6D4',
    '#A855F7', '#EC4899', '#14B8A6', '#6D28D9'
  ];
  if (count <= palette.length) return palette.slice(0, count);
  const result = [...palette];
  for (let i = palette.length; i < count; i++) {
    const hue = (i * 137.508) % 360;
    result.push(`hsl(${hue}, 65%, 50%)`);
  }
  return result;
}

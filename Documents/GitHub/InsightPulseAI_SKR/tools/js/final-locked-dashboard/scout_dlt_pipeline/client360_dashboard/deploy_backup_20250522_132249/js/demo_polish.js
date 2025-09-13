/**
 * Demo Polish Script - Show-Ready Enhancements
 * Adds final presentation-quality touches to the dashboard
 */

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(addDemoPolish, 500); // Wait for other scripts to load
});

function addDemoPolish() {
  // Add demo banner
  addDemoBanner();
  
  // Add smooth loading animation
  addLoadingAnimation();
  
  // Enhance hover effects
  enhanceHoverEffects();
  
  // Add demo tooltips
  addDemoTooltips();
  
  // Add presentation mode toggle
  addPresentationMode();
  
  console.log('🎨 Demo polish applied - Dashboard is show-ready!');
}

function addDemoBanner() {
  const demoBanner = document.createElement('div');
  demoBanner.id = 'demo-banner';
  demoBanner.className = 'demo-banner';
  demoBanner.innerHTML = `
    <div class="demo-banner-content">
      <div class="demo-info">
        <i class="fas fa-play-circle"></i>
        <span><strong>LIVE DEMO MODE</strong> - TBWA\\SMP FMCG Portfolio Showcase</span>
      </div>
      <div class="demo-actions">
        <button class="demo-btn" onclick="startDemoTour()">
          <i class="fas fa-route"></i> Start Tour
        </button>
        <button class="demo-btn" onclick="togglePresentationMode()">
          <i class="fas fa-expand"></i> Present
        </button>
        <button class="demo-btn demo-close" onclick="hideDemoBanner()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `;
  
  document.body.insertBefore(demoBanner, document.body.firstChild);
}

function addLoadingAnimation() {
  // Add smooth fade-in for sections
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-visible');
      }
    });
  }, { threshold: 0.1 });
  
  document.querySelectorAll('.section-content, .kpi-card, .brand-card, .insight-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
}

function enhanceHoverEffects() {
  // Add premium hover effects to interactive elements
  const style = document.createElement('style');
  style.textContent = `
    .kpi-card:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 8px 25px rgba(0, 103, 177, 0.15);
    }
    
    .brand-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
      border-color: var(--primary-color);
    }
    
    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateX(5px);
    }
    
    .device-item:hover {
      background-color: var(--background-light);
      border-color: var(--primary-color);
    }
  `;
  document.head.appendChild(style);
}

function addDemoTooltips() {
  // Add informative tooltips for demo purposes
  const tooltips = [
    { selector: '.kpi-card', text: 'Click to drill down into detailed metrics' },
    { selector: '.brand-card', text: 'Explore individual brand performance' },
    { selector: '.device-item', text: 'View real-time device health and status' },
    { selector: '.insight-card', text: 'AI-generated business recommendations' },
    { selector: '.nav-link', text: 'Navigate between dashboard sections' }
  ];
  
  tooltips.forEach(({ selector, text }) => {
    document.querySelectorAll(selector).forEach(el => {
      el.setAttribute('title', text);
      el.style.cursor = 'pointer';
    });
  });
}

function addPresentationMode() {
  let presentationMode = false;
  
  window.togglePresentationMode = function() {
    presentationMode = !presentationMode;
    const body = document.body;
    
    if (presentationMode) {
      body.classList.add('presentation-mode');
      document.getElementById('demo-banner').style.display = 'none';
    } else {
      body.classList.remove('presentation-mode');
      document.getElementById('demo-banner').style.display = 'block';
    }
  };
}

function startDemoTour() {
  const tourSteps = [
    { element: '.kpi-grid', title: 'FMCG KPIs', description: 'Key performance indicators for Del Monte, Oishi, Alaska Milk & Peerless' },
    { element: '.device-health-grid', title: 'Device Health', description: 'Real-time monitoring of store devices across the Philippines' },
    { element: '.brands-section', title: 'Brand Portfolio', description: 'Performance breakdown by TBWA\\SMP client brands' },
    { element: '.ai-insights-panel', title: 'AI Insights', description: 'Machine learning-powered business recommendations' }
  ];
  
  let currentStep = 0;
  
  function showTourStep(step) {
    // Remove previous highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    
    if (step >= tourSteps.length) {
      hideTourTooltip();
      return;
    }
    
    const stepData = tourSteps[step];
    const element = document.querySelector(stepData.element);
    
    if (element) {
      element.classList.add('tour-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      showTourTooltip(element, stepData.title, stepData.description, step + 1, tourSteps.length);
    }
  }
  
  function showTourTooltip(element, title, description, current, total) {
    const existingTooltip = document.getElementById('tour-tooltip');
    if (existingTooltip) existingTooltip.remove();
    
    const tooltip = document.createElement('div');
    tooltip.id = 'tour-tooltip';
    tooltip.className = 'tour-tooltip';
    tooltip.innerHTML = `
      <div class="tour-content">
        <h4>${title}</h4>
        <p>${description}</p>
        <div class="tour-progress">Step ${current} of ${total}</div>
        <div class="tour-actions">
          <button onclick="nextTourStep()" class="tour-btn tour-next">
            ${current === total ? 'Finish' : 'Next'} <i class="fas fa-arrow-right"></i>
          </button>
          <button onclick="hideTourTooltip()" class="tour-btn tour-skip">Skip Tour</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip near element
    const rect = element.getBoundingClientRect();
    tooltip.style.top = (rect.bottom + 10) + 'px';
    tooltip.style.left = Math.min(rect.left, window.innerWidth - tooltip.offsetWidth - 20) + 'px';
  }
  
  window.nextTourStep = function() {
    currentStep++;
    showTourStep(currentStep);
  };
  
  window.hideTourTooltip = function() {
    const tooltip = document.getElementById('tour-tooltip');
    if (tooltip) tooltip.remove();
    
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
  };
  
  // Start the tour
  showTourStep(0);
}

window.hideDemoBanner = function() {
  const banner = document.getElementById('demo-banner');
  if (banner) {
    banner.style.transform = 'translateY(-100%)';
    setTimeout(() => banner.remove(), 300);
  }
};

// Add demo styles
const demoStyles = `
<style>
.demo-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #0067b1, #e31937);
  color: white;
  z-index: 9999;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.demo-banner-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  max-width: 1440px;
  margin: 0 auto;
}

.demo-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.demo-actions {
  display: flex;
  gap: 0.5rem;
}

.demo-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.demo-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.demo-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 0.4rem;
  width: 32px;
}

.presentation-mode {
  padding-top: 0 !important;
}

.presentation-mode .sidebar {
  transform: translateX(-100%);
}

.presentation-mode .main-content {
  margin-left: 0 !important;
}

.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s ease;
}

.fade-in-visible {
  opacity: 1;
  transform: translateY(0);
}

.tour-highlight {
  position: relative;
  z-index: 1000;
}

.tour-highlight::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border: 3px solid var(--accent-color);
  border-radius: 8px;
  animation: pulse 2s infinite;
  pointer-events: none;
}

.tour-tooltip {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  max-width: 300px;
  z-index: 10000;
  border: 1px solid var(--border-color);
}

.tour-content h4 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color);
}

.tour-content p {
  margin: 0 0 1rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.tour-progress {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.tour-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.tour-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.tour-next {
  background: var(--primary-color);
  color: white;
}

.tour-next:hover {
  background: #005a9f;
}

.tour-skip {
  background: var(--background-light);
  color: var(--text-secondary);
}

.tour-skip:hover {
  background: var(--border-color);
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* Adjust main content for demo banner */
body {
  padding-top: 50px;
}

/* Enhanced animations */
@keyframes slideInFromLeft {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInFromRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.sidebar {
  animation: slideInFromLeft 0.6s ease-out;
}

.main-content {
  animation: slideInFromRight 0.6s ease-out;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', demoStyles);
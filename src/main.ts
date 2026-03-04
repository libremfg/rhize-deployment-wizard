import './styles/global.css';
import { WizardState } from './types/index.js';
import { deploymentDomains } from './data/deployment-config.js';
import { presets } from './data/presets.js';
import { ValidationEngine } from './modules/validation.js';
import { StorageManager } from './modules/storage.js';
import { WizardRenderer } from './modules/renderer.js';
import { ChecklistGenerator } from './modules/checklist-generator.js';

// State management
const state = new WizardState();
const validationEngine = new ValidationEngine();

// Load saved state or start fresh
const savedState = StorageManager.loadSnapshot();
if (savedState) {
  state.fromJSON(savedState);
} else {
  // Preselect deployment target on initial visit
  state.selectOption('deployment-target', 'kubernetes');
  
  // Preselect all Rhize core services
  const rhizeCoreServices = deploymentDomains.find(d => d.id === 'rhize-core-services');
  if (rhizeCoreServices) {
    rhizeCoreServices.options.forEach(option => {
      state.selectOption('rhize-core-services', option.id);
    });
  }
  
  // Preselect recommended deployment infrastructure
  state.selectOption('cd-tool', 'argocd');
  state.selectOption('container-registry', 'gitlab-registry');
  state.selectOption('cluster-ingress', 'traefik');
  state.selectOption('cluster-monitoring', 'lgtm-stack');
  state.selectOption('identity-access', 'keycloak');
  state.selectOption('core-database', 'postgresql');
  state.selectOption('event-streaming', 'redpanda');
  state.selectOption('timeseries-db', 'questdb');
}

// Subscribe to state changes
state.subscribe(() => {
  StorageManager.saveSnapshot(state.toJSON());
  updateUI();
});

// Initialize App
function initApp() {
  const appContainer = document.getElementById('app');
  if (!appContainer) return;

  appContainer.innerHTML = `
    <div class="app-header">
      <div class="header-content">
        <img src="https://docs.rhize.com/images/logo.svg" alt="Rhize" class="rhize-logo" />
        <div>
          <h1>Rhize Deployment Wizard</h1>
          <p>Interactive questionnaire for deploying Rhize across different infrastructure types</p>
        </div>
      </div>
    </div>
    
    <div class="app-container">
      <aside class="sidebar">
        <h2>Progress</h2>
        <div class="progress-list"></div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <button class="primary" style="width: 100%;" id="preset-quick-start">Quick Start</button>
          <button style="width: 100%; margin-top: 8px;" id="preset-production">Production</button>
          <button style="width: 100%; margin-top: 8px;" id="preset-enterprise">Enterprise</button>
          <button style="width: 100%; margin-top: 8px;" id="preset-edge">Edge/IoT</button>
        </div>
        <button class="success" style="width: 100%; margin-top: 16px;" id="btn-generate">Generate Checklist</button>
        <button style="width: 100%; margin-top: 8px;" id="btn-reset">Reset All</button>
      </aside>

      <main class="main-content">
        <div class="wizard-container">
          <div id="wizard-render"></div>
        </div>

        <div id="validation-area"></div>
      </main>
    </div>

    <div class="modal" id="modal-checklist">
      <div class="modal-content">
        <button class="modal-close" id="modal-close">&times;</button>
        <h2 class="modal-header">Deployment Checklist</h2>
        
        <div class="tabs">
          <button class="tab active" data-tab="markdown">Markdown</button>
          <button class="tab" data-tab="html">HTML</button>
          <button class="tab" data-tab="json">JSON</button>
        </div>

        <div id="tab-markdown" class="tab-content active">
          <textarea id="checklist-markdown" style="width: 100%; height: 400px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-family: monospace; font-size: 12px;" readonly></textarea>
          <button class="primary" style="margin-top: 12px; width: 100%;" id="btn-copy-markdown">Copy to Clipboard</button>
        </div>

        <div id="tab-html" class="tab-content">
          <button class="primary" style="width: 100%; margin-bottom: 12px;" id="btn-open-html">Open in New Window</button>
          <button style="width: 100%;" id="btn-download-html">Download HTML</button>
        </div>

        <div id="tab-json" class="tab-content">
          <textarea id="checklist-json" style="width: 100%; height: 400px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-family: monospace; font-size: 12px;" readonly></textarea>
          <button class="primary" style="margin-top: 12px; width: 100%;" id="btn-download-json">Download JSON</button>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners
  attachEventListeners();

  // Initial render
  renderWizard();
  updateUI();
}

function attachEventListeners() {
  // Presets
  document.getElementById('preset-quick-start')?.addEventListener('click', () => loadPreset('quickStart'));
  document.getElementById('preset-production')?.addEventListener('click', () => loadPreset('production'));
  document.getElementById('preset-enterprise')?.addEventListener('click', () => loadPreset('enterprise'));
  document.getElementById('preset-edge')?.addEventListener('click', () => loadPreset('edgeIot'));

  // Actions
  document.getElementById('btn-generate')?.addEventListener('click', showChecklistModal);
  document.getElementById('btn-reset')?.addEventListener('click', resetAll);

  // Modal
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-checklist')?.addEventListener('click', e => {
    if ((e.target as HTMLElement).id === 'modal-checklist') closeModal();
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = (tab as HTMLElement).getAttribute('data-tab');
      if (!tabName) return;

      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`tab-${tabName}`)?.classList.add('active');
    });
  });

  // Checklist actions
  document.getElementById('btn-copy-markdown')?.addEventListener('click', () => {
    const textarea = document.getElementById('checklist-markdown') as HTMLTextAreaElement;
    if (textarea) {
      textarea.select();
      document.execCommand('copy');
      alert('Copied to clipboard!');
    }
  });

  document.getElementById('btn-open-html')?.addEventListener('click', () => {
    const html = new ChecklistGenerator(state.toJSON()).generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url);
  });

  document.getElementById('btn-download-html')?.addEventListener('click', () => {
    const html = new ChecklistGenerator(state.toJSON()).generateHTML();
    const blob = new Blob([html], { type: 'text/html' });
    downloadFile(blob, 'rhize-deployment-checklist.html');
  });

  document.getElementById('btn-download-json')?.addEventListener('click', () => {
    const json = new ChecklistGenerator(state.toJSON()).generateJSON();
    const blob = new Blob([json], { type: 'application/json' });
    downloadFile(blob, 'rhize-deployment-config.json');
  });
}

function renderWizard() {
  const container = document.getElementById('wizard-render');
  if (!container) return;

  container.innerHTML = '';

  WizardRenderer.render(container, deploymentDomains, state, (domainId, optionId) => {
    const domain = deploymentDomains.find(d => d.id === domainId);
    if (domain && !domain.allowMultiple) {
      // Single select mode: deselect others
      const current = state.getSelectedOptions(domainId);
      for (const optionId of current) {
        state.deselectOption(domainId, optionId);
      }
    }
    state.toggleOption(domainId, optionId);
  });
}

function updateUI() {
  updateProgress();
  updateValidation();
  renderWizard();
}

function updateProgress() {
  const progressList = document.querySelector('.progress-list');
  if (!progressList) return;

  progressList.innerHTML = deploymentDomains
    .map(domain => {
      const selected = state.getSelectedOptions(domain.id);
      const completed = selected.length > 0;
      return `
        <div class="progress-item ${completed ? 'completed' : 'pending'}">
          ${domain.name}
        </div>
      `;
    })
    .join('');
}

function updateValidation() {
  const validationArea = document.getElementById('validation-area');
  if (!validationArea) return;

  const result = validationEngine.validate(state.getAllSelections());

  let html = '';

  if (result.errors.length > 0) {
    html += `<div class="validation-messages">`;
    result.errors.forEach(err => {
      html += `<div class="message error">❌ ${err.message}</div>`;
    });
    html += `</div>`;
  }

  if (result.warnings.length > 0) {
    html += `<div class="validation-messages" style="margin-top: 12px;">`;
    result.warnings.forEach(warn => {
      html += `<div class="message warning">⚠️ ${warn.message}</div>`;
    });
    html += `</div>`;
  }

  if (result.recommendations.length > 0 && result.errors.length === 0) {
    html += `<div class="validation-messages" style="margin-top: 12px;">`;
    result.recommendations.forEach(rec => {
      html += `<div class="message info">ℹ️ ${rec}</div>`;
    });
    html += `</div>`;
  }

  if (result.errors.length === 0 && result.warnings.length === 0 && result.recommendations.length === 0) {
    html = `<div class="message info">✅ Configuration is valid! You can generate a deployment checklist.</div>`;
  }

  validationArea.innerHTML = html;
}

function loadPreset(presetName: string) {
  const preset = presets[presetName as keyof typeof presets];
  if (preset) {
    state.clear();
    state.fromJSON(preset.snapshot);
  }
}

function resetAll() {
  if (confirm('Reset all selections?')) {
    state.clear();
    StorageManager.clearSnapshot();
  }
}

function showChecklistModal() {
  const result = validationEngine.validate(state.getAllSelections());
  if (!result.valid) {
    alert('Please fix validation errors before generating checklist');
    return;
  }

  const generator = new ChecklistGenerator(state.toJSON());
  const markdown = generator.generateMarkdown();
  const json = generator.generateJSON();

  const markdownTextarea = document.getElementById('checklist-markdown') as HTMLTextAreaElement;
  const jsonTextarea = document.getElementById('checklist-json') as HTMLTextAreaElement;

  if (markdownTextarea) markdownTextarea.value = markdown;
  if (jsonTextarea) jsonTextarea.value = json;

  const modal = document.getElementById('modal-checklist');
  if (modal) modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('modal-checklist');
  if (modal) modal.classList.remove('active');
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

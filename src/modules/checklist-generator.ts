import type { WizardSnapshot, DeploymentOption } from '../types/index.js';
import { deploymentDomains } from '../data/deployment-config.js';

export class ChecklistGenerator {
  private snapshot: WizardSnapshot;
  private domains = deploymentDomains;

  constructor(snapshot: WizardSnapshot) {
    this.snapshot = snapshot;
  }

  generateMarkdown(): string {
    const lines: string[] = [
      '# Rhize Deployment Checklist',
      '',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      '## Selected Configuration',
      '',
    ];

    for (const domain of this.domains) {
      const selectedIds = this.snapshot.selections[domain.id] || [];
      if (selectedIds.length > 0) {
        lines.push(`### ${domain.name}`);
        for (const optionId of selectedIds) {
          const option = domain.options.find(o => o.id === optionId);
          if (option) {
            lines.push(`- **${option.name}** (${option.level})`);
            lines.push(`  - ${option.description}`);
            if (option.helmChart) {
              lines.push(`  - Helm Chart: \`${option.helmChart}:${option.helmVersion || 'latest'}\``);
            }
          }
        }
        lines.push('');
      }
    }

    lines.push('## Deployment Steps', '');
    lines.push('1. **Prepare cluster** - Ensure Kubernetes/infrastructure is ready');
    lines.push('2. **Install storage** - Configure persistent volume provisioning');
    lines.push('3. **Install networking** - Deploy ingress controller');
    lines.push('4. **Install identity** - Set up Keycloak or other IdM');
    lines.push('5. **Install databases** - Deploy PostgreSQL, QuestDB, etc.');
    lines.push('6. **Install messaging** - Deploy Redpanda or Kafka');
    lines.push('7. **Install core services** - Deploy BaaS, ISA95, Admin UI');
    lines.push('8. **Install optional services** - Deploy Appsmith, monitoring, etc.');
    lines.push('9. **Configure networking** - Set up ingress routes and SSL');
    lines.push('10. **Verify deployment** - Health checks and integration tests');
    lines.push('');

    lines.push('## Resource Requirements', '');
    const resources = this.getEstimatedResources();
    lines.push(`- **Total CPU:** ${resources.totalCpu}`);
    lines.push(`- **Total Memory:** ${resources.totalMemory}`);
    if (resources.totalStorage) {
      lines.push(`- **Total Storage:** ${resources.totalStorage}`);
    }
    lines.push('');

    lines.push('## Helm Chart Values Example', '');
    lines.push('```yaml');
    lines.push('# Add Rhize Helm repository');
    lines.push('helm repo add rhize https://gitlab.com/api/v4/projects/42214456/packages/helm/stable');
    lines.push('helm repo update');
    lines.push('');
    lines.push('# Install core services');
    for (const domainId of ['rhize-core-services', 'rhize-optional-services']) {
      const selectedIds = this.snapshot.selections[domainId] || [];
      for (const optionId of selectedIds) {
        const option = this.findOption(optionId);
        if (option?.helmChart) {
          lines.push(`helm install ${optionId} rhize/${option.helmChart} --namespace rhize`);
        }
      }
    }
    lines.push('```');
    lines.push('');

    lines.push('## Documentation Links', '');
    const uniqueDocs = new Set<string>();
    for (const domain of this.domains) {
      const selectedIds = this.snapshot.selections[domain.id] || [];
      for (const optionId of selectedIds) {
        const option = domain.options.find(o => o.id === optionId);
        if (option?.documentationUrl) {
          uniqueDocs.add(option.documentationUrl);
        }
      }
    }
    Array.from(uniqueDocs).forEach(url => {
      lines.push(`- [${url}](${url})`);
    });

    return lines.join('\n');
  }

  generateHTML(): string {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rhize Deployment Checklist</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; color: #333; }
    h1 { color: #1f2937; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    h3 { color: #4b5563; }
    .config-item { background: #f3f4f6; padding: 12px; margin: 8px 0; border-left: 4px solid #3b82f6; }
    .level { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600; }
    .level.preferred { background: #d1fae5; color: #065f46; }
    .level.supported { background: #dbeafe; color: #0c4a6e; }
    .level.suggested { background: #fef3c7; color: #78350f; }
    .level.untested { background: #ede9fe; color: #4c1d95; }
    .helm-command { background: #1f2937; color: #f3f4f6; padding: 12px; border-radius: 4px; overflow-x: auto; font-family: 'Monaco', 'Menlo', monospace; font-size: 13px; }
    .step { padding: 10px; background: #eff6ff; border-left: 4px solid #0284c7; margin: 8px 0; }
    .resources { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .resource-card { background: #f0fdf4; border: 1px solid #86efac; border-radius: 4px; padding: 12px; }
    .resource-label { font-weight: 600; color: #166534; }
    @media (max-width: 768px) { body { padding: 10px; } }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>🚀 Rhize Deployment Checklist</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

  <h2>Selected Configuration</h2>
  ${this.domains
    .map(domain => {
      const selectedIds = this.snapshot.selections[domain.id] || [];
      if (selectedIds.length === 0) return '';
      return `
    <h3>${domain.name}</h3>
    ${selectedIds
      .map(optionId => {
        const option = domain.options.find(o => o.id === optionId);
        if (!option) return '';
        return `
      <div class="config-item">
        <strong>${option.name}</strong> <span class="level ${option.level}">${option.level}</span>
        <p>${option.description}</p>
        ${option.helmChart ? `<small>Helm: <code>${option.helmChart}:${option.helmVersion || 'latest'}</code></small>` : ''}
        ${option.resourceRequirements ? `<small>Resources: ${option.resourceRequirements.cpu}, ${option.resourceRequirements.memory}${option.resourceRequirements.storage ? ', ' + option.resourceRequirements.storage : ''}</small>` : ''}
      </div>
    `;
      })
      .join('')}
  `;
    })
    .filter(x => x)
    .join('')}

  <h2>Deployment Steps</h2>
  ${[
    'Prepare cluster - Ensure Kubernetes/infrastructure is ready',
    'Install storage - Configure persistent volume provisioning',
    'Install networking - Deploy ingress controller',
    'Install identity - Set up Keycloak or other IdM',
    'Install databases - Deploy PostgreSQL, QuestDB, etc.',
    'Install messaging - Deploy Redpanda or Kafka',
    'Install core services - Deploy BaaS, ISA95, Admin UI',
    'Install optional services - Deploy Appsmith, monitoring, etc.',
    'Configure networking - Set up ingress routes and SSL',
    'Verify deployment - Health checks and integration tests',
  ]
    .map(step => `<div class="step"><strong>${step}</strong></div>`)
    .join('')}

  <h2>Estimated Resources</h2>
  <div class="resources">
    ${(() => {
      const resources = this.getEstimatedResources();
      return `
      <div class="resource-card">
        <div class="resource-label">CPU</div>
        <div>${resources.totalCpu}</div>
      </div>
      <div class="resource-card">
        <div class="resource-label">Memory</div>
        <div>${resources.totalMemory}</div>
      </div>
      ${resources.totalStorage ? `
      <div class="resource-card">
        <div class="resource-label">Storage</div>
        <div>${resources.totalStorage}</div>
      </div>
      ` : ''}
    `;
    })()}
  </div>

  <h2>Helm Installation Commands</h2>
  <div class="helm-command">
# Add Rhize Helm repository<br>
helm repo add rhize https://gitlab.com/api/v4/projects/42214456/packages/helm/stable<br>
helm repo update<br>
<br>
# Install services<br>
${this.snapshot.selections['rhize-core-services']
  ?.map(optionId => {
    const option = this.findOption(optionId);
    return option?.helmChart ? `helm install ${optionId} rhize/${option.helmChart} --namespace rhize` : '';
  })
  .filter(x => x)
  .join('<br>')}
  </div>

  <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; font-size: 0.9em; color: #6b7280;">
    For detailed instructions, visit <a href="/docs/deploy">Rhize Deployment Documentation</a>
  </p>
</body>
</html>
    `;
    return html;
  }

  generateJSON(): string {
    return JSON.stringify(
      {
        metadata: {
          generated: new Date().toISOString(),
          version: '1.0.0',
        },
        configuration: this.snapshot.selections,
        estimatedResources: this.getEstimatedResources(),
      },
      null,
      2,
    );
  }

  private getEstimatedResources() {
    let totalCpuCores = 0;
    let totalMemoryGb = 0;
    let totalStorageGb = 0;

    for (const domain of this.domains) {
      const selectedIds = this.snapshot.selections[domain.id] || [];
      for (const optionId of selectedIds) {
        const option = domain.options.find(o => o.id === optionId);
        if (option?.resourceRequirements) {
          if (option.resourceRequirements.cpu) {
            const cpuMatch = option.resourceRequirements.cpu.match(/(\d+(?:\.\d+)?)/);
            if (cpuMatch) totalCpuCores += parseFloat(cpuMatch[1]);
          }
          if (option.resourceRequirements.memory) {
            const memMatch = option.resourceRequirements.memory.match(/(\d+(?:\.\d+)?)/);
            if (memMatch) totalMemoryGb += parseFloat(memMatch[1]);
          }
          if (option.resourceRequirements.storage) {
            const storMatch = option.resourceRequirements.storage.match(/(\d+(?:\.\d+)?)/);
            if (storMatch) totalStorageGb += parseFloat(storMatch[1]);
          }
        }
      }
    }

    return {
      totalCpu: `${totalCpuCores} cores`,
      totalMemory: `${totalMemoryGb} GB`,
      totalStorage: totalStorageGb > 0 ? `${totalStorageGb} GB` : undefined,
    };
  }

  private findOption(optionId: string): DeploymentOption | undefined {
    for (const domain of this.domains) {
      const option = domain.options.find(o => o.id === optionId);
      if (option) return option;
    }
    return undefined;
  }
}

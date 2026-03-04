import type { DeploymentDomain, ValidationResult, ResourceEstimate, ValidationError, ValidationWarning } from '../types/index.js';
import { deploymentDomains } from '../data/deployment-config.js';

export class ValidationEngine {
  private domains: DeploymentDomain[];

  constructor(domains: DeploymentDomain[] = deploymentDomains) {
    this.domains = domains;
  }

  validate(selections: Record<string, string[]>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const recommendations: string[] = [];
    const estimatedResources = this.calculateResources(selections);

    // Check required domains
    for (const domain of this.domains) {
      if (domain.required && (!selections[domain.id] || selections[domain.id].length === 0)) {
        errors.push({
          message: `${domain.name} is required`,
          domainId: domain.id,
        });
      }
    }

    // Check single-select domains
    for (const domain of this.domains) {
      if (!domain.allowMultiple && selections[domain.id] && selections[domain.id].length > 1) {
        errors.push({
          message: `${domain.name} allows only one selection`,
          domainId: domain.id,
        });
      }
    }

    // Check dependencies
    for (const domain of this.domains) {
      const selectedOptionIds = selections[domain.id] || [];
      for (const optionId of selectedOptionIds) {
        const option = domain.options.find(o => o.id === optionId);
        if (option && option.dependencies) {
          for (const depId of option.dependencies) {
            if (!this.isDependencySatisfied(depId, selections)) {
              errors.push({
                message: `${option.name} requires ${this.getOptionName(depId)}`,
                domainId: domain.id,
              });
            }
          }
        }
      }
    }

    // Check conflicts
    for (const domain of this.domains) {
      const selectedOptionIds = selections[domain.id] || [];
      for (const optionId of selectedOptionIds) {
        const option = domain.options.find(o => o.id === optionId);
        if (option && option.conflicts) {
          for (const conflictId of option.conflicts) {
            if (this.isSelected(conflictId, selections)) {
              warnings.push({
                message: `${option.name} may conflict with ${this.getOptionName(conflictId)}`,
                domainId: domain.id,
              });
            }
          }
        }
      }
    }

    // Resource recommendations
    if (estimatedResources.totalCpu && this.parseCpuValue(estimatedResources.totalCpu) > 16) {
      recommendations.push('Your configuration requires significant CPU resources. Ensure your cluster has sufficient capacity.');
    }
    if (estimatedResources.totalMemory && this.parseMemoryValue(estimatedResources.totalMemory) > 32) {
      recommendations.push('Your configuration requires substantial memory. Consider multi-node cluster or managed services.');
    }

    // Storage recommendations
    if (selections['cluster-storage']?.includes('local-path')) {
      warnings.push({
        message: 'Local storage is not recommended for production. Data loss risk if node fails.',
        domainId: 'cluster-storage',
      });
    }

    // LGTM + Storage check
    if (selections['cluster-monitoring']?.includes('lgtm-stack')) {
      const storageOption = selections['cluster-storage']?.[0];
      if (['local-path', 'nfs'].includes(storageOption || '')) {
        warnings.push({
          message: 'LGTM stack requires reliable persistent storage. Consider Ceph or cloud block storage.',
          domainId: 'cluster-monitoring',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations,
      estimatedResources,
    };
  }

  private isDependencySatisfied(dependencyId: string, selections: Record<string, string[]>): boolean {
    // First, check if it's a domain-level dependency (e.g., 'core-database', 'event-streaming')
    for (const domain of this.domains) {
      if (domain.id === dependencyId) {
        // Domain-level dependency: check if domain has ANY selection
        return (selections[domain.id]?.length ?? 0) > 0;
      }
    }

    // Otherwise, treat as option-specific dependency (domain-option format)
    if (dependencyId.includes('-')) {
      const parts = dependencyId.split('-');
      const domainId = parts.slice(0, -1).join('-');
      const optionId = parts[parts.length - 1];

      return selections[domainId]?.includes(optionId) ?? false;
    }

    // For simple option IDs, search all domains
    for (const domain of this.domains) {
      if (selections[domain.id]?.includes(dependencyId)) {
        return true;
      }
    }
    return false;
  }

  private isSelected(optionId: string, selections: Record<string, string[]>): boolean {
    for (const selectedIds of Object.values(selections)) {
      if (selectedIds.includes(optionId)) {
        return true;
      }
    }
    return false;
  }

  private getOptionName(optionId: string): string {
    for (const domain of this.domains) {
      const option = domain.options.find(o => o.id === optionId);
      if (option) return option.name;
    }
    return optionId;
  }

  private calculateResources(selections: Record<string, string[]>): ResourceEstimate {
    let totalCpuCores = 0;
    let totalMemoryGb = 0;
    let totalStorageGb = 0;

    for (const domain of this.domains) {
      const selectedOptionIds = selections[domain.id] || [];
      for (const optionId of selectedOptionIds) {
        const option = domain.options.find(o => o.id === optionId);
        if (option?.resourceRequirements) {
          if (option.resourceRequirements.cpu) {
            totalCpuCores += this.parseCpuValue(option.resourceRequirements.cpu);
          }
          if (option.resourceRequirements.memory) {
            totalMemoryGb += this.parseMemoryValue(option.resourceRequirements.memory);
          }
          if (option.resourceRequirements.storage) {
            totalStorageGb += this.parseStorageValue(option.resourceRequirements.storage);
          }
        }
      }
    }

    return {
      totalCpu: `${totalCpuCores} cores`,
      totalMemory: `${totalMemoryGb}GB`,
      totalStorage: totalStorageGb > 0 ? `${totalStorageGb}GB` : undefined,
    };
  }

  private parseCpuValue(cpu: string): number {
    const match = cpu.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private parseMemoryValue(memory: string): number {
    const match = memory.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private parseStorageValue(storage: string): number {
    const match = storage.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }
}

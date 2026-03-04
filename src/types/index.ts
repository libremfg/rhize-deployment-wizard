export type Level = 'preferred' | 'supported' | 'suggested';

export interface Resources {
  cpu?: string;
  memory?: string;
  storage?: string;
}

export interface DeploymentOption {
  id: string;
  name: string;
  level: Level;
  description: string;
  resourceRequirements?: Resources;
  dependencies?: string[]; // option IDs
  conflicts?: string[];
  helmChart?: string;
  helmVersion?: string;
  documentationUrl?: string;
}

export interface DeploymentDomain {
  id: string;
  name: string;
  description: string;
  required: boolean;
  allowMultiple: boolean;
  options: DeploymentOption[];
}

export interface WizardSnapshot {
  selections: Record<string, string[]>; // domainId -> selectedOptionIds
  timestamp: number;
  version: string;
}

export interface ValidationError {
  message: string;
  domainId: string;
}

export interface ValidationWarning {
  message: string;
  domainId: string;
}

export interface ResourceEstimate {
  totalCpu: string;
  totalMemory: string;
  totalStorage?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
  estimatedResources: ResourceEstimate;
}

export type Observer = (state: WizardState) => void;

export class WizardState {
  private selections: Map<string, Set<string>>;
  private observers: Observer[];

  constructor() {
    this.selections = new Map();
    this.observers = [];
  }

  selectOption(domainId: string, optionId: string): void {
    if (!this.selections.has(domainId)) {
      this.selections.set(domainId, new Set());
    }
    this.selections.get(domainId)!.add(optionId);
    this.notify();
  }

  deselectOption(domainId: string, optionId: string): void {
    const domain = this.selections.get(domainId);
    if (domain) {
      domain.delete(optionId);
      this.notify();
    }
  }

  toggleOption(domainId: string, optionId: string): void {
    if (!this.selections.has(domainId)) {
      this.selections.set(domainId, new Set());
    }
    const domain = this.selections.get(domainId)!;
    if (domain.has(optionId)) {
      domain.delete(optionId);
    } else {
      domain.add(optionId);
    }
    this.notify();
  }

  getSelectedOptions(domainId: string): string[] {
    const domain = this.selections.get(domainId);
    return domain ? Array.from(domain) : [];
  }

  isSelected(domainId: string, optionId: string): boolean {
    const domain = this.selections.get(domainId);
    return domain ? domain.has(optionId) : false;
  }

  subscribe(observer: Observer): void {
    this.observers.push(observer);
  }

  notify(): void {
    this.observers.forEach(observer => observer(this));
  }

  toJSON(): WizardSnapshot {
    const selections: Record<string, string[]> = {};
    this.selections.forEach((options, domainId) => {
      selections[domainId] = Array.from(options);
    });
    return {
      selections,
      timestamp: Date.now(),
      version: '1.0.0',
    };
  }

  fromJSON(snapshot: WizardSnapshot): void {
    this.selections.clear();
    Object.entries(snapshot.selections).forEach(([domainId, optionIds]) => {
      this.selections.set(domainId, new Set(optionIds));
    });
    this.notify();
  }

  clear(): void {
    this.selections.clear();
    this.notify();
  }

  getAllSelections(): Record<string, string[]> {
    const selections: Record<string, string[]> = {};
    this.selections.forEach((options, domainId) => {
      selections[domainId] = Array.from(options);
    });
    return selections;
  }
}

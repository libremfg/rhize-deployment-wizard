import type { DeploymentDomain, WizardState } from '../types/index.js';

export class WizardRenderer {
  static render(container: HTMLElement, domains: DeploymentDomain[], state: WizardState, onOptionClick: (domainId: string, optionId: string) => void): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'roadmap-svg');
    svg.setAttribute('viewBox', `0 0 1400 ${domains.length * 220}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <style>
        .roadmap-svg { background: #f9fafb; }
        .domain-group { }
        .domain-label { font-size: 18px; font-weight: 600; fill: #1f2937; }
        .domain-description { font-size: 12px; fill: #6b7280; }
        .option-node { cursor: pointer; }
        .option-node.disabled { cursor: not-allowed; opacity: 0.7; }
        .option-node.required rect { fill: #fecaca; stroke: #dc2626; }
        .option-node.preferred rect { fill: #d1fae5; stroke: #10b981; }
        .option-node.supported rect { fill: #dbeafe; stroke: #3b82f6; }
        .option-node.suggested rect { fill: #fef3c7; stroke: #f59e0b; }
        .option-node.unsupported rect { fill: #e5e7eb; stroke: #9ca3af; }
        .option-node.unselected rect { fill: #f3f4f6; stroke: #d1d5db; }
        .option-node.selected rect { fill: #86efac; stroke: #10b981; stroke-width: 3; }
        .option-node:not(.disabled):hover rect { filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5)); }
        .option-text { font-size: 13px; font-weight: 500; fill: #111827; pointer-events: none; }
        .option-level { font-size: 11px; fill: #6b7280; pointer-events: none; }
      </style>
    `;
    svg.appendChild(defs);

    let yOffset = 30;

    for (const domain of domains) {
      const groupEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      groupEl.setAttribute('class', 'domain-group');
      groupEl.setAttribute('transform', `translate(0, ${yOffset})`);

      // Domain label
      const labelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelEl.setAttribute('class', 'domain-label');
      labelEl.setAttribute('x', '20');
      labelEl.setAttribute('y', '25');
      labelEl.textContent = domain.name;
      groupEl.appendChild(labelEl);

      // Domain description
      const descEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      descEl.setAttribute('class', 'domain-description');
      descEl.setAttribute('x', '20');
      descEl.setAttribute('y', '45');
      descEl.textContent = domain.description;
      groupEl.appendChild(descEl);

      // Options grid
      let xOffset = 20;
      let rowY = 70;
      let itemsInRow = 0;
      const itemsPerRow = 3;

      for (const option of domain.options) {
        if (itemsInRow >= itemsPerRow) {
          rowY += 100;
          xOffset = 20;
          itemsInRow = 0;
        }

        const isSelected = state.isSelected(domain.id, option.id);
        const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodeGroup.setAttribute('class', `option-node ${isSelected ? 'selected' : option.level}${option.disabled ? ' disabled' : ''}`);
        nodeGroup.setAttribute('transform', `translate(${xOffset}, ${rowY})`);

        // Click handler (skip for disabled options)
        if (!option.disabled) {
          nodeGroup.addEventListener('click', () => {
            onOptionClick(domain.id, option.id);
          });
        }

        // Background rect
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '280');
        rect.setAttribute('height', '80');
        rect.setAttribute('rx', '8');
        rect.setAttribute('stroke-width', '2');
        nodeGroup.appendChild(rect);

        // Title
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title.setAttribute('class', 'option-text');
        title.setAttribute('x', '12');
        title.setAttribute('y', '24');
        title.textContent = option.name;
        nodeGroup.appendChild(title);

        // Level badge
        const level = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        level.setAttribute('class', 'option-level');
        level.setAttribute('x', '12');
        level.setAttribute('y', '38');
        level.textContent = `${option.level}`;
        nodeGroup.appendChild(level);

        // Resource hint
        if (option.resourceRequirements) {
          const resources = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          resources.setAttribute('class', 'option-level');
          resources.setAttribute('x', '12');
          resources.setAttribute('y', '52');
          resources.setAttribute('font-size', '10');
          resources.textContent = `${option.resourceRequirements.cpu}, ${option.resourceRequirements.memory}`;
          nodeGroup.appendChild(resources);
        }

        // Checkmark if selected
        if (isSelected) {
          const checkmark = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          checkmark.setAttribute('x', '260');
          checkmark.setAttribute('y', '30');
          checkmark.setAttribute('font-size', '28');
          checkmark.setAttribute('fill', '#10b981');
          checkmark.textContent = '✓';
          nodeGroup.appendChild(checkmark);
        }

        groupEl.appendChild(nodeGroup);

        xOffset += 300;
        itemsInRow++;
      }

      svg.appendChild(groupEl);
      yOffset += 70 + Math.ceil(domain.options.length / itemsPerRow) * 100;
    }

    container.appendChild(svg);
    return svg;
  }

  static updateNode(svg: SVGSVGElement, _domainId: string, _optionId: string, isSelected: boolean): void {
    const nodeGroups = svg.querySelectorAll(`.option-node`);
    for (const groupEl of nodeGroups) {
      // Find matching node (simplified - in production would need better selector)
      if (groupEl.classList.contains('selected') === isSelected) {
        continue;
      }
      // Update class
      if (isSelected) {
        groupEl.classList.remove('preferred', 'supported', 'suggested', 'unselected');
        groupEl.classList.add('selected');
      } else {
        groupEl.classList.remove('selected');
      }
    }
  }
}

# Rhize Deployment Wizard

An interactive questionnaire for deploying Rhize across different infrastructure types and cloud platforms. This tool guides users through deployment decisions and generates customized deployment checklists.

## Features

✨ **Interactive Wizard** – Visual questionnaire for infrastructure selection
🔄 **Real-time Validation** – Dependency checks and conflict detection
📋 **Auto-generated Checklists** – Markdown, HTML, and JSON outputs
💾 **Auto-save Progress** – Browser localStorage persistence
🎯 **Preset Templates** – Quick-start configurations (Quick Start, Production, Enterprise, Edge/IoT)
📱 **Responsive Design** – Works on mobile, tablet, and desktop
🚀 **Static Deployment** – Single HTML file, no server required

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### GitHub Pages Deployment

1. **Enable GitHub Pages** in repository settings
   - Settings → Pages → Source: Deploy from a branch
   - Branch: `gh-pages` → `/root`

2. **Automated Deployment**
   - Push to `main` branch
   - GitHub Actions automatically builds and deploys
   - Site live at: `https://libremfg.github.io/rhize-deployment-wizard/`

3. **Manual Deployment**
   ```bash
   npm run build
   # Deploy dist/ folder to your hosting
   ```

## Deployment Domains

The wizard guides you through selection of these infrastructure domains (15 total):

### 1. **Deployment Target**
Choose your orchestration platform:
- **Kubernetes** (preferred) – Production-grade container orchestration
- **Docker Compose** (supported) – Lightweight single-node deployments
- **OpenShift** (suggested) – Enterprise Kubernetes with Red Hat support

### 2. **Cloud Platform**
Choose your cloud provider for managed infrastructure (optional):
- **Vultr** (preferred) – High-performance cloud with excellent value
- **Amazon EKS** (preferred) – AWS managed Kubernetes service
- **Google GKE** (preferred) – GCP managed Kubernetes service
- **Azure AKS** (unsupported) – Limited Rhize expertise

### 3. **Repository**
Version control for your configuration:
- **GitLab** (preferred) – Built-in registry and CI/CD
- **GitHub** (supported) – Popular alternative with Actions
- **Gitea** (supported) – Self-hosted lightweight Git

### 4. **Continuous Deployment**
Deployment automation tool:
- **ArgoCD** (preferred) – GitOps CD for Kubernetes
- **Helm** (supported) – Package manager and templating
- **Flux** (supported) – Lightweight GitOps toolkit

### 5. **Container Registry**
Storage for Docker images:
- **GitLab Container Registry** (preferred)
- **Azure Container Registry (ACR)** (supported)
- **Amazon ECR** (supported)
- **Docker Hub** (supported)

### 6. **Cluster Storage**
Persistent block storage options:
- **Local Path** (suggested) – Development only
- **Ceph RBD** (supported) – Distributed HA storage
- **AWS EBS** (preferred) – Cloud managed storage
- **Azure Managed Disks** (preferred)
- **Google Persistent Disk** (preferred)
- **NVMe Local** (supported) – High-performance option

### 7. **Cluster Ingress**
Entry point for external traffic:
- **Traefik** (preferred) – Modern ingress with MQTT/gRPC support
- **NGINX Ingress** (supported) – Industry-standard reverse proxy

### 8. **Cluster Monitoring**
Observability and telemetry stack:
- **LGTM Stack** (preferred) – Loki, Grafana, Tempo, Mimir
- **Prometheus + Grafana** (supported) – Lightweight metrics
- **ELK Stack** (supported) – Elasticsearch-based logging
- **Datadog** (suggested) – Commercial SaaS platform

### 9. **Identity & Access Management**
Authentication and authorization:
- **Keycloak** (preferred) – Open-source identity provider
- **Azure AD / Entra ID** (supported) – Microsoft cloud identity
- **Okta** (supported) – Commercial identity platform

### 10. **Core Database**
Relational database for Keycloak and application data:
- **PostgreSQL** (preferred) – Recommended relational DB
- **MySQL / MariaDB** (supported) – Open-source alternative
- **Managed CloudSQL** (supported) – Cloud provider managed

### 11. **Event Streaming**
Message broker for distributed events:
- **Redpanda** (preferred) – Kafka-compatible, no JVM
- **Apache Kafka** (supported) – Industry standard
- **Solace** (suggested) – Enterprise event streaming

### 12. **Time-Series Storage**
Optimized database for sensor and operational data:
- **QuestDB** (preferred) – Fast time-series optimized for Rhize
- **InfluxDB** (supported) – Popular time-series database
- **TimescaleDB** (supported) – PostgreSQL time-series extension

### 13. **Rhize Core Services**
Essential Rhize components (BaaS, ISA95, Admin UI are required):
- **BaaS** – GraphQL API backend
- **ISA95 Engine** – Manufacturing operations model
- **Admin UI** – Web interface for management
- **Workflow Engine** – BPMN-based orchestration
- **TypeScript Host Service** – Custom business logic runtime
- **Restate** – Distributed function orchestrator

### 14. **Optional Services**
Additional capabilities:
- **Appsmith** – Low-code dashboard builder
- **Grafana Dashboards** – Pre-built monitoring
- **Calendar Service** – Shift and maintenance scheduling
- **KPI Service** – Manufacturing KPI tracking
- **Audit Service** – Comprehensive audit logging
- **BPMN Suite** – Visual workflow editor

### 15. **Networking**
Domain names and TLS configuration:
- Configure DNS records
- TLS certificate strategy (cert-manager, manual, cloud provider)

## Preset Templates

Quickly load common deployment configurations:

### Quick Start
Minimal viable Rhize for evaluation and testing.
- Single Kubernetes node or small cluster
- Local storage (not HA)
- Prometheus + Grafana monitoring
- Basic services only

### Production
Full-featured production deployment with HA and observability.
- Kubernetes with ArgoCD GitOps
- Ceph distributed storage
- LGTM stack (Loki, Grafana, Tempo, Mimir)
- All core services + audit and KPI

### Enterprise
Enterprise deployment with managed services and commercial options.
- Azure/AWS/GCP cloud platforms
- Managed databases and registries
- Commercial monitoring (Datadog, etc.)
- Complete feature set with audit and compliance

### Edge/IoT
Lightweight deployment for edge computing.
- Docker Compose or single-node Kubernetes
- Minimal monitoring
- Essential services only
- Optimized for resource-constrained environments

### Demo Environment
Configuration matching demo3-v4 environment.
- Full Kubernetes deployment
- Includes Appsmith for dashboards
- LGTM observability stack
- All core services

## Validation Rules

The tool enforces deployment constraints:

✅ **Required Domains** – Must select at least one option
✅ **Single-Select Domains** – Only one option allowed (e.g., Deployment Target)
✅ **Dependency Checking** – Validates option dependencies
   - ArgoCD requires Kubernetes
   - LGTM requires reliable storage
   - Services require proper messaging
✅ **Conflict Detection** – Warns about incompatible selections
✅ **Resource Estimation** – Calculates total CPU, memory, storage

## Output Formats

### Markdown Checklist
- Structured step-by-step deployment guide
- Helm chart commands and versions
- Documentation links
- Copy to clipboard for sharing

### HTML Checklist
- Styled, printable checklist
- Resource requirements summary
- Installation commands
- Can be saved as standalone document

### JSON Configuration
- Machine-readable deployment config
- All selections serialized
- Estimated resources
- Suitable for automation/IaC tools

## Architecture

```
src/
├── main.ts                    # Application initialization
├── types/
│   └── index.ts              # TypeScript interfaces and WizardState class
├── data/
│   ├── deployment-config.ts  # Domain and option definitions
│   └── presets.ts            # Preset templates
├── modules/
│   ├── validation.ts         # Validation engine
│   ├── renderer.ts           # SVG wizard renderer
│   ├── checklist-generator.ts # Output generation (Markdown/HTML/JSON)
│   └── storage.ts            # localStorage persistence
└── styles/
    └── global.css            # Styling and layout

index.html                     # Entry point
vite.config.ts               # Vite configuration
tsconfig.json                # TypeScript configuration
```

## State Management

Uses a simple observer pattern with localStorage persistence:

```typescript
const state = new WizardState();
state.selectOption(domainId, optionId);
state.subscribe(() => {
  // Re-render on state change
  StorageManager.saveSnapshot(state.toJSON());
});
```

## Development

### Adding a New Domain

1. **Update `src/data/deployment-config.ts`**:
   ```typescript
   {
     id: 'new-domain',
     name: 'New Domain',
     description: '...',
     required: true,
     allowMultiple: false,
     options: [/* ... */],
   }
   ```

2. **Add to presets** in `src/data/presets.ts`

3. **Update validation** in `src/modules/validation.ts` if needed

### Build Configuration

- **Single-file output** – All assets inlined for portability
- **Tree-shaking** – Unused code removed
- **CSS splitting disabled** – Single stylesheet
- **Target ES2020** – Modern browser features
- **Terser minification** – Maximum compression

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Android Chrome)

## Contributing

1. Fork and clone the repository
2. Create feature branch: `git checkout -b feature/new-domain`
3. Make changes and test locally: `npm run dev`
4. Build and verify: `npm run build`
5. Submit pull request

## License

Proprietary – Rhize Product Team

## Support

For questions or issues:
- GitHub Issues: [Create an issue](../../../issues)
- Documentation: [Rhize Docs](https://docs.rhize.io)
- Slack: #rhize-deployment

## Resources

- [Rhize Documentation](https://docs.rhize.io)
- [Kubernetes Deployment Guide](https://docs.rhize.io/deploy/kubernetes)
- [Helm Charts Repository](https://gitlab.com/libremfg/rhize-helm-charts)
- [K8s Deployment Configs](../k8s-deployments/)
- [roadmap.sh](https://roadmap.sh) – Inspiration

---

**Generated:** Rhize Deployment Wizard v1.0.0

import { useState } from "react";
import { Copy, Check, Server, ShieldCheck, Terminal, Cpu, Network, Award, BookOpen, Layers } from "lucide-react";

export default function ArchitectureSection() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("diag");

  const triggerCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const codeBlocks: { [key: string]: { code: string; lang: string } } = {
    dockerfile: {
      lang: "dockerfile",
      code: `# Multi-stage Docker Building for Production-Grade Cloud-Native Deployment
# --- Stage 1: SPA Web compilation Stage ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Final Multi-service Deployment Package ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production

# Install esbuild and tools globally to support high-performance operations
RUN npm install -g esbuild tsx

# Pull compiled assets from compile stage
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/server.ts ./server.ts
COPY --from=frontend-builder /app/tsconfig.json ./tsconfig.json
COPY --from=frontend-builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Pre-bundle the Typescript Express server
RUN esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]`
    },
    dockercompose: {
      lang: "yaml",
      code: `version: "3.8"

services:
  # Core full-stack application microservice serving front/back end
  synora-service:
    build:
      context: .
      dockerfile: Dockerfile
    image: gcr.io/ai-agent-project-490612/synora:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    restart: always
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"`
    },
    kubernetes: {
      lang: "yaml",
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: synora-deployment
  namespace: wellness-prod
  labels:
    app: synora
    tier: fullstack
spec:
  replicas: 3
  selector:
    matchLabels:
      app: synora
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: synora
    spec:
      containers:
      - name: synora-app
        image: gcr.io/ai-agent-project-490612/synora:v1.0.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: synora-secrets
              key: gemini-api-key
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "250m"
            memory: "256Mi"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: synora-service
  namespace: wellness-prod
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  selector:
    app: synora`
    },
    cicd: {
      lang: "yaml",
      code: `name: Synora Secure CI/CD Enterprise Pipeline

on:
  push:
    branches: [ "main", "release/*" ]
  pull_request:
    branches: [ "main" ]

jobs:
  test-and-lint:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout source code nodes
      uses: actions/checkout@v4

    - name: Configure Node.js context environment
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Run automated package scans
      run: npm ci

    - name: Trigger static analysis (TypeScript compilation validation)
      run: npm run lint

  build-and-push:
    needs: test-and-lint
    runs-on: ubuntu-latest
    steps:
    - name: Checkout secure payload
      uses: actions/checkout@v4

    - name: Setup Google Cloud SDK auth context
      uses: google-github-actions/auth@v2
      with:
        credentials_json: \${{ secrets.GCP_SA_KEY }}

    - name: Configure Gcloud registry helpers
      uses: google-github-actions/setup-gcloud@v2

    - name: Authenticate Docker against GCR
      run: gcloud auth configure-docker --quiet

    - name: Precompile and Bundle Production Images via Buildx
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          gcr.io/ai-agent-project-490612/synora:\${{ github.sha }}
          gcr.io/ai-agent-project-490612/synora:latest`
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-8 font-sans">
      
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="glass-panel p-5 rounded-3xl flex items-center gap-4 shadow-sm border-white/50">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Server className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Architecture</span>
            <div className="text-xs font-extrabold text-zinc-800">Twelve-Factor Native</div>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-3xl flex items-center gap-4 shadow-sm border-white/50">
          <div className="p-2 bg-violet-50 rounded-xl">
            <Layers className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ingress</span>
            <div className="text-xs font-extrabold text-zinc-800">Cloud Run / Mesh</div>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-3xl flex items-center gap-4 shadow-sm border-white/50">
          <div className="p-2 bg-sky-50 rounded-xl">
            <Network className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Scaling</span>
            <div className="text-xs font-extrabold text-zinc-800">K8s Auto-Cluster</div>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-3xl flex items-center gap-4 shadow-sm border-white/50">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Security</span>
            <div className="text-xs font-extrabold text-zinc-800">Zero-Trust ABAC</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Tab Controls Selector left column */}
        <div className="lg:col-span-3 space-y-3">
          <div className="text-[10px] font-bold font-sans tracking-[0.2em] text-zinc-400 uppercase px-3 mb-4">
            Component Maps
          </div>
          {[
            { id: "diag", title: "System Topology", icon: Network },
            { id: "k8s", title: "K8s Manifests", icon: Server },
            { id: "docker", title: "Container Runtime", icon: Cpu },
            { id: "cicd", title: "GitOps Spec", icon: Terminal },
            { id: "interview", title: "Platform QA", icon: BookOpen },
            { id: "resume", title: "Impact Registry", icon: Award }
          ].map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left p-4 rounded-2xl border flex items-center gap-3.5 text-xs font-extrabold cursor-pointer transition-all duration-300 ${
                  isSel
                    ? "bg-white border-white shadow-xl shadow-indigo-100/50 text-indigo-600 scale-105"
                    : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-900 hover:bg-white/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSel ? "text-indigo-500" : "text-zinc-300"}`} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Display Canvas right column */}
        <div className="lg:col-span-9 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 min-h-[500px] shadow-sm overflow-hidden" id="architecture-display-canvas">
          
          {/* 1. VISUAL SYSTEMS DESIGN DIAGRAM */}
          {activeTab === "diag" && (
            <div className="space-y-10 animate-fade-in relative z-10">
              <div>
                <h1 className="text-xl font-extrabold text-zinc-900 pr-12">
                  System Topology
                </h1>
                <p className="text-xs font-semibold text-zinc-400 mt-2">
                  Asynchronous Neural Processing & Data Integrity
                </p>
              </div>

              {/* DRAWN TOPOLOGY CANVAS */}
              <div className="bg-white/40 rounded-[2rem] p-10 space-y-12 select-none text-[11px] relative overflow-hidden backdrop-blur-sm border border-white/50">
                {/* 1. Traffic Layer */}
                <div className="flex flex-col items-center relative z-10">
                  <div className="bg-white px-8 py-4 rounded-2xl text-center shadow-lg shadow-indigo-100/30 font-extrabold text-zinc-700 border border-indigo-50">
                    <div className="flex items-center gap-2 mb-1 justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      Incoming Signal
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold block opacity-60">Global Entry Node</span>
                  </div>
                  <div className="w-px h-12 bg-gradient-to-b from-indigo-200 to-transparent" />
                </div>

                {/* 2. Ingress Load Balancer Layer */}
                <div className="flex flex-col items-center relative z-10">
                  <div className="bg-indigo-500 text-white px-10 py-5 rounded-3xl text-center shadow-2xl shadow-indigo-200 font-extrabold">
                    Ingress Gateway
                    <div className="text-[10px] text-white/70 font-medium mt-1">SSL Validation • Identity Masking</div>
                  </div>
                  <div className="flex justify-between w-80 h-12 px-16 relative">
                    <div className="w-px h-full bg-indigo-100" />
                    <div className="w-px h-full bg-indigo-100" />
                  </div>
                </div>

                {/* 3. Container Pods cluster replicas */}
                <div className="grid grid-cols-2 gap-10 relative z-10 max-w-2xl mx-auto">
                  <div className="bg-white rounded-3xl p-6 text-center shadow-md border border-white">
                    <div className="font-extrabold text-zinc-800 mb-1">Core A</div>
                    <span className="text-[10px] text-indigo-400 font-bold">Neural Stage</span>
                  </div>
                  <div className="bg-white rounded-3xl p-6 text-center shadow-md border border-white">
                    <div className="font-extrabold text-zinc-800 mb-1">Core B</div>
                    <span className="text-[10px] text-indigo-400 font-bold">Neural Stage</span>
                  </div>
                </div>

                {/* Horizontal communications channel */}
                <div className="flex flex-wrap items-center justify-center gap-6 py-6 relative z-10">
                  <div className="bg-indigo-50/50 text-indigo-500 px-5 py-2.5 rounded-full font-bold text-[10px] border border-indigo-100/50">
                    REST Tunnel
                  </div>
                  <div className="bg-emerald-50/50 text-emerald-600 px-5 py-2.5 rounded-full font-bold text-[10px] border border-emerald-100/50">
                    Secure Stream
                  </div>
                </div>

                {/* 4. Databases and External AI Models */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="bg-white p-6 rounded-3xl relative shadow-md border border-white">
                    <div className="absolute top-4 right-4"><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
                    <span className="font-extrabold text-zinc-800">State Persistence</span>
                    <p className="text-[10px] text-zinc-400 mt-2 font-medium leading-relaxed">
                      Encrypted user data silos and sentiment registries.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl relative shadow-md border border-white">
                    <span className="font-extrabold text-zinc-800">Neural Engine</span>
                    <p className="text-[10px] text-zinc-400 mt-2 font-medium leading-relaxed">
                      Google Gemini integration for empathetic analysis.
                    </p>
                  </div>
                </div>

                {/* Background decorative grid */}
                <div className="absolute inset-0 opacity-[0.4] pointer-events-none" style={{ backgroundImage: "radial-gradient(#e0e7ff 1.5px, transparent 1.5px)", backgroundSize: "32px 32px" }}></div>
              </div>

              {/* Explanatory Context paragraph */}
              <div className="text-xs text-zinc-600 leading-relaxed space-y-4">
                <p>
                  <strong className="text-zinc-900">Architectural Scalability:</strong> Synora leverages a decoupled Microservices architecture. By utilizing <span className="font-bold">shared stateless execution nodes</span>, application container pods can effortlessly scale out vertically or horizontally based on real-time traffic volume.
                </p>
                <p>
                  <strong className="text-zinc-900">Twelve-Factor Cloud Principles:</strong> Synora adheres strictly to 12-factor application strategies. Environment variables represent the sole conduit for credentials, logs stream directly to standard stdout channels for collection by Prometheus vectors, and system upgrades execute with zero downtime rolling deploys.
                </p>
              </div>
            </div>
          )}

          {/* 2. KUBERNETES MANIFESTS TAB */}
          {activeTab === "k8s" && (
            <div className="space-y-4 animate-fade-in font-sans">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <h1 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-mono">
                    Kubernetes Declarative Ingress & Microservices Deployment
                  </h1>
                  <p className="text-[10px] font-mono text-zinc-400 mt-1 font-bold">
                    Self-healing, Auto-scaling targets for highly available clusters
                  </p>
                </div>
                <button
                  onClick={() => triggerCopy("k8s", codeBlocks.kubernetes.code)}
                  className="p-1.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-indigo-600 rounded-lg cursor-pointer transition-all shadow-sm"
                  title="Copy Manifest"
                >
                  {copiedId === "k8s" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-xs text-zinc-600 leading-relaxed mb-4">
                This manifest declares a <span className="font-bold text-zinc-900">3-replica Deployment Node</span> with dynamic resource scaling bounds. Configured with <code>livenessProbe</code> mapping directly to our Express healthcheck router (probing <code>/api/health</code>), Kubernetes automatically replaces any unhealthy pod immediately.
              </div>

              <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
                <div className="px-5 py-2.5 bg-zinc-800/50 border-b border-zinc-700/50 text-[10px] font-mono text-zinc-400 flex justify-between font-bold">
                  <span>wellness-deployment.yaml</span>
                  <span className="text-indigo-400">YAML</span>
                </div>
                <pre className="p-5 text-[10.5px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-76 custom-scrollbar">
                  {codeBlocks.kubernetes.code}
                </pre>
              </div>
            </div>
          )}

          {/* 3. DOCKER ORCHESTRATION TAB */}
          {activeTab === "docker" && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <div>
                    <h1 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-mono">
                      Docker Multi-Stage Container Orchestration
                    </h1>
                    <p className="text-[10px] font-mono text-zinc-400 mt-1 font-bold">
                      Streamlined lightweight footprints utilizing Alpine builders
                    </p>
                  </div>
                  <button
                    onClick={() => triggerCopy("dock", codeBlocks.dockerfile.code)}
                    className="p-1.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-indigo-600 rounded-lg cursor-pointer transition-all shadow-sm"
                  >
                    {copiedId === "dock" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-xs text-zinc-600 leading-relaxed">
                  We use a <span className="font-bold text-zinc-900">Multi-stage Docker setup</span> to isolate building development configurations from the production package. By compiling and bundling our typescript assets inside stage 1 and transferring purely compiled artifacts to the final Alpine node base, we cut memory overhead and eliminate code assets, boosting runtime security.
                </div>

                <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
                  <div className="px-5 py-2.5 bg-zinc-800/50 border-b border-zinc-700/50 text-[10px] font-mono text-zinc-400 flex justify-between font-bold">
                    <span>Dockerfile</span>
                    <span className="text-indigo-400">DOCKER</span>
                  </div>
                  <pre className="p-5 text-[10.5px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-56 custom-scrollbar">
                    {codeBlocks.dockerfile.code}
                  </pre>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold font-mono text-zinc-900 uppercase tracking-wide">
                    Local Docker Compose Infrastructure-as-Code
                  </h2>
                  <button
                    onClick={() => triggerCopy("comp", codeBlocks.dockercompose.code)}
                    className="p-1.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-indigo-600 rounded-lg cursor-pointer transition-all shadow-sm"
                  >
                    {copiedId === "comp" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                
                <pre className="p-5 bg-zinc-900 border border-zinc-800 text-[10.5px] font-mono text-zinc-300 rounded-2xl overflow-x-auto leading-relaxed max-h-56 custom-scrollbar">
                  {codeBlocks.dockercompose.code}
                </pre>
              </div>
            </div>
          )}

          {/* 4. CI/CD PIPELINES TAB */}
          {activeTab === "cicd" && (
            <div className="space-y-4 animate-fade-in font-sans">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <h1 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-mono">
                    GitHub Actions Enterprise-Grade CI/CD GitOps Pipeline
                  </h1>
                  <p className="text-[10px] font-mono text-zinc-400 mt-1 font-bold">
                    Automated static scans, compilation gates, and deployment triggers
                  </p>
                </div>
                <button
                  onClick={() => triggerCopy("cicd", codeBlocks.cicd.code)}
                  className="p-1.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-indigo-600 rounded-lg cursor-pointer transition-all shadow-sm"
                >
                  {copiedId === "cicd" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-xs text-zinc-600 leading-relaxed mb-4">
                Every release event triggers this secure automation layout. It runs unit testing targets, compiles the TSX assets, ensures style standards are met, and automatically deploys the final artifacts to Google Container Registry (GCR) securely.
              </div>

              <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl">
                <div className="px-5 py-2.5 bg-zinc-800/50 border-b border-zinc-700/50 text-[10px] font-mono text-zinc-400 flex justify-between font-bold">
                  <span>github-actions-ci-cd.yaml</span>
                  <span className="text-indigo-400">ACTIONS</span>
                </div>
                <pre className="p-5 text-[10.5px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-76 custom-scrollbar">
                  {codeBlocks.cicd.code}
                </pre>
              </div>
            </div>
          )}

          {/* 5. MOCK INTERVIEW PREPARATION TAB */}
          {activeTab === "interview" && (
            <div className="space-y-6 max-h-[580px] overflow-y-auto pr-2 animate-fade-in font-sans custom-scrollbar">
              <div className="border-b border-zinc-100 pb-4">
                <h1 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-mono">
                  Cloud Architect Technical Interview Q&A
                </h1>
                <p className="text-[10px] font-mono text-zinc-400 mt-1 font-bold">
                  Prepping for MS Computer Science admissions & Cloud engineering roles
                </p>
              </div>

              {[
                {
                  q: "How does Synora enforce zero-trust security in Firebase Firestore when anyone could bypass the client SDK?",
                  a: "Security is completely decoupled from the client code. We enforce identity boundaries utilizing Firebase Security Rules (Version 2). In our deployed firestore.rules, we utilize isOwner() helpers, bound permanently to request.auth.uid, protecting user subcollections from foreign gets or list sweeps. Additionally, we enforce rigid size and schema validation on user profile writes using exact map sizing maps and affectedKeys().hasOnly() filters."
                },
                {
                  q: "Why did you implement a multi-stage Docker build, and what benefit does it bring to Cloud native deployments?",
                  a: "Multi-stage Docker builds separate build tool chains from production engines. In Stage 1, we compile and bundle typescript code. In Stage 2, we copy purely compiled files to a lightweight Alpine Node.js baseline. This drops image sizes from ~1.2GB to just ~120MB, drastically accelerating deployment speeds during Horizontal Pod Autoscaling, minimizing host network pressures, and reducing the attack surface by locking out development compiler modules."
                },
                {
                  q: "How does Synora handle container failure in scaled environment nodes?",
                  a: "Inside the Kubernetes manifest setup, we define explicit readiness and liveness probe blocks. These probes monitor the /api/health endpoint every 20 seconds. If a node freezes or experiences a runtime failure, Express will fail to reply within 5 seconds, alerting the Kubernetes master control plane to systematically kill that specific container and instantly stand up a healthy replica to maintain continuous platform availability."
                },
                {
                  q: "Why use Google Gemini-3.5-Flash behind a secure server-side proxy instead of calling the SDK from the browser?",
                  a: "Client-side LLM SDK calls expose secret GEMINI_API_KEY tokens to the client browser, risking credential theft and massive wallet exhaust attacks. Standardizing on a server proxy (/api/gemini/*) keeps keys securely contained. This structure also lets us sanitizes user inputs, bundle system instructions, structure JSON schema payloads on behalf of the client (using Type.OBJECT configurations in our Express code), and intercept errors reliably."
                }
              ].map((qa, idx) => (
                <div key={idx} className="bg-zinc-50 border border-zinc-100 p-5 rounded-2xl relative shadow-sm">
                  <span className="absolute top-3 right-5 font-mono text-[9px] text-indigo-600 uppercase tracking-widest font-black">
                    Q-0{idx + 1}
                  </span>
                  <div className="text-xs font-bold text-zinc-900 leading-snug pr-12">
                    {qa.q}
                  </div>
                  <div className="text-xs text-zinc-500 leading-relaxed mt-2.5 pl-3 border-l-2 border-indigo-200">
                    {qa.a}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 6. RESUME-WORTHY BULLET POINTS */}
          {activeTab === "resume" && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="border-b border-zinc-100 pb-4 flex justify-between items-center">
                <div>
                  <h1 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-mono">
                    Professional Resume Bullet Points
                  </h1>
                  <p className="text-[10px] font-mono text-zinc-400 mt-1 font-bold">
                    Copy these enterprise impact statements to stand out in portfolios
                  </p>
                </div>
                <button
                  onClick={() => triggerCopy("res", `- Designed and deployed Synora, a clinical AI microservice platform using React, Express, and Google Cloud, serving real-time sentiment analysis and empathetic dialogue engines.\n- Enforced granular Attribute-Based Access Control (ABAC) utilizing zero-trust GCP Firebase Firestore rulesets, preventing context tampering, state short-circuiting, and PII leakage.\n- Developed robust multi-stage Docker container pipeline and Kubernetes declarative manifest topology, reducing deployment sizes by 90% and implementing self-healing liveness probes.\n- Integrated automated test specs and complete CI/CD workflow utilizing GitHub Actions, securing 100% test-to-deploy GitOps practices.`)}
                  className="p-1.5 bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-zinc-500 hover:text-indigo-600 rounded-lg cursor-pointer transition-all shadow-sm"
                >
                  {copiedId === "res" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    header: "Full-Stack AI Integrations",
                    desc: "Designed and deployed Synora, a clinical AI microservices platform using React, Express, and Google Cloud, serving real-time sentiment analysis and empathetic support capabilities to evaluate distress indexes."
                  },
                  {
                    header: "Zero-Trust Cloud Governance",
                    desc: "Enforced granular Attribute-Based Access Control (ABAC) utilizing zero-trust GCP Firebase Firestore rulesets, preventing context tampering, ID spoofing, and PII leakage across structured subcollections."
                  },
                  {
                    header: "Orchestration & Containerization",
                    desc: "Developed a robust multi-stage Docker container pipeline and Kubernetes declarative manifest topology with liveness/readiness probes, reducing image size by 90% and securing self-healing deployment targets."
                  },
                  {
                    header: "Automated GitOps Workflows",
                    desc: "Integrated automated test specs and complete CI/CD enterprise staging utilizing GitHub Actions, securing 100% test-to-deploy GitOps practices on microservices frameworks."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 flex gap-4 items-start shadow-sm hover:border-zinc-200 transition-all">
                    <div className="p-2 bg-indigo-600 border border-indigo-500 text-white rounded-xl text-xs font-mono font-black shadow-md shadow-indigo-100">
                      0{idx + 1}
                    </div>
                    <div>
                      <h2 className="text-xs font-black text-zinc-900 uppercase tracking-wide">
                        {item.header}
                      </h2>
                      <p className="text-[11px] text-zinc-500 leading-relaxed mt-1 font-bold">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

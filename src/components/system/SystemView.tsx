import React, { useState } from 'react';
import { HARDWARE_SPEC, VERIFIED_STATUS_ITEMS, REPOSITORY_MODULE_STRUCTURE } from '../../data/researchData';
import { ResearchBadge } from '../common/Badge';
import {
  HardDrive,
  Cpu,
  Server,
  FolderTree,
  FileCode,
  ShieldAlert,
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { apiService } from '../../services/api';

interface SystemViewProps {
  isMockMode: boolean;
  onToggleMockMode: (mock: boolean) => void;
}

export const SystemView: React.FC<SystemViewProps> = ({ isMockMode, onToggleMockMode }) => {
  const [testEndpoint, setTestEndpoint] = useState<string>('/api/system');
  const [apiResponseText, setApiResponseText] = useState<string>('Click "Send API Request" to test endpoint response.');
  const [backendUrlInput, setBackendUrlInput] = useState<string>(apiService.getBackendUrl());

  const handleTestApi = async () => {
    setApiResponseText('Querying endpoint...');
    if (testEndpoint === '/api/models') {
      const res = await apiService.getModels();
      setApiResponseText(JSON.stringify(res, null, 2));
    } else if (testEndpoint === '/api/system') {
      const res = await apiService.getSystem();
      setApiResponseText(JSON.stringify(res, null, 2));
    } else if (testEndpoint === '/api/experiments') {
      const res = await apiService.getExperiments();
      setApiResponseText(JSON.stringify(res, null, 2));
    } else if (testEndpoint === '/api/stages') {
      const res = await apiService.getStages();
      setApiResponseText(JSON.stringify(res, null, 2));
    } else if (testEndpoint === '/api/results') {
      const res = await apiService.getResults();
      setApiResponseText(JSON.stringify(res, null, 2));
    }
  };

  const handleSaveBackendUrl = () => {
    apiService.setBackendUrl(backendUrlInput);
  };

  return (
    <div id="system-view" className="space-y-6">
      <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
              Infrastructure &amp; Repository Map
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono">
              Hardware Verified
            </span>
          </div>
          <h2 className="text-lg font-bold text-neutral-100">System Hardware, Modules &amp; REST Contract</h2>
          <p className="text-xs text-neutral-400 mt-0.5 max-w-2xl">
            Local RTX 3050 execution profiles, repository module topology, and REST API specification for backend connection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleMockMode(!isMockMode)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold border transition-all ${
              isMockMode
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {isMockMode ? 'Mock Adapter (Demo Mode)' : 'Connected to Python REST'}
          </button>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/50 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Hardware Execution Environments</span>
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-semibold">
            Recommended Strategy: HYBRID
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-200 font-bold text-sm">LOCAL MODE</span>
              <ResearchBadge status="VERIFIED" size="sm" />
            </div>
            <div className="text-[11px] text-cyan-400 font-semibold">
              {HARDWARE_SPEC.gpuName}
            </div>
            <div className="space-y-1.5 text-[11px] text-neutral-400 font-sans">
              <div className="flex justify-between font-mono"><span>VRAM:</span><span className="text-neutral-200">6.0 GB (Peak Limit)</span></div>
              <div className="flex justify-between font-mono"><span>Host RAM:</span><span className="text-neutral-200">16.0 GB</span></div>
              <div className="flex justify-between font-mono"><span>Driver / CUDA:</span><span className="text-neutral-200">535.183 / CUDA 12.1</span></div>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 font-sans leading-relaxed">
              <strong>Permitted Workloads:</strong> Model architecture loading, forward activations, lightweight smoke tests, and AWQ layer replacement verification.
            </div>
          </div>

          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-200 font-bold text-sm">CLOUD GPU</span>
              <ResearchBadge status="PENDING" size="sm" />
            </div>
            <div className="text-[11px] text-purple-400 font-semibold">
              NVIDIA A100 (40GB) / T4 Remote Worker
            </div>
            <div className="space-y-1.5 text-[11px] text-neutral-400 font-sans">
              <div className="flex justify-between font-mono"><span>Target VRAM:</span><span className="text-neutral-200">&gt; 16.0 GB</span></div>
              <div className="flex justify-between font-mono"><span>Host RAM:</span><span className="text-neutral-200">32+ GB</span></div>
              <div className="flex justify-between font-mono"><span>Remote Execution:</span><span className="text-neutral-200">SSH / RunPod / Colab Pro</span></div>
            </div>
            <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-neutral-400 font-sans leading-relaxed">
              <strong>Permitted Workloads:</strong> Full multimodal recovery training (LoRA/Fine-tuning), multi-thousand image POPE/ScienceQA evaluation passes.
            </div>
          </div>

          <div className="p-4 rounded-xl border border-cyan-500/40 bg-neutral-900/90 shadow-[0_0_20px_rgba(6,182,212,0.1)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-bold text-sm">HYBRID MODE ★</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                RECOMMENDED
              </span>
            </div>
            <div className="text-[11px] text-neutral-200 font-semibold">
              Local Prototyping + Cloud Batch Scaling
            </div>
            <div className="pt-1 text-[11px] text-neutral-300 font-sans leading-relaxed">
              Enables local development, code iteration, calibration inspection, and smoke testing on the local RTX 3050, while dispatching heavy multimodal recovery checkpoints and downstream benchmark suites to cloud workers without re-engineering the pipeline.
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/50 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-cyan-400" />
              <span>Implementation Architecture &amp; Module Map</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Source-of-truth repository directory structure for LLM-Pruner, VLM, and AWQ components.
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-500">Source of Truth Repository</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono text-xs">
          {REPOSITORY_MODULE_STRUCTURE.map((mod, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/70 space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>{mod.name}</span>
              </div>
              <p className="font-sans text-xs text-neutral-400 leading-snug">{mod.description}</p>
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                {mod.files.map((f, fIdx) => (
                  <div key={fIdx} className="p-2 rounded bg-neutral-900 border border-neutral-850 space-y-0.5">
                    <div className="text-neutral-200 font-semibold text-[11px]">{f.name}</div>
                    <div className="font-sans text-[11px] text-neutral-500 leading-tight">{f.role}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/50 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>REST API Contract Specification &amp; Endpoint Console</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Clean separation of frontend interface from Python backend execution harness.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/60 space-y-2">
              <label className="block text-neutral-400 text-[11px]">Backend Target URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={backendUrlInput}
                  onChange={e => setBackendUrlInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleSaveBackendUrl}
                  className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-neutral-500 text-[11px] uppercase tracking-wider block px-1">
                Select API Route to Ping
              </span>
              {[
                { method: 'GET', path: '/api/models', desc: 'Retrieve model architecture and layer metadata' },
                { method: 'GET', path: '/api/system', desc: 'Retrieve host GPU, VRAM, and CUDA status' },
                { method: 'GET', path: '/api/experiments', desc: 'List configured experiment runs' },
                { method: 'GET', path: '/api/stages', desc: 'Get live 10-stage execution status' },
                { method: 'GET', path: '/api/results', desc: 'Fetch comparative metrics matrix' }
              ].map(r => (
                <button
                  key={r.path}
                  onClick={() => setTestEndpoint(r.path)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors flex items-center justify-between ${
                    testEndpoint === r.path
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'border-neutral-800 text-neutral-400 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-300 font-bold">
                      {r.method}
                    </span>
                    <span className="font-semibold text-neutral-200">{r.path}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              id="btn-test-api"
              onClick={handleTestApi}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold font-mono transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Send Request to {testEndpoint}</span>
            </button>
          </div>

          <div className="lg:col-span-7">
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 font-mono text-xs flex flex-col h-full min-h-[260px]">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-850 text-[11px] text-neutral-500 mb-2">
                <span>Response Payload Inspector</span>
                <span className="text-cyan-400">{apiService.getMode()}</span>
              </div>
              <pre className="text-neutral-300 flex-1 overflow-auto max-h-[300px] text-[11px] leading-relaxed scrollbar-thin">
                {apiResponseText}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import {
  ModelSpecification,
  HardwareSpec,
  ExperimentConfig,
  PipelineStageInfo,
  LogEntry,
  ModelComparisonRow
} from '../types/research';
import {
  BUNNY_MODEL_SPEC,
  HARDWARE_SPEC,
  INITIAL_EXPERIMENTS,
  INITIAL_PIPELINE_STAGES,
  INITIAL_LOGS,
  MODEL_COMPARISON_DATA
} from '../data/researchData';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  mode: 'LIVE_BACKEND' | 'DEMO_MOCK';
  timestamp: string;
  error?: string;
}

class ResearchApiService {
  private backendUrl: string = 'http://localhost:8000';
  private useMock: boolean = true;
  private experiments: ExperimentConfig[] = [...INITIAL_EXPERIMENTS];
  private stages: PipelineStageInfo[] = JSON.parse(JSON.stringify(INITIAL_PIPELINE_STAGES));
  private logs: LogEntry[] = [...INITIAL_LOGS];
  private isRunning: boolean = false;
  private runningTimer: any = null;
  private logSubscribers: ((newLog: LogEntry) => void)[] = [];
  private stageSubscribers: ((stages: PipelineStageInfo[]) => void)[] = [];

  public getMode(): 'LIVE_BACKEND' | 'DEMO_MOCK' {
    return this.useMock ? 'DEMO_MOCK' : 'LIVE_BACKEND';
  }

  public setBackendUrl(url: string): void {
    this.backendUrl = url;
  }

  public getBackendUrl(): string {
    return this.backendUrl;
  }

  public setMockMode(enable: boolean): void {
    this.useMock = enable;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public clearLogs(): void {
    this.logs = [];
    this.stageSubscribers.forEach(() => {});
  }

  public subscribeLogs(callback: (newLog: LogEntry) => void): () => void {
    this.logSubscribers.push(callback);
    return () => {
      this.logSubscribers = this.logSubscribers.filter(cb => cb !== callback);
    };
  }

  public subscribeStages(callback: (stages: PipelineStageInfo[]) => void): () => void {
    this.stageSubscribers.push(callback);
    return () => {
      this.stageSubscribers = this.stageSubscribers.filter(cb => cb !== callback);
    };
  }

  private emitLog(log: LogEntry): void {
    this.logs.push(log);
    this.logSubscribers.forEach(cb => cb(log));
  }

  private emitStages(): void {
    const cloned = JSON.parse(JSON.stringify(this.stages));
    this.stageSubscribers.forEach(cb => cb(cloned));
  }

  public async getModels(): Promise<ApiResponse<ModelSpecification[]>> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${this.backendUrl}/api/models`);
        if (res.ok) {
          const data = await res.json();
          return { success: true, data, mode: 'LIVE_BACKEND', timestamp: new Date().toISOString() };
        }
      } catch {
        // fall back to mock
      }
    }
    return {
      success: true,
      data: [BUNNY_MODEL_SPEC],
      mode: 'DEMO_MOCK',
      timestamp: new Date().toISOString()
    };
  }

  public async getSystem(): Promise<ApiResponse<HardwareSpec>> {
    if (!this.useMock) {
      try {
        const res = await fetch(`${this.backendUrl}/api/system`);
        if (res.ok) {
          const data = await res.json();
          return { success: true, data, mode: 'LIVE_BACKEND', timestamp: new Date().toISOString() };
        }
      } catch {
        // fall back to mock
      }
    }
    return {
      success: true,
      data: HARDWARE_SPEC,
      mode: 'DEMO_MOCK',
      timestamp: new Date().toISOString()
    };
  }

  public async getExperiments(): Promise<ApiResponse<ExperimentConfig[]>> {
    return {
      success: true,
      data: [...this.experiments],
      mode: this.getMode(),
      timestamp: new Date().toISOString()
    };
  }

  public async getExperimentById(id: string): Promise<ApiResponse<ExperimentConfig | null>> {
    const exp = this.experiments.find(e => e.id === id) || null;
    return {
      success: !!exp,
      data: exp,
      mode: this.getMode(),
      timestamp: new Date().toISOString()
    };
  }

  public async createExperiment(config: Omit<ExperimentConfig, 'id' | 'createdAt'>): Promise<ApiResponse<ExperimentConfig>> {
    const newId = `EXP-${String(this.experiments.length + 1).padStart(4, '0')}`;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newExp: ExperimentConfig = {
      ...config,
      id: newId,
      createdAt: formattedDate
    };
    this.experiments.unshift(newExp);
    this.emitLog({
      id: `log-${Date.now()}`,
      timestamp: now.toTimeString().split(' ')[0],
      level: 'INFO',
      stage: 'Experiment Manager',
      message: `[${this.getMode()}] Experiment created: ${newId} (${newExp.name}) with ${newExp.quantization.method}`
    });
    return {
      success: true,
      data: newExp,
      mode: this.getMode(),
      timestamp: new Date().toISOString()
    };
  }

  public async runExperiment(id: string = 'EXP-0001'): Promise<ApiResponse<{ status: string }>> {
    if (this.isRunning) {
      return {
        success: false,
        data: { status: 'already_running' },
        mode: this.getMode(),
        timestamp: new Date().toISOString(),
        error: 'An experiment execution is currently in progress.'
      };
    }

    this.isRunning = true;
    const now = new Date().toTimeString().split(' ')[0];
    this.emitLog({
      id: `log-${Date.now()}`,
      timestamp: now,
      level: 'INFO',
      stage: 'Runner',
      message: `[${this.getMode()}] Execution started for experiment ${id}. Pipeline sequence initialized.`
    });

    let currentStageIndex = 0;
    this.stages.forEach(st => {
      st.status = 'pending';
      st.progress = 0;
    });
    this.emitStages();

    const stageMessages: Record<number, string[]> = {
      1: ['Loading SigLIP vision transformer', 'Mapping Phi-2 causal weights', 'Model weights bound in device memory'],
      2: ['Loading calibration multimodal subset', 'Collecting forward activations across layers', 'Calibration matrix recorded'],
      3: ['Estimating first-order Taylor sensitivities', 'Mapping inter-layer tensor dependencies', 'Importance ranking established'],
      4: ['Removing low-importance channel structures', 'Resizing intermediate weight matrices', 'Structural pruning step completed'],
      5: ['Checking VRAM headroom for multimodal recovery', 'Local RTX 3050 6GB constraint reached; proceeding via simulated Cloud worker'],
      6: ['Executing AWQ per-channel scale search', 'Minimizing activation-aware quantization error', 'Optimal channel scales identified'],
      7: ['Replacing Linear modules with packed INT4 kernels', 'Quantizing weights to 4-bit with group_size=128', 'AWQ packing finished'],
      8: ['Serializing pruned + quantized weights', 'Writing checkpoint metadata to disk', 'Checkpoint bundle export finished'],
      9: ['Simulating hardware latency benchmark', 'Measuring tokens per second and peak memory footprint'],
      10: ['Initiating downstream benchmark harness', 'Reporting POPE hallucination and ScienceQA scores', 'Evaluation finished']
    };

    const advanceStage = () => {
      if (!this.isRunning) return;

      if (currentStageIndex < this.stages.length) {
        const stage = this.stages[currentStageIndex];
        stage.status = 'running';
        stage.progress = 35;
        this.emitStages();

        const msgs = stageMessages[stage.id] || ['Processing stage tasks'];
        msgs.forEach((m, idx) => {
          setTimeout(() => {
            if (!this.isRunning) return;
            const logTime = new Date().toTimeString().split(' ')[0];
            this.emitLog({
              id: `log-${Date.now()}-${idx}`,
              timestamp: logTime,
              level: idx === msgs.length - 1 ? 'SUCCESS' : 'INFO',
              stage: stage.name,
              message: `[DEMO SIMULATION] ${m}`
            });
            stage.progress = Math.min(100, Math.round(((idx + 1) / msgs.length) * 100));
            if (idx === msgs.length - 1) {
              stage.status = 'completed';
              stage.runtime = `${(Math.random() * 10 + 5).toFixed(1)}s`;
              stage.researchStatus = 'DEMO';
            }
            this.emitStages();
          }, (idx + 1) * 700);
        });

        this.runningTimer = setTimeout(() => {
          currentStageIndex++;
          advanceStage();
        }, msgs.length * 700 + 400);
      } else {
        this.isRunning = false;
        const endTime = new Date().toTimeString().split(' ')[0];
        this.emitLog({
          id: `log-${Date.now()}`,
          timestamp: endTime,
          level: 'SUCCESS',
          stage: 'Runner',
          message: `[DEMO SIMULATION] Experiment ${id} pipeline execution run completed. Notice: Metrics from this run are marked as DEMO.`
        });
      }
    };

    advanceStage();

    return {
      success: true,
      data: { status: 'started' },
      mode: this.getMode(),
      timestamp: new Date().toISOString()
    };
  }

  public async stopExperiment(id: string = 'EXP-0001'): Promise<ApiResponse<{ status: string }>> {
    if (this.runningTimer) {
      clearTimeout(this.runningTimer);
      this.runningTimer = null;
    }
    this.isRunning = false;
    const now = new Date().toTimeString().split(' ')[0];
    this.emitLog({
      id: `log-${Date.now()}`,
      timestamp: now,
      level: 'WARNING',
      stage: 'Runner',
      message: `[${this.getMode()}] Experiment ${id} stopped by user request.`
    });
    this.stages.forEach(st => {
      if (st.status === 'running') {
        st.status = 'failed';
      }
    });
    this.emitStages();
    return {
      success: true,
      data: { status: 'stopped' },
      mode: this.getMode(),
      timestamp: new Date().toISOString()
    };
  }

  public resetPipeline(): void {
    if (this.runningTimer) {
      clearTimeout(this.runningTimer);
      this.runningTimer = null;
    }
    this.isRunning = false;
    this.stages = JSON.parse(JSON.stringify(INITIAL_PIPELINE_STAGES));
    this.emitStages();
    const now = new Date().toTimeString().split(' ')[0];
    this.emitLog({
      id: `log-${Date.now()}`,
      timestamp: now,
      level: 'INFO',
      stage: 'Pipeline',
      message: 'Pipeline state reset to initial verified baseline status.'
    });
  }

  public async getLogs(): Promise<ApiResponse<LogEntry[]>> {
    return {
      success: true,
      data: [...this.logs],
      mode: this.getMode(),
      timestamp: new Date().toISOString()
    };
  }

  public async getStages(): Promise<ApiResponse<PipelineStageInfo[]>> {
    return {
      success: true,
      data: JSON.parse(JSON.stringify(this.stages)),
      mode: this.getMode(),
      timestamp: new Date().toISOString()
    };
  }

  public async getResults(): Promise<ApiResponse<ModelComparisonRow[]>> {
    return {
      success: true,
      data: MODEL_COMPARISON_DATA,
      mode: this.getMode(),
      timestamp: new Date().toISOString()
    };
  }

  public exportExperimentBundle(experimentId: string): string {
    const exp = this.experiments.find(e => e.id === experimentId) || this.experiments[0];
    const exportObject = {
      project: 'Enhancing Structured Pruning with Activation-Aware Weight Quantization (AWQ) for Efficient Large Vision-Language Models',
      exportedAt: new Date().toISOString(),
      experiment: exp,
      stages: this.stages,
      comparisonBaseline: MODEL_COMPARISON_DATA,
      hardware: HARDWARE_SPEC,
      researchIntegrityNotice: 'This exported configuration represents verified experimental state and simulated run metrics explicitly tagged with DEMO / PENDING status where evaluations have not yet run.'
    };
    return JSON.stringify(exportObject, null, 2);
  }
}

export const apiService = new ResearchApiService();

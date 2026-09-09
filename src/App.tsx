import React, { useState, useEffect } from 'react';
import { ViewMode, PipelineStageInfo, LogEntry } from './types/research';
import { apiService } from './services/api';
import { Sidebar } from './components/navigation/Sidebar';
import { Header } from './components/navigation/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { ExperimentsView } from './components/experiments/ExperimentsView';
import { PipelineView } from './components/pipeline/PipelineView';
import { ModelsView } from './components/models/ModelsView';
import { QuantizationView } from './components/quantization/QuantizationView';
import { BenchmarksView } from './components/benchmarks/BenchmarksView';
import { ResultsView } from './components/results/ResultsView';
import { SystemView } from './components/system/SystemView';
import { ResearchNotesView } from './components/notes/ResearchNotesView';
import { PresentationMode } from './components/presentation/PresentationMode';
import { TerminalViewer } from './components/common/TerminalViewer';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);
  const [stages, setStages] = useState<PipelineStageInfo[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionMode, setExecutionMode] = useState<'HYBRID' | 'LOCAL' | 'CLOUD'>('HYBRID');
  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState<boolean>(false);
  const [selectedStage, setSelectedStage] = useState<PipelineStageInfo | null>(null);

  useEffect(() => {
    const initData = async () => {
      const fetchedStages = await apiService.getStages();
      setStages(fetchedStages.data);
      const fetchedLogs = await apiService.getLogs();
      setLogs(fetchedLogs.data);
      setIsRunning(apiService.getIsRunning());
      setIsMockMode(apiService.getMode() === 'DEMO_MOCK');
    };

    initData();

    const unsubStages = apiService.subscribeStages((updatedStages) => {
      setStages([...updatedStages]);
      setIsRunning(apiService.getIsRunning());
    });

    const unsubLogs = apiService.subscribeLogs((newLog) => {
      setLogs(prev => [...prev, newLog]);
    });

    return () => {
      unsubStages();
      unsubLogs();
    };
  }, []);

  const handleRunExperiment = async (config?: any) => {
    if (isRunning) {
      await apiService.stopExperiment();
      setIsRunning(false);
    } else {
      setIsRunning(true);
      const expId = typeof config === 'string' ? config : (config?.id || 'EXP-0001');
      await apiService.runExperiment(expId);
    }
  };

  const handleClearLogs = () => {
    apiService.clearLogs();
    setLogs([]);
  };

  const handleToggleMockMode = (mock: boolean) => {
    apiService.setMockMode(mock);
    setIsMockMode(mock);
  };

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        isRunning={isRunning}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          isRunning={isRunning}
          executionMode={executionMode}
          onToggleExecutionMode={setExecutionMode}
          onRunExperiment={() => handleRunExperiment()}
          onOpenPresentation={() => setIsPresentationOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeView === 'dashboard' && (
              <DashboardView
                stages={stages}
                logs={logs}
                isRunning={isRunning}
                onRunExperiment={() => handleRunExperiment()}
                onSelectStage={(stage) => {
                  setSelectedStage(stage);
                  setActiveView('pipeline');
                }}
                onNavigateView={setActiveView}
              />
            )}

            {activeView === 'experiments' && (
              <ExperimentsView
                isRunning={isRunning}
                onRunExperiment={handleRunExperiment}
              />
            )}

            {activeView === 'pipeline' && (
              <PipelineView
                stages={stages}
                onSelectStage={setSelectedStage}
              />
            )}

            {activeView === 'models' && (
              <ModelsView />
            )}

            {activeView === 'quantization' && (
              <QuantizationView />
            )}

            {activeView === 'benchmarks' && (
              <BenchmarksView
                isRunning={isRunning}
                onRunBenchmarkDemo={() => handleRunExperiment({ name: 'Multimodal Benchmark Suite' })}
              />
            )}

            {activeView === 'results' && (
              <ResultsView />
            )}

            {activeView === 'system' && (
              <SystemView
                isMockMode={isMockMode}
                onToggleMockMode={handleToggleMockMode}
              />
            )}

            {activeView === 'notes' && (
              <ResearchNotesView />
            )}
          </div>
        </main>

        <div className="border-t border-neutral-800 bg-neutral-950">
          <div className="px-4 py-2 border-b border-neutral-850 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-neutral-400">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-neutral-200">Execution Telemetry Stream</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                {logs.length} events
              </span>
            </div>

            <button
              onClick={() => setIsTerminalCollapsed(prev => !prev)}
              className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200"
            >
              <span>{isTerminalCollapsed ? 'Expand Telemetry' : 'Collapse Telemetry'}</span>
              {isTerminalCollapsed ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {!isTerminalCollapsed && (
            <div className="p-3 bg-neutral-950">
              <TerminalViewer
                logs={logs}
                onClear={handleClearLogs}
                maxHeight="160px"
              />
            </div>
          )}
        </div>
      </div>

      {isPresentationOpen && (
        <PresentationMode
          onClose={() => setIsPresentationOpen(false)}
          onNavigateView={(view) => {
            setActiveView(view);
            setIsPresentationOpen(false);
          }}
        />
      )}
    </div>
  );
}

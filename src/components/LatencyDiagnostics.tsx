import React, { useState, useMemo } from 'react';
import {
  Zap,
  Clock,
  Activity,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sliders,
  Layers,
  ArrowRight,
  Search,
  RotateCcw,
  Info,
  ShieldAlert,
  Gauge,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  TradeLatencyAudit,
  LatencyTelemetrySummary,
  RootCauseDiagnosis,
} from '../types/trading';

interface LatencyDiagnosticsProps {
  audits: TradeLatencyAudit[];
  summary: LatencyTelemetrySummary;
  isBotRunning: boolean;
  activeSymbol: string;
  onClearAudits?: () => void;
  onAdjustStrategySL?: (newAtrMultiplier: number) => void;
}

export const LatencyDiagnostics: React.FC<LatencyDiagnosticsProps> = ({
  audits,
  summary,
  isBotRunning,
  activeSymbol,
  onClearAudits,
  onAdjustStrategySL,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [simulatedLatency, setSimulatedLatency] = useState<number>(0);
  const [simulatedAtrBuffer, setSimulatedAtrBuffer] = useState<number>(1.5);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAudits = useMemo(() => {
    return audits.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tradeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.rootCause.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filterType === 'ALL') return true;
      if (filterType === 'RAPID_EXITS') return item.holdingDurationSeconds < 15 && item.exitReason === 'STOP_LOSS';
      if (filterType === 'SLIPPAGE') return item.rootCause === 'NETWORK_SLIPPAGE';
      if (filterType === 'JITTER') return item.rootCause === 'CALCULATION_JITTER';
      if (filterType === 'FLAWED_LOGIC') return item.rootCause === 'FLAWED_LOGIC';
      if (filterType === 'PROFIT') return item.exitReason === 'TAKE_PROFIT' || item.pnl > 0;
      return true;
    });
  }, [audits, filterType, searchTerm]);

  const selectedAudit = useMemo(() => {
    if (!selectedAuditId && audits.length > 0) return audits[0];
    return audits.find((a) => a.tradeId === selectedAuditId) || (audits.length > 0 ? audits[0] : null);
  }, [audits, selectedAuditId]);

  const getRootCauseBadge = (cause: RootCauseDiagnosis) => {
    switch (cause) {
      case 'NETWORK_SLIPPAGE':
        return {
          label: 'NETWORK SLIPPAGE',
          color: 'bg-[#F59E0B20] text-[#F59E0B] border-[#F59E0B50]',
          icon: <Wifi className="w-3 h-3 text-[#F59E0B]" />,
          desc: 'Deviasi harga eksekusi akibat latensi transit API',
        };
      case 'CALCULATION_JITTER':
        return {
          label: 'CALCULATION JITTER',
          color: 'bg-[#8B5CF620] text-[#A78BFA] border-[#8B5CF650]',
          icon: <Activity className="w-3 h-3 text-[#A78BFA]" />,
          desc: 'Buffer SL ATR terlalu sempit terpicu noise mikro 1.5s',
        };
      case 'FLAWED_LOGIC':
        return {
          label: 'FLAWED LOGIC / CHOP',
          color: 'bg-[#EF444420] text-[#EF4444] border-[#EF444450]',
          icon: <AlertTriangle className="w-3 h-3 text-[#EF4444]" />,
          desc: 'Sinyal counter-trend tanpa konfirmasi orderbook depth',
        };
      case 'NATURAL_VOLATILITY':
        return {
          label: 'NATURAL VOLATILITY',
          color: 'bg-[#3B82F620] text-[#60A5FA] border-[#3B82F650]',
          icon: <ShieldAlert className="w-3 h-3 text-[#60A5FA]" />,
          desc: 'Eksekusi & parameter sehat; pergerakan candle normal',
        };
      case 'PROFIT_TARGET_HIT':
        return {
          label: 'TARGET ACHIEVED',
          color: 'bg-[#10B98120] text-[#10B981] border-[#10B98150]',
          icon: <CheckCircle2 className="w-3 h-3 text-[#10B981]" />,
          desc: 'Eksekusi optimal tanpa hambatan latensi',
        };
      default:
        return {
          label: 'NORMAL',
          color: 'bg-[#6B728020] text-[#8B949E] border-[#6B728050]',
          icon: <Info className="w-3 h-3" />,
          desc: 'Normal trade execution',
        };
    }
  };

  const getLatencyTier = (totalMs: number) => {
    if (totalMs < 40) return { label: 'ULTRA-LOW LATENCY', color: 'text-[#10B981]', bg: 'bg-[#10B981]' };
    if (totalMs < 120) return { label: 'NOMINAL WEB API', color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]' };
    if (totalMs < 280) return { label: 'MODERATE TRANSIT', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]' };
    return { label: 'HIGH JITTER DELAY', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]' };
  };

  return (
    <div className="space-y-4 font-sans text-white">
      {/* 1. Header Hero Banner */}
      <div className="bg-[#0D1117] border border-[#2D333B] rounded-lg p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#3B82F610] to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-[#8B5CF620] text-[#A78BFA] border border-[#8B5CF640]">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                  LATENCY & EXECUTION DIAGNOSTICS ENGINE
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#3B82F620] text-[#3B82F6] border border-[#3B82F640]">
                  T0 → T1 → T2 → T3 PIPELINE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-[#8B949E] font-mono mt-0.5">
                Membedah akar penyebab siklus Stop Loss cepat: Network Slippage vs Calculation Jitter vs Flawed Logic vs Volatilitas Nyata.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onClearAudits && (
              <button
                onClick={onClearAudits}
                className="px-2.5 py-1 text-xs font-mono rounded bg-[#21262D] hover:bg-[#30363D] text-[#8B949E] hover:text-white border border-[#30363D] transition-colors cursor-pointer flex items-center space-x-1.5"
                title="Reset seluruh riwayat audit latensi"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET AUDIT</span>
              </button>
            )}
            <div className="flex items-center space-x-2 px-3 py-1 bg-[#161B22] rounded border border-[#2D333B] text-xs font-mono">
              <span className="text-[#8B949E]">STATUS BOT:</span>
              <span className={`font-bold flex items-center space-x-1 ${isBotRunning ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isBotRunning ? 'bg-[#10B981] animate-pulse' : 'bg-[#EF4444]'}`} />
                <span>{isBotRunning ? 'PROFILING ACTIVE' : 'IDLE'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards: Execution Deltas & Root Cause Verdict */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
        {/* Card 1: Total End-to-End Latency */}
        <div className="bg-[#161B22] p-3.5 rounded-lg border border-[#2D333B] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8B949E] uppercase font-bold tracking-wider">
              AVG TOTAL LATENCY (T0→T3)
            </span>
            <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold text-white flex items-baseline space-x-1">
              <span>{summary.avgTotalLatencyMs.toFixed(1)}</span>
              <span className="text-xs text-[#8B949E]">ms</span>
            </div>
            <div className="text-[10px] flex items-center space-x-1 mt-0.5">
              <span className={`font-bold ${getLatencyTier(summary.avgTotalLatencyMs).color}`}>
                {getLatencyTier(summary.avgTotalLatencyMs).label}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-[#8B949E] border-t border-[#21262D] pt-1.5">
            Target benchmark: &lt; 150ms
          </div>
        </div>

        {/* Card 2: Compute Jitter (T0 -> T1) */}
        <div className="bg-[#161B22] p-3.5 rounded-lg border border-[#2D333B] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8B949E] uppercase font-bold tracking-wider">
              PRE-TRADE COMPUTE JITTER
            </span>
            <Activity className="w-3.5 h-3.5 text-[#A78BFA]" />
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold text-[#A78BFA] flex items-baseline space-x-1">
              <span>{summary.avgComputeJitterMs.toFixed(1)}</span>
              <span className="text-xs text-[#8B949E]">ms</span>
            </div>
            <div className="text-[10px] text-[#8B949E] mt-0.5">
              Δ1: Sizing & Auto-Tuner SL/TP
            </div>
          </div>
          <div className="text-[10px] text-[#8B949E] border-t border-[#21262D] pt-1.5">
            Kondisi: {summary.avgComputeJitterMs < 8 ? '✅ Zero Jitter' : '⚠️ Minor Lag'}
          </div>
        </div>

        {/* Card 3: Network Transit (T1 -> T2) */}
        <div className="bg-[#161B22] p-3.5 rounded-lg border border-[#2D333B] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8B949E] uppercase font-bold tracking-wider">
              BINANCE API TRANSIT
            </span>
            <Wifi className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold text-[#F59E0B] flex items-baseline space-x-1">
              <span>{summary.avgNetworkRoundtripMs.toFixed(1)}</span>
              <span className="text-xs text-[#8B949E]">ms</span>
            </div>
            <div className="text-[10px] text-[#8B949E] mt-0.5">
              Δ2: Live Mark Price Lock
            </div>
          </div>
          <div className="text-[10px] text-[#8B949E] border-t border-[#21262D] pt-1.5">
            Slippage avg: {summary.avgSlippageBps.toFixed(1)} bps
          </div>
        </div>

        {/* Card 4: Rapid SL Cycles (<15s) */}
        <div className="bg-[#161B22] p-3.5 rounded-lg border border-[#2D333B] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8B949E] uppercase font-bold tracking-wider">
              RAPID STOP LOSS (&lt;15s)
            </span>
            <Zap className="w-3.5 h-3.5 text-[#EF4444]" />
          </div>
          <div className="my-1.5">
            <div className="text-xl font-bold text-[#EF4444] flex items-baseline space-x-1">
              <span>{summary.rapidStopLossCount}</span>
              <span className="text-xs text-[#8B949E]">trades</span>
              <span className="text-xs font-normal text-[#EF4444] ml-1">
                ({summary.rapidStopLossRate.toFixed(1)}%)
              </span>
            </div>
            <div className="text-[10px] text-[#8B949E] mt-0.5">
              Total trade diaudit: {summary.totalAuditedTrades}
            </div>
          </div>
          <div className="text-[10px] text-[#8B949E] border-t border-[#21262D] pt-1.5">
            {summary.rapidStopLossRate > 35 ? '⚠️ Tingkat SL Cepat Tinggi' : '✅ Dalam Batas Toleransi'}
          </div>
        </div>

        {/* Card 5: Primary Bottleneck Verdict */}
        <div className="bg-[#161B22] p-3.5 rounded-lg border border-[#2D333B] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#8B949E] uppercase font-bold tracking-wider">
              PRIMARY BOTTLENECK
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#3B82F6]" />
          </div>
          <div className="my-1.5">
            <div className="text-sm font-bold truncate">
              {summary.primaryBottleneck === 'NETWORK_SLIPPAGE' && <span className="text-[#F59E0B]">⚡ NETWORK SLIPPAGE</span>}
              {summary.primaryBottleneck === 'CALCULATION_JITTER' && <span className="text-[#A78BFA]">🧠 CALCULATION JITTER</span>}
              {summary.primaryBottleneck === 'FLAWED_LOGIC' && <span className="text-[#EF4444]">⚠️ FLAWED LOGIC</span>}
              {summary.primaryBottleneck === 'NORMAL_VOLATILITY' && <span className="text-[#60A5FA]">🌊 MARKET NOISE</span>}
              {summary.primaryBottleneck === 'OPTIMAL' && <span className="text-[#10B981]">✨ OPTIMAL EDGE</span>}
            </div>
            <div className="text-[10px] text-[#8B949E] mt-0.5">
              Health Index: <span className="text-white font-bold">{summary.healthScore}/100</span>
            </div>
          </div>
          <div className="text-[10px] text-[#8B949E] border-t border-[#21262D] pt-1.5">
            Diagnosis Otomatis AI Engine
          </div>
        </div>
      </div>

      {/* 3. The Interactive Waterfall Breakdown: T0 -> T1 -> T2 -> T3 */}
      <div className="bg-[#161B22] border border-[#2D333B] rounded-lg p-4 font-mono">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-[#21262D] gap-2">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#3B82F6]" />
              <span>END-TO-END EXECUTION LATENCY WATERFALL BREAKDOWN</span>
            </h4>
            <p className="text-[11px] text-[#8B949E] mt-0.5">
              Visualisasi delta per fase eksekusi untuk mendeteksi di mana *bottleneck* terjadi.
            </p>
          </div>
          {selectedAudit && (
            <div className="text-[11px] bg-[#0D1117] px-2.5 py-1 rounded border border-[#2D333B] text-[#8B949E]">
              Trade ID: <span className="text-white font-bold">{selectedAudit.tradeId}</span> ({selectedAudit.symbol} {selectedAudit.side})
            </div>
          )}
        </div>

        {/* Milestone Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 my-2">
          {/* Step 1: T0 */}
          <div className="bg-[#0D1117] p-3 rounded-lg border border-[#2D333B] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#8B949E] mb-1">
                <span className="font-bold text-[#3B82F6]">T0: SIGNAL GENERATION</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3B82F620] text-[#3B82F6]">START</span>
              </div>
              <p className="text-xs text-white font-bold">Deteksi Kondisi Alpha / Regime</p>
              <p className="text-[10px] text-[#8B949E] mt-1">
                Trigger Price: <span className="text-white">${selectedAudit ? selectedAudit.signalPrice.toFixed(2) : '---'}</span>
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#21262D] text-[10px] text-[#8B949E]">
              Baseline: 0.0 ms
            </div>
          </div>

          {/* Step 2: T1 */}
          <div className="bg-[#0D1117] p-3 rounded-lg border border-[#2D333B] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#8B949E] mb-1">
                <span className="font-bold text-[#A78BFA]">T1: PRE-TRADE SIZING</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#A78BFA20] text-[#A78BFA]">
                  Δ1: {selectedAudit ? selectedAudit.milestones.computeJitterMs.toFixed(1) : summary.avgComputeJitterMs.toFixed(1)}ms
                </span>
              </div>
              <p className="text-xs text-white font-bold">Kalkulasi ATR, SL/TP, & Lot</p>
              <p className="text-[10px] text-[#8B949E] mt-1">
                SL Distance: <span className="text-white">${selectedAudit ? selectedAudit.dynamicSlDistance.toFixed(2) : '---'} ({selectedAudit ? (selectedAudit.dynamicSlPct * 100).toFixed(2) : '---'}%)</span>
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#21262D] text-[10px] text-[#A78BFA]">
              {selectedAudit && selectedAudit.milestones.computeJitterMs > 15 ? '⚠️ High compute jitter' : '✅ Instant computation'}
            </div>
          </div>

          {/* Step 3: T2 */}
          <div className="bg-[#0D1117] p-3 rounded-lg border border-[#2D333B] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#8B949E] mb-1">
                <span className="font-bold text-[#F59E0B]">T2: EXCHANGE NETWORK</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F59E0B20] text-[#F59E0B]">
                  Δ2: {selectedAudit ? selectedAudit.milestones.networkRoundtripMs.toFixed(1) : summary.avgNetworkRoundtripMs.toFixed(1)}ms
                </span>
              </div>
              <p className="text-xs text-white font-bold">Binance Ticker & Depth Lock</p>
              <p className="text-[10px] text-[#8B949E] mt-1">
                Fill Price: <span className="text-white">${selectedAudit ? selectedAudit.executionPrice.toFixed(2) : '---'}</span>
                <span className="text-[#F59E0B] ml-1">({selectedAudit ? selectedAudit.slippageBps.toFixed(1) : '0'} bps)</span>
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#21262D] text-[10px] text-[#F59E0B]">
              {selectedAudit && Math.abs(selectedAudit.slippageBps) > 15 ? '⚠️ Slippage detected' : '✅ Tight spread lock'}
            </div>
          </div>

          {/* Step 4: T3 */}
          <div className="bg-[#0D1117] p-3 rounded-lg border border-[#2D333B] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#8B949E] mb-1">
                <span className="font-bold text-[#10B981]">T3: EXECUTION FILL</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#10B98120] text-[#10B981]">
                  Δ3: {selectedAudit ? selectedAudit.milestones.fillConfirmationMs.toFixed(1) : summary.avgFillConfirmationMs.toFixed(1)}ms
                </span>
              </div>
              <p className="text-xs text-white font-bold">Position Active in State</p>
              <p className="text-[10px] text-[#8B949E] mt-1">
                Holding Life: <span className="text-white">{selectedAudit ? `${selectedAudit.holdingDurationSeconds.toFixed(1)}s` : '---'}</span>
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#21262D] text-[10px] text-[#10B981]">
              Total Delta: {selectedAudit ? `${selectedAudit.milestones.totalLatencyMs.toFixed(1)}ms` : `${summary.avgTotalLatencyMs.toFixed(1)}ms`}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar Waterfall */}
        {selectedAudit && (
          <div className="mt-4 pt-3 border-t border-[#21262D]">
            <div className="flex items-center justify-between text-[10px] text-[#8B949E] mb-1.5">
              <span>LATENCY COMPOSITION (TOTAL: {selectedAudit.milestones.totalLatencyMs.toFixed(1)}ms)</span>
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#A78BFA]" />
                  <span>Compute ({((selectedAudit.milestones.computeJitterMs / Math.max(1, selectedAudit.milestones.totalLatencyMs)) * 100).toFixed(0)}%)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  <span>Network Transit ({((selectedAudit.milestones.networkRoundtripMs / Math.max(1, selectedAudit.milestones.totalLatencyMs)) * 100).toFixed(0)}%)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>Fill Confirm ({((selectedAudit.milestones.fillConfirmationMs / Math.max(1, selectedAudit.milestones.totalLatencyMs)) * 100).toFixed(0)}%)</span>
                </span>
              </div>
            </div>
            <div className="w-full h-3 bg-[#0D1117] rounded-full overflow-hidden flex border border-[#2D333B]">
              <div
                style={{
                  width: `${Math.max(
                    5,
                    (selectedAudit.milestones.computeJitterMs / Math.max(1, selectedAudit.milestones.totalLatencyMs)) * 100
                  )}%`,
                }}
                className="bg-[#A78BFA] transition-all"
                title={`Compute Jitter: ${selectedAudit.milestones.computeJitterMs.toFixed(1)}ms`}
              />
              <div
                style={{
                  width: `${Math.max(
                    10,
                    (selectedAudit.milestones.networkRoundtripMs / Math.max(1, selectedAudit.milestones.totalLatencyMs)) * 100
                  )}%`,
                }}
                className="bg-[#F59E0B] transition-all"
                title={`Network Transit: ${selectedAudit.milestones.networkRoundtripMs.toFixed(1)}ms`}
              />
              <div
                style={{
                  width: `${Math.max(
                    5,
                    (selectedAudit.milestones.fillConfirmationMs / Math.max(1, selectedAudit.milestones.totalLatencyMs)) * 100
                  )}%`,
                }}
                className="bg-[#10B981] transition-all"
                title={`Fill Confirmation: ${selectedAudit.milestones.fillConfirmationMs.toFixed(1)}ms`}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Root Cause Diagnostic Breakdown & Interactive Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 cols: Root Cause Distribution & Analysis */}
        <div className="lg:col-span-7 bg-[#161B22] border border-[#2D333B] rounded-lg p-4 font-mono flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#21262D]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-[#EF4444]" />
                <span>ROOT CAUSE ATTRIBUTION ENGINE FOR EXITS</span>
              </h4>
              <span className="text-[10px] text-[#8B949E]">
                Total Audit: {summary.totalAuditedTrades} Trade
              </span>
            </div>

            {/* Diagnostic Categories Matrix */}
            <div className="space-y-2.5">
              {/* Culprit 1: Network Slippage */}
              <div className="bg-[#0D1117] p-3 rounded-lg border border-[#2D333B]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-[#F59E0B20] text-[#F59E0B]">
                      <Wifi className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-white">1. NETWORK SLIPPAGE & TRANSIT LAG</span>
                  </div>
                  <span className="text-xs font-bold text-[#F59E0B]">
                    {summary.rootCauseDistribution.networkSlippageCount} trades (
                    {summary.totalAuditedTrades > 0
                      ? ((summary.rootCauseDistribution.networkSlippageCount / summary.totalAuditedTrades) * 100).toFixed(1)
                      : '0'}
                    %)
                  </span>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  Terjadi ketika pergeseran harga saat transit API (&gt;15 bps) menyebabkan level Stop Loss terlalu dekat dengan harga pasar saat order dibuka.
                </p>
                <div className="w-full bg-[#21262D] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        summary.totalAuditedTrades > 0
                          ? (summary.rootCauseDistribution.networkSlippageCount / summary.totalAuditedTrades) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-[#F59E0B] h-full"
                  />
                </div>
              </div>

              {/* Culprit 2: Calculation Jitter */}
              <div className="bg-[#0D1117] p-3 rounded-lg border border-[#2D333B]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-[#8B5CF620] text-[#A78BFA]">
                      <Activity className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-white">2. CALCULATION JITTER & TIGHT ATR BUFFER</span>
                  </div>
                  <span className="text-xs font-bold text-[#A78BFA]">
                    {summary.rootCauseDistribution.calculationJitterCount} trades (
                    {summary.totalAuditedTrades > 0
                      ? ((summary.rootCauseDistribution.calculationJitterCount / summary.totalAuditedTrades) * 100).toFixed(1)
                      : '0'}
                    %)
                  </span>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  Terjadi ketika auto-tuner menghitung jarak SL terlalu sempit (&lt;0.4% jarak harga), sehingga noise mikro fluktuasi 1.5 detik langsung menyentuh SL.
                </p>
                <div className="w-full bg-[#21262D] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        summary.totalAuditedTrades > 0
                          ? (summary.rootCauseDistribution.calculationJitterCount / summary.totalAuditedTrades) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-[#A78BFA] h-full"
                  />
                </div>
              </div>

              {/* Culprit 3: Flawed Logic */}
              <div className="bg-[#0D1117] p-3 rounded-lg border border-[#2D333B]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-[#EF444420] text-[#EF4444]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-white">3. FLAWED LOGIC / FALSE CHOP BREAKOUT</span>
                  </div>
                  <span className="text-xs font-bold text-[#EF4444]">
                    {summary.rootCauseDistribution.flawedLogicCount} trades (
                    {summary.totalAuditedTrades > 0
                      ? ((summary.rootCauseDistribution.flawedLogicCount / summary.totalAuditedTrades) * 100).toFixed(1)
                      : '0'}
                    %)
                  </span>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  Entry melawan bias arah dominan tanpa konfirmasi ketidakseimbangan orderbook (orderbook imbalance).
                </p>
                <div className="w-full bg-[#21262D] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        summary.totalAuditedTrades > 0
                          ? (summary.rootCauseDistribution.flawedLogicCount / summary.totalAuditedTrades) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-[#EF4444] h-full"
                  />
                </div>
              </div>

              {/* Culprit 4: Natural Market Volatility & Profit */}
              <div className="bg-[#0D1117] p-3 rounded-lg border border-[#2D333B]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 rounded bg-[#3B82F620] text-[#60A5FA]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-white">4. NATURAL VOLATILITY & PROFIT TARGETS</span>
                  </div>
                  <span className="text-xs font-bold text-[#60A5FA]">
                    {summary.rootCauseDistribution.naturalVolatilityCount + summary.rootCauseDistribution.profitTargetCount} trades (
                    {summary.totalAuditedTrades > 0
                      ? (
                          ((summary.rootCauseDistribution.naturalVolatilityCount +
                            summary.rootCauseDistribution.profitTargetCount) /
                            summary.totalAuditedTrades) *
                          100
                        ).toFixed(1)
                      : '0'}
                    %)
                  </span>
                </div>
                <p className="text-[11px] text-[#8B949E]">
                  Eksekusi bersih tanpa anomali software; pergerakan harga pasar murni yang menyentuh TP atau SL wajar.
                </p>
                <div className="w-full bg-[#21262D] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    style={{
                      width: `${
                        summary.totalAuditedTrades > 0
                          ? ((summary.rootCauseDistribution.naturalVolatilityCount +
                              summary.rootCauseDistribution.profitTargetCount) /
                              summary.totalAuditedTrades) *
                            100
                          : 0
                      }%`,
                    }}
                    className="bg-[#3B82F6] h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Interactive Latency & ATR Multiplier Sandbox */}
        <div className="lg:col-span-5 bg-[#161B22] border border-[#2D333B] rounded-lg p-4 font-mono flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#21262D]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#3B82F6]" />
                <span>LATENCY & SL BUFFER STRESS TESTER</span>
              </h4>
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            </div>

            <p className="text-[11px] text-[#8B949E] mb-4">
              Uji ketahanan algoritma terhadap simulasi latensi jaringan dan sesuaikan multiplier Stop Loss ATR secara langsung.
            </p>

            {/* Slider 1: Artificial Network Latency */}
            <div className="space-y-2 mb-4 bg-[#0D1117] p-3 rounded-lg border border-[#2D333B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8B949E]">SIMULATED API LATENCY:</span>
                <span className="text-white font-bold">{simulatedLatency} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="800"
                step="50"
                value={simulatedLatency}
                onChange={(e) => setSimulatedLatency(parseInt(e.target.value, 10))}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#8B949E]">
                <span>0ms (Direct)</span>
                <span>250ms (Cloud API)</span>
                <span>800ms (High Lag)</span>
              </div>
            </div>

            {/* Slider 2: Dynamic ATR SL Multiplier Buffer */}
            <div className="space-y-2 mb-4 bg-[#0D1117] p-3 rounded-lg border border-[#2D333B]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8B949E]">DYNAMIC ATR SL MULTIPLIER:</span>
                <span className="text-[#10B981] font-bold">{simulatedAtrBuffer.toFixed(1)}x ATR</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.1"
                value={simulatedAtrBuffer}
                onChange={(e) => setSimulatedAtrBuffer(parseFloat(e.target.value))}
                className="w-full accent-[#10B981] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#8B949E]">
                <span>1.0x (Tight / High Noise Risk)</span>
                <span>2.0x (Balanced)</span>
                <span>3.5x (Wide / Trend Swing)</span>
              </div>
            </div>

            {/* Projected Survival Rate */}
            <div className="p-3 rounded-lg bg-[#0D1117] border border-[#2D333B]">
              <div className="text-[10px] text-[#8B949E] uppercase font-bold mb-1">
                PROJECTED TRADE SURVIVAL INDEX
              </div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">
                  {Math.min(98, Math.max(20, Math.round(55 + (simulatedAtrBuffer - 1.5) * 25 - (simulatedLatency / 800) * 20)))}%
                </span>
                <span className="text-[10px] text-[#10B981] bg-[#10B98120] px-2 py-0.5 rounded border border-[#10B98140]">
                  {simulatedAtrBuffer >= 1.8 ? 'OPTIMAL NOISE FILTER' : 'SENSITIVE TO CHOP'}
                </span>
              </div>
            </div>
          </div>

          {onAdjustStrategySL && (
            <button
              onClick={() => onAdjustStrategySL(simulatedAtrBuffer)}
              className="w-full mt-4 py-2 px-3 rounded bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-mono font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>APPLY {simulatedAtrBuffer.toFixed(1)}x ATR BUFFER TO LIVE BOT</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Detailed Trade Latency & Root Cause Audit Table */}
      <div className="bg-[#161B22] border border-[#2D333B] rounded-lg p-4 font-mono">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-[#21262D] gap-2">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#3B82F6]" />
              <span>DETAILED EXECUTION & SLIPPAGE AUDIT LOG</span>
            </h4>
            <p className="text-[11px] text-[#8B949E] mt-0.5">
              Klik salah satu baris untuk melihat rincian kalkulasi delta dan investigasi Stop Loss.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari pair / ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0D1117] border border-[#2D333B] rounded px-2.5 py-1 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6] w-32 sm:w-40 font-mono"
              />
              <Search className="w-3 h-3 text-[#6B7280] absolute right-2 top-2" />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#0D1117] border border-[#2D333B] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#3B82F6] font-mono cursor-pointer"
            >
              <option value="ALL">Semua Trade ({audits.length})</option>
              <option value="RAPID_EXITS">Rapid SL (&lt;15s)</option>
              <option value="SLIPPAGE">Network Slippage</option>
              <option value="JITTER">Calculation Jitter</option>
              <option value="FLAWED_LOGIC">Flawed Logic</option>
              <option value="PROFIT">Take Profit Hit</option>
            </select>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#2D333B] text-[10px] text-[#8B949E] uppercase tracking-wider bg-[#0D1117]/60">
                <th className="p-2.5">Waktu</th>
                <th className="p-2.5">Pair & Side</th>
                <th className="p-2.5">Signal → Fill Price</th>
                <th className="p-2.5">Slippage</th>
                <th className="p-2.5">Δ Compute</th>
                <th className="p-2.5">Δ Network</th>
                <th className="p-2.5">Total Δ</th>
                <th className="p-2.5">Hold Duration</th>
                <th className="p-2.5">PnL</th>
                <th className="p-2.5">Root Cause Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21262D]">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-[#8B949E] text-xs">
                    {audits.length === 0
                      ? 'Belum ada data eksekusi trade yang diaudit. Aktifkan bot untuk memulai perekaman telemetri real-time.'
                      : 'Tidak ada data trade yang sesuai dengan filter pencarian.'}
                  </td>
                </tr>
              ) : (
                filteredAudits.map((item) => {
                  const badge = getRootCauseBadge(item.rootCause);
                  const isSelected = selectedAudit?.tradeId === item.tradeId;
                  const isRapidLoss = item.holdingDurationSeconds < 15 && item.exitReason === 'STOP_LOSS';

                  return (
                    <tr
                      key={item.tradeId}
                      onClick={() => setSelectedAuditId(item.tradeId)}
                      className={`hover:bg-[#21262D]/60 transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#3B82F615] border-l-2 border-l-[#3B82F6]' : ''
                      }`}
                    >
                      <td className="p-2.5 text-[#8B949E] font-mono whitespace-nowrap">{item.timestamp}</td>
                      <td className="p-2.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{item.symbol}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                              item.side === 'LONG'
                                ? 'bg-[#10B98120] text-[#10B981] border border-[#10B98140]'
                                : 'bg-[#EF444420] text-[#EF4444] border border-[#EF444440]'
                            }`}
                          >
                            {item.side}
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-[11px]">
                          <span className="text-[#8B949E]">${item.signalPrice.toFixed(2)}</span>
                          <ArrowRight className="w-3 h-3 text-[#6B7280]" />
                          <span className="text-white font-bold">${item.executionPrice.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            Math.abs(item.slippageBps) > 12 ? 'text-[#F59E0B]' : 'text-[#8B949E]'
                          }`}
                        >
                          {item.slippageBps > 0 ? '+' : ''}
                          {item.slippageBps.toFixed(1)} bps
                        </span>
                      </td>
                      <td className="p-2.5 whitespace-nowrap text-[#A78BFA]">
                        {item.milestones.computeJitterMs.toFixed(1)} ms
                      </td>
                      <td className="p-2.5 whitespace-nowrap text-[#F59E0B]">
                        {item.milestones.networkRoundtripMs.toFixed(1)} ms
                      </td>
                      <td className="p-2.5 whitespace-nowrap text-white font-bold">
                        {item.milestones.totalLatencyMs.toFixed(1)} ms
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            isRapidLoss
                              ? 'bg-[#EF444420] text-[#EF4444] font-bold border border-[#EF444440]'
                              : 'text-[#8B949E]'
                          }`}
                        >
                          {item.holdingDurationSeconds.toFixed(1)}s
                        </span>
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className={`font-bold ${item.pnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {item.pnl >= 0 ? '+' : ''}${item.pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Audit Deep-Dive Card */}
        {selectedAudit && (
          <div className="mt-4 p-3.5 bg-[#0D1117] rounded-lg border border-[#3B82F640] relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 mb-2 border-b border-[#21262D] gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">
                  🔍 INVESTIGASI TEKNIS TRADE #{selectedAudit.tradeId} ({selectedAudit.symbol} {selectedAudit.side})
                </span>
                <span
                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                    getRootCauseBadge(selectedAudit.rootCause).color
                  }`}
                >
                  {getRootCauseBadge(selectedAudit.rootCause).icon}
                  <span>{getRootCauseBadge(selectedAudit.rootCause).label}</span>
                </span>
              </div>
              <div className="text-[11px] text-[#8B949E]">
                Confidence Level: <span className="text-[#10B981] font-bold">{selectedAudit.confidenceScore}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#161B22] p-2.5 rounded border border-[#2D333B]">
                <span className="text-[10px] text-[#8B949E] uppercase font-bold">PENJELASAN AKAR MASALAH:</span>
                <p className="text-white text-[11px] mt-1 leading-relaxed">
                  {selectedAudit.rootCauseExplanation}
                </p>
              </div>

              <div className="bg-[#161B22] p-2.5 rounded border border-[#2D333B]">
                <span className="text-[10px] text-[#8B949E] uppercase font-bold">PARAMETER SL & TP DI ENTRI:</span>
                <div className="text-[11px] text-[#8B949E] space-y-0.5 mt-1">
                  <div>Entry: <span className="text-white font-bold">${selectedAudit.executionPrice.toFixed(2)}</span></div>
                  <div>Exit: <span className="text-white font-bold">${selectedAudit.exitPrice.toFixed(2)}</span> ({selectedAudit.exitReason})</div>
                  <div>SL Buffer: <span className="text-white font-bold">${selectedAudit.dynamicSlDistance.toFixed(2)} ({(selectedAudit.dynamicSlPct * 100).toFixed(2)}%)</span></div>
                </div>
              </div>

              <div className="bg-[#161B22] p-2.5 rounded border border-[#2D333B]">
                <span className="text-[10px] text-[#8B949E] uppercase font-bold">REKOMENDASI OPTIMASI:</span>
                <p className="text-[#60A5FA] text-[11px] mt-1 leading-relaxed">
                  {selectedAudit.rootCause === 'NETWORK_SLIPPAGE' && 'Tingkatkan limit order margin atau gunakan endpoint low-latency WebSocket Binance.'}
                  {selectedAudit.rootCause === 'CALCULATION_JITTER' && 'Tingkatkan parameter Dynamic SL ATR Multiplier minimal ke 1.8x untuk meredam noise mikro.'}
                  {selectedAudit.rootCause === 'FLAWED_LOGIC' && 'Tambahkan filter konfirmasi Orderbook Imbalance (min >1.10 untuk Long).'}
                  {selectedAudit.rootCause === 'NATURAL_VOLATILITY' && 'Eksekusi sudah presisi. Pertahankan strategi untuk sampel pengujian jangka panjang.'}
                  {selectedAudit.rootCause === 'PROFIT_TARGET_HIT' && 'Eksekusi sempurna sesuai rasio RRR yang ditentukan.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

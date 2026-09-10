import React from 'react';
import { StrategyConfig } from '../types/trading';
import { PRESET_STRATEGIES } from '../data/strategies';
import {
  Sliders,
  Play,
  Shield,
  Percent,
  Gauge,
  HelpCircle,
  Zap,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';

interface StrategyConfigProps {
  currentStrategy: StrategyConfig;
  onStrategyChange: (strategy: StrategyConfig) => void;
  onRunBacktest: () => void;
  isRunning: boolean;
}

export const StrategyConfigPanel: React.FC<StrategyConfigProps> = ({
  currentStrategy,
  onStrategyChange,
  onRunBacktest,
  isRunning,
}) => {
  const p = currentStrategy.params;

  const updateParam = (key: keyof StrategyConfig['params'], value: any) => {
    onStrategyChange({
      ...currentStrategy,
      params: {
        ...currentStrategy.params,
        [key]: value,
      },
    });
  };

  const handleSelectPreset = (presetId: string) => {
    const found = PRESET_STRATEGIES.find((s) => s.id === presetId);
    if (found) {
      onStrategyChange({ ...found });
    }
  };

  return (
    <div
      id="strategy-config-panel"
      className="bg-[#0D1117] border border-[#2D333B] rounded-lg p-4 shadow-sm flex flex-col gap-4 font-sans"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2D333B] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded bg-[#161B22] text-[#3B82F6] border border-[#2D333B]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
              Strategy & Alpha Inefficiency Parameters
            </h3>
            <p className="text-[10px] text-[#6B7280] font-mono">
              Configure trigger conditions, execution risk limits, and slippage buffer
            </p>
          </div>
        </div>

        <button
          id="run-backtest-primary-btn"
          onClick={onRunBacktest}
          disabled={isRunning}
          className="flex items-center space-x-2 bg-[#2563EB] hover:bg-[#3B82F6] text-white px-3.5 py-1.5 rounded text-xs font-mono font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'RUNNING TEST...' : 'EXECUTE BACKTEST'}</span>
        </button>
      </div>

      {/* Preset Strategy Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-widest font-mono">
            SELECT QUANTUM ALPHA STRATEGY ({PRESET_STRATEGIES.length} MODELS AVAILABLE):
          </label>
          <span className="text-[10px] text-[#3B82F6] font-mono font-semibold">
            Active: {currentStrategy.category}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {PRESET_STRATEGIES.map((strat) => {
            const isSelected = strat.id === currentStrategy.id;
            const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
              ICT_SMC: { bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-800/50' },
              SUPERTREND_VWAP: { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-800/50' },
              MEAN_REVERSION: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/50' },
              GRID_TRADING: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800/50' },
              TREND_MOMENTUM: { bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-800/50' },
              DCA_MARTINGALE: { bg: 'bg-orange-950/40', text: 'text-orange-400', border: 'border-orange-800/50' },
              MACD_STOCHASTIC: { bg: 'bg-pink-950/40', text: 'text-pink-400', border: 'border-pink-800/50' },
              VOLATILITY_BREAKOUT: { bg: 'bg-yellow-950/40', text: 'text-yellow-400', border: 'border-yellow-800/50' },
              VWAP_BANDS: { bg: 'bg-indigo-950/40', text: 'text-indigo-400', border: 'border-indigo-800/50' },
              VOLUME_PROFILE: { bg: 'bg-teal-950/40', text: 'text-teal-400', border: 'border-teal-800/50' },
              MICROSTRUCTURE: { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-800/50' },
              FUNDING_RATE: { bg: 'bg-lime-950/40', text: 'text-lime-400', border: 'border-lime-800/50' },
            };
            const col = categoryColors[strat.category] || { bg: 'bg-slate-900', text: 'text-slate-400', border: 'border-slate-700' };

            return (
              <button
                key={strat.id}
                id={`preset-${strat.id}`}
                onClick={() => handleSelectPreset(strat.id)}
                className={`text-left p-3 rounded-lg border transition-all relative ${
                  isSelected
                    ? 'bg-[#161B22] border-[#3B82F6] ring-1 ring-[#3B82F6]/50 text-white shadow-md'
                    : 'bg-[#161B22] border-[#2D333B] text-[#9CA3AF] hover:text-white hover:border-[#484F58]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5 gap-1.5">
                  <span className="text-xs font-bold font-mono text-white line-clamp-1">{strat.name}</span>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border ${col.bg} ${col.text} ${col.border}`}>
                    {strat.category.replace('_', ' ')}
                  </span>
                  <span className="text-[9px] font-mono text-[#6B7280]">
                    R:R 1:{strat.params.riskRewardRatio} • {strat.params.leverage}x
                  </span>
                </div>
                <p className="text-[11px] text-[#8B949E] line-clamp-2 leading-relaxed">
                  {strat.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameter Adjustment Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#161B22] p-3 rounded border border-[#2D333B] text-xs font-mono">
        {/* Risk & Sizing */}
        <div className="space-y-2.5 bg-[#0D1117] p-2.5 rounded border border-[#2D333B]">
          <div className="flex items-center space-x-1.5 font-bold text-[#10B981] text-[11px] uppercase tracking-wide">
            <Shield className="w-3.5 h-3.5" />
            <span>Position Risk Sizing</span>
          </div>

          <div>
            <div className="flex justify-between mb-1 text-[11px]">
              <span className="text-[#6B7280]">Risk Per Trade:</span>
              <span className="text-white font-bold">{p.riskPerTradePercent}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={p.riskPerTradePercent}
              onChange={(e) => updateParam('riskPerTradePercent', parseFloat(e.target.value))}
              className="w-full accent-[#10B981] cursor-pointer h-1.5 bg-[#30363D] rounded"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1 text-[11px]">
              <span className="text-[#6B7280]">Leverage:</span>
              <span className="text-white font-bold">{p.leverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={p.leverage}
              onChange={(e) => updateParam('leverage', parseInt(e.target.value, 10))}
              className="w-full accent-[#10B981] cursor-pointer h-1.5 bg-[#30363D] rounded"
            />
          </div>
        </div>

        {/* Take Profit & Stop Loss */}
        <div className="space-y-2.5 bg-[#0D1117] p-2.5 rounded border border-[#2D333B]">
          <div className="flex items-center space-x-1.5 font-bold text-[#3B82F6] text-[11px] uppercase tracking-wide">
            <Gauge className="w-3.5 h-3.5" />
            <span>Target RRR & SL</span>
          </div>

          <div>
            <div className="flex justify-between mb-1 text-[11px]">
              <span className="text-[#6B7280]">Target R:R Ratio:</span>
              <span className="text-white font-bold">1 : {p.riskRewardRatio}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.2"
              value={p.riskRewardRatio}
              onChange={(e) => updateParam('riskRewardRatio', parseFloat(e.target.value))}
              className="w-full accent-[#3B82F6] cursor-pointer h-1.5 bg-[#30363D] rounded"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1 text-[11px]">
              <span className="text-[#6B7280]">ATR Multiplier SL:</span>
              <span className="text-white font-bold">{p.atrMultiplierSL}x ATR</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="3.5"
              step="0.1"
              value={p.atrMultiplierSL}
              onChange={(e) => updateParam('atrMultiplierSL', parseFloat(e.target.value))}
              className="w-full accent-[#3B82F6] cursor-pointer h-1.5 bg-[#30363D] rounded"
            />
          </div>
        </div>

        {/* Trailing Stop & Dynamic Exits */}
        <div className="space-y-2.5 bg-[#0D1117] p-2.5 rounded border border-[#2D333B]">
          <div className="flex items-center space-x-1.5 font-bold text-[#8B5CF6] text-[11px] uppercase tracking-wide">
            <Zap className="w-3.5 h-3.5" />
            <span>Dynamic Trailing Exit</span>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={p.useTrailingStop}
              onChange={(e) => updateParam('useTrailingStop', e.target.checked)}
              className="rounded bg-[#0D1117] border-[#2D333B] text-[#8B5CF6] focus:ring-0 w-3.5 h-3.5"
            />
            <span className="text-[#D1D5DB] text-[11px] font-semibold">Enable Trailing Stop</span>
          </label>

          {p.useTrailingStop && (
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span className="text-[#6B7280]">Activation Target:</span>
                <span className="text-white font-bold">+{p.trailingStopActivationRR}R</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={p.trailingStopActivationRR}
                onChange={(e) => updateParam('trailingStopActivationRR', parseFloat(e.target.value))}
                className="w-full accent-[#8B5CF6] cursor-pointer h-1.5 bg-[#30363D] rounded"
              />
            </div>
          )}
        </div>

        {/* Execution Realism (Fee & Slippage) */}
        <div className="space-y-2.5 bg-[#0D1117] p-2.5 rounded border border-[#2D333B]">
          <div className="flex items-center space-x-1.5 font-bold text-[#F59E0B] text-[11px] uppercase tracking-wide">
            <Percent className="w-3.5 h-3.5" />
            <span>Execution Model Realism</span>
          </div>

          <div>
            <div className="flex justify-between mb-1 text-[11px]">
              <span className="text-[#6B7280]">Slippage Model:</span>
              <span className="text-white font-bold">{p.slippageBps} bps</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={p.slippageBps}
              onChange={(e) => updateParam('slippageBps', parseInt(e.target.value, 10))}
              className="w-full accent-[#F59E0B] cursor-pointer h-1.5 bg-[#30363D] rounded"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1 text-[11px]">
              <span className="text-[#6B7280]">Taker Fee Rate:</span>
              <span className="text-white font-bold">{p.takerFeePercent}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.10"
              step="0.01"
              value={p.takerFeePercent}
              onChange={(e) => updateParam('takerFeePercent', parseFloat(e.target.value))}
              className="w-full accent-[#F59E0B] cursor-pointer h-1.5 bg-[#30363D] rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

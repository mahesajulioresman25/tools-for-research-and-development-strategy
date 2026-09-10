import React, { useState } from 'react';
import { MarketRegimeState } from '../types/trading';
import {
  Activity,
  ShieldAlert,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  Gauge,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface MarketRegimeBarProps {
  regimeState: MarketRegimeState;
  symbol: string;
  currentPrice: number;
}

export const MarketRegimeBar: React.FC<MarketRegimeBarProps> = ({
  regimeState,
  symbol,
  currentPrice,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { regime, label, confidenceScore, adxValue, atrPercentile, hurstExponent, riskAutoTuner } =
    regimeState;

  const getRegimeBadge = () => {
    switch (regime) {
      case 'TRENDING':
        return {
          icon: <TrendingUp className="w-3.5 h-3.5" />,
          bg: 'bg-[#10B98118]',
          border: 'border-[#10B98150]',
          text: 'text-[#10B981]',
          dot: 'bg-[#10B981]',
        };
      case 'HIGH_VOLATILITY':
        return {
          icon: <Zap className="w-3.5 h-3.5" />,
          bg: 'bg-[#EF444418]',
          border: 'border-[#EF444450]',
          text: 'text-[#EF4444]',
          dot: 'bg-[#EF4444] animate-ping',
        };
      case 'LOW_VOL_CHOP':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
          bg: 'bg-[#6B728018]',
          border: 'border-[#6B728050]',
          text: 'text-[#9CA3AF]',
          dot: 'bg-[#6B7280]',
        };
      case 'RANGING':
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5" />,
          bg: 'bg-[#F59E0B18]',
          border: 'border-[#F59E0B50]',
          text: 'text-[#F59E0B]',
          dot: 'bg-[#F59E0B]',
        };
    }
  };

  const badge = getRegimeBadge();

  return (
    <div className="bg-[#161B22] border border-[#2D333B] rounded-md px-3 py-2 text-xs font-mono select-none">
      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5 flex-wrap">
          {/* Status Badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border font-bold text-[11px] ${badge.bg} ${badge.border} ${badge.text}`}
          >
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            {badge.icon}
            <span>{label}</span>
            <span className="opacity-60 text-[10px]">({confidenceScore}% CONF)</span>
          </div>

          {/* Quick Quant Signals */}
          <div className="hidden sm:flex items-center space-x-3 text-[11px] text-[#9CA3AF] bg-[#0D1117] px-2.5 py-1 rounded border border-[#2D333B]">
            <span>
              ADX: <strong className="text-white">{adxValue}</strong>
            </span>
            <span className="text-[#30363D]">|</span>
            <span>
              ATR Rank: <strong className="text-white">{atrPercentile}%-ile</strong>
            </span>
            <span className="text-[#30363D]">|</span>
            <span>
              Hurst (H): <strong className="text-white">{hurstExponent}</strong>
            </span>
          </div>

          {/* Recommended Action Pill */}
          <div className="hidden md:flex items-center space-x-1.5 text-[11px] text-[#E6EDF3]">
            <span className="text-[#6E7681]">Edge:</span>
            <span className="font-semibold text-[#3B82F6]">{regimeState.recommendedStrategyType.split(',')[0]}</span>
          </div>
        </div>

        {/* Right Action: Risk Tuner Toggle */}
        <div className="flex items-center space-x-2">
          <div className="text-[11px] text-[#D1D5DB] bg-[#0D1117] px-2.5 py-1 rounded border border-[#2D333B] hidden lg:block">
            <span className="text-[#6E7681]">Lot Rec: </span>
            <strong className="text-[#10B981]">{riskAutoTuner.dynamicLotSize} {symbol.split('/')[0]}</strong>
            <span className="text-[#6E7681] ml-2">SL: </span>
            <strong className="text-[#EF4444]">-${riskAutoTuner.dynamicSlPriceDistance}</strong>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-[#E6EDF3] border border-[#30363D] text-[11px] font-bold transition-all cursor-pointer"
          >
            <Sliders className="w-3 h-3 text-[#3B82F6]" />
            <span>RISK AUTO-TUNER</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Risk Matrix & Mathematical Testing HUD */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-[#21262D] grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#0D1117] p-3 rounded border border-[#2D333B]">
          {/* Column 1: Regime Classification & Asymmetric Scenarios */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-[#3B82F6] font-bold text-[11px] uppercase tracking-wider">
              <Gauge className="w-3.5 h-3.5" />
              <span>Regime Matrix & Edge</span>
            </div>
            <div className="bg-[#161B22] p-2.5 rounded border border-[#2D333B] space-y-1.5 text-[11px]">
              <div>
                <span className="text-[#6E7681] block text-[10px]">OPTIMAL STRATEGY:</span>
                <span className="text-[#10B981] font-semibold">{regimeState.recommendedStrategyType}</span>
              </div>
              <div>
                <span className="text-[#6E7681] block text-[10px]">AVOID HAZARD:</span>
                <span className="text-[#EF4444] font-semibold">{regimeState.avoidStrategyType}</span>
              </div>
              <div className="pt-1 border-t border-[#2D333B] space-y-1 text-[10px]">
                <div className="text-[#10B981] flex items-start space-x-1">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />
                  <span><strong>Best-Case:</strong> {regimeState.bestCaseScenario}</span>
                </div>
                <div className="text-[#EF4444] flex items-start space-x-1">
                  <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                  <span><strong>Worst-Case:</strong> {regimeState.worstCaseScenario}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Dynamic Position Sizing & Target RR */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-[#10B981] font-bold text-[11px] uppercase tracking-wider">
              <Sliders className="w-3.5 h-3.5" />
              <span>Position Sizing & RR Auto-Tuner</span>
            </div>
            <div className="bg-[#161B22] p-2.5 rounded border border-[#2D333B] grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-[#0D1117] p-1.5 rounded border border-[#2D333B]">
                <span className="text-[#6E7681] block text-[10px]">CAPITAL RISK:</span>
                <span className="font-bold text-white">${riskAutoTuner.calculatedDollarRisk} ({riskAutoTuner.riskPerTradePct}%)</span>
              </div>
              <div className="bg-[#0D1117] p-1.5 rounded border border-[#2D333B]">
                <span className="text-[#6E7681] block text-[10px]">DYNAMIC LOT:</span>
                <span className="font-bold text-[#10B981]">{riskAutoTuner.dynamicLotSize} {symbol.split('/')[0]}</span>
              </div>
              <div className="bg-[#0D1117] p-1.5 rounded border border-[#2D333B]">
                <span className="text-[#6E7681] block text-[10px]">DYNAMIC SL (ATR):</span>
                <span className="font-bold text-[#EF4444]">${riskAutoTuner.dynamicSlPriceDistance} ({riskAutoTuner.dynamicSlAtrMultiple}x ATR)</span>
              </div>
              <div className="bg-[#0D1117] p-1.5 rounded border border-[#2D333B]">
                <span className="text-[#6E7681] block text-[10px]">TARGET TP (RRR):</span>
                <span className="font-bold text-[#10B981]">+${riskAutoTuner.dynamicTpPriceDistance} (1:{riskAutoTuner.dynamicTpRatio})</span>
              </div>
            </div>
          </div>

          {/* Column 3: Circuit Breaker & Testing Methodology */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-[#EAB308] font-bold text-[11px] uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Proteksi & Metodologi Pengujian</span>
            </div>
            <div className="bg-[#161B22] p-2.5 rounded border border-[#2D333B] space-y-1.5 text-[10px] text-[#9CA3AF]">
              <div>
                <span className="text-[#6E7681] block">CIRCUIT BREAKER:</span>
                <span className="text-[#F87171] font-bold">{riskAutoTuner.circuitBreakerTrigger}</span>
              </div>
              <div className="pt-1 border-t border-[#2D333B]">
                <span className="text-[#6E7681] block font-bold text-white mb-0.5">VALIDASI REGIME CLAUDE CODE:</span>
                <p className="leading-relaxed text-[#D1D5DB]">
                  1. <strong>Confusion Matrix:</strong> Uji akurasi transisi status tren vs range.<br />
                  2. <strong>Walk-Forward Stability:</strong> Validasi parameter out-of-sample.<br />
                  3. <strong>Slippage Stress-Test:</strong> Simulasi penalti spread saat volatilitas tinggi.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

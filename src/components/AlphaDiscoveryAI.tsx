import React, { useState } from 'react';
import {
  AIAlphaAnalysis,
  StrategyConfig,
  BacktestMetrics,
  DetectedPattern,
  MarketTicker,
  MarketSentiment,
} from '../types/trading';
import { requestAIAlphaAnalysis } from '../services/api';
import { generateDeterministicAlphaAnalysis } from '../utils/alphaEngine';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  TrendingUp,
  Cpu,
  Layers,
  Sliders,
  RotateCw,
} from 'lucide-react';

interface AlphaDiscoveryAIProps {
  strategy: StrategyConfig;
  symbol: string;
  metrics: BacktestMetrics;
  patterns: DetectedPattern[];
  ticker: MarketTicker | null;
  sentiment: MarketSentiment | null;
  onOpenBotCodeModal: () => void;
}

export const AlphaDiscoveryAI: React.FC<AlphaDiscoveryAIProps> = ({
  strategy,
  symbol,
  metrics,
  patterns,
  ticker,
  sentiment,
  onOpenBotCodeModal,
}) => {
  const [analysis, setAnalysis] = useState<AIAlphaAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await requestAIAlphaAnalysis({
        symbol,
        strategyName: strategy.name,
        strategyParams: strategy.params,
        backtestMetrics: metrics,
        marketContext: {
          ticker,
          sentiment,
        },
        detectedPatterns: patterns.slice(0, 10),
      });

      if (res && res.success && res.analysis) {
        setAnalysis(res.analysis);
      } else {
        const fallback = generateDeterministicAlphaAnalysis(strategy, symbol, metrics, patterns as any, ticker, sentiment);
        setAnalysis(fallback);
      }
    } catch (err: any) {
      console.warn('AI Analysis fallback activated:', err?.message || err);
      const fallback = generateDeterministicAlphaAnalysis(strategy, symbol, metrics, patterns as any, ticker, sentiment);
      setAnalysis(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="ai-alpha-panel"
      className="bg-[#0D1117] border border-[#2D333B] rounded-lg p-4 shadow-sm flex flex-col gap-4 font-sans"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D333B] pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-[#161B22] text-[#3B82F6] border border-[#2D333B]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                ALPHA DISCOVERY & QUANTITATIVE REASONING (GEMINI 2.5)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#161B22] text-[#3B82F6] border border-[#2D333B] uppercase font-mono">
                QUANT RESEARCHER
              </span>
            </div>
            <p className="text-[10px] text-[#6B7280] font-mono">
              Market microstructure analysis, liquidity voids, adverse selection risk & bot execution calibration
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="run-ai-alpha-btn"
            onClick={handleRunAnalysis}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-[#2563EB] hover:bg-[#3B82F6] text-white px-3.5 py-1.5 rounded text-xs font-mono font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'ANALYZING ALPHA...' : 'DISCOVER ALPHA'}</span>
          </button>

          <button
            id="generate-code-quick-btn"
            onClick={onOpenBotCodeModal}
            className="flex items-center space-x-1.5 bg-[#161B22] hover:bg-[#21262D] text-[#D1D5DB] border border-[#2D333B] px-3.5 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>EXPORT BOT SCRIPT</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-[#EF444415] border border-[#EF444450] text-[#EF4444] text-xs font-mono flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />
          <span>{error}</span>
        </div>
      )}

      {/* Initial Empty State / Call to Action */}
      {!analysis && !isLoading && (
        <div className="text-center py-8 px-4 bg-[#161B22] rounded border border-[#2D333B] space-y-2.5">
          <div className="w-10 h-10 rounded bg-[#0D1117] text-[#3B82F6] mx-auto flex items-center justify-center border border-[#2D333B]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
            IDENTIFY MARKET INEFFICIENCIES FROM EMPIRICAL DATA
          </h4>
          <p className="text-[11px] text-[#6B7280] max-w-xl mx-auto leading-relaxed font-mono">
            Execute Gemini Quant Analysis to inspect orderbook liquidity dynamics, stop hunts, slippage sensitivity, and generate optimized automation parameters.
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-8 text-center space-y-3 bg-[#161B22] rounded border border-[#2D333B]">
          <div className="inline-block p-2.5 rounded bg-[#0D1117] text-[#3B82F6] animate-spin border border-[#2D333B]">
            <RotateCw className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
              ANALYZING MICROSTRUCTURE & PERFORMANCE METRICS...
            </h4>
            <p className="text-[10px] text-[#6B7280] font-mono">
              Cross-referencing {patterns.length} technical patterns, {metrics.totalTrades} simulated executions, and Monte Carlo resamples.
            </p>
          </div>
        </div>
      )}

      {/* Full AI Analysis Results */}
      {analysis && !isLoading && (
        <div className="space-y-4">
          {/* Executive Alpha Score & Summary */}
          <div className="bg-[#0A0B0E] p-3.5 rounded border border-[#2D333B] flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center space-x-3 shrink-0">
              <div className="w-14 h-14 rounded bg-[#161B22] border border-[#2D333B] flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-[#10B981] font-mono">
                  {analysis.alphaScore}
                </span>
                <span className="text-[8px] uppercase font-bold text-[#6B7280] font-mono">ALPHA SCORE</span>
              </div>
            </div>

            <div className="flex-1">
              <h4 className="text-[11px] font-bold text-white mb-1 flex items-center space-x-1.5 font-mono uppercase tracking-wide">
                <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>EXECUTIVE ALPHA EDGE SUMMARY</span>
              </h4>
              <p className="text-xs text-[#D1D5DB] leading-relaxed font-sans">{analysis.summary}</p>
            </div>
          </div>

          {/* Grid: Inefficiencies & Execution Vulnerabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 1. Market Inefficiencies */}
            <div className="bg-[#0A0B0E] p-3.5 rounded border border-[#2D333B] space-y-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#10B981] font-mono uppercase tracking-wide">
                <Zap className="w-3.5 h-3.5" />
                <span>Identified Inefficiencies (Alpha Exploits)</span>
              </div>

              <div className="space-y-2">
                {analysis.marketInefficiencies.map((ineff, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-[#161B22] border border-[#2D333B] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono text-[11px]">{ineff.title}</span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#10B98115] text-[#10B981] border border-[#10B98130]">
                        {ineff.edgeType} • {ineff.impact}
                      </span>
                    </div>
                    <p className="text-[#9CA3AF] leading-relaxed text-[11px]">{ineff.mechanism}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Execution Vulnerabilities */}
            <div className="bg-[#0A0B0E] p-3.5 rounded border border-[#2D333B] space-y-2.5">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#EF4444] font-mono uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Execution Vulnerabilities & Overfitting</span>
              </div>

              <div className="space-y-2">
                {analysis.executionVulnerabilities.map((vuln, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-[#161B22] border border-[#2D333B] text-xs space-y-1"
                  >
                    <span className="font-bold text-[#EF4444] block font-mono text-[11px]">{vuln.risk}</span>
                    <p className="text-[#9CA3AF] leading-relaxed text-[11px]">
                      <strong className="text-white">Mitigation:</strong> {vuln.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Algorithm Optimizations */}
          <div className="bg-[#0A0B0E] p-3.5 rounded border border-[#2D333B] space-y-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#3B82F6] font-mono uppercase tracking-wide">
              <Sliders className="w-3.5 h-3.5" />
              <span>Recommended Algorithm Adjustments</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {analysis.algorithmOptimizations.map((opt, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-[#161B22] border border-[#2D333B] text-xs space-y-1"
                >
                  <span className="font-bold text-[#3B82F6] block font-mono text-[11px]">{opt.component}</span>
                  <p className="text-[#D1D5DB] text-[11px] leading-relaxed">{opt.recommendation}</p>
                  <div className="text-[10px] text-[#10B981] font-mono font-semibold pt-1 border-t border-[#2D333B]">
                    Impact: {opt.expectedImpact}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Regime Suitability & Deployment Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Market Regime Suitability */}
            <div className="bg-[#0A0B0E] p-3.5 rounded border border-[#2D333B] space-y-2">
              <div className="text-xs font-bold text-white flex items-center space-x-1.5 font-mono uppercase tracking-wide">
                <Layers className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Market Regime Suitability</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-[#161B22] border border-[#2D333B]">
                  <span className="text-[#6B7280] block text-[10px] uppercase">Trending Regime:</span>
                  <span className="text-[#10B981] font-bold">
                    {analysis.marketRegimeSuitability?.trending || 'Optimal'}
                  </span>
                </div>
                <div className="p-2 rounded bg-[#161B22] border border-[#2D333B]">
                  <span className="text-[#6B7280] block text-[10px] uppercase">Ranging Regime:</span>
                  <span className="text-[#F59E0B] font-bold">
                    {analysis.marketRegimeSuitability?.ranging || 'Moderate'}
                  </span>
                </div>
                <div className="p-2 rounded bg-[#161B22] border border-[#2D333B]">
                  <span className="text-[#6B7280] block text-[10px] uppercase">High Volatility:</span>
                  <span className="text-[#EF4444] font-bold">
                    {analysis.marketRegimeSuitability?.highVolatility || 'High Risk'}
                  </span>
                </div>
                <div className="p-2 rounded bg-[#161B22] border border-[#2D333B]">
                  <span className="text-[#6B7280] block text-[10px] uppercase">Low Liquidity:</span>
                  <span className="text-[#EF4444] font-bold">
                    {analysis.marketRegimeSuitability?.lowLiquidity || 'Avoid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actionable Pre-Deployment Checklist */}
            <div className="bg-[#0A0B0E] p-3.5 rounded border border-[#2D333B] space-y-2">
              <div className="text-xs font-bold text-white flex items-center space-x-1.5 font-mono uppercase tracking-wide">
                <CheckCircle className="w-4 h-4 text-[#10B981]" />
                <span>Pre-Deployment Verification Checklist</span>
              </div>
              <ul className="space-y-1 text-xs text-[#D1D5DB]">
                {analysis.deploymentChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-[11px] leading-relaxed font-sans">
                    <span className="text-[#10B981] font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

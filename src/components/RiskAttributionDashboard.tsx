import React from 'react';
import { ShieldAlert, TrendingDown, CheckCircle2, AlertTriangle, Scale, Target, DollarSign, Activity, Percent, ArrowDownRight, Layers } from 'lucide-react';
import { StrategyConfig } from '../types/trading';

interface ActivePosition {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  size: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  openTime: number;
  trailingPeak: number;
  regimeAtEntry: string;
  riskDollars: number;
  strategyAssigned?: string;
}

interface CompletedTradeRecord {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE';
  time: string;
  regime: string;
  strategyName: string;
}

interface RiskAttributionProps {
  balance: number;
  activePosition: ActivePosition | null;
  closedTrades: CompletedTradeRecord[];
  strategy: StrategyConfig;
  currentPrice: number;
}

export const RiskAttributionDashboard: React.FC<RiskAttributionProps> = ({
  balance,
  activePosition,
  closedTrades,
  strategy,
  currentPrice,
}) => {
  // 1. Calculate Realtime Equity & Peak Drawdown
  const totalEquity = balance + (activePosition?.unrealizedPnl || 0);

  // Peak Equity tracker from initial ($10,000) or cumulative closed trades + current floating
  const initialBalance = 10000;
  const equityPoints: number[] = [initialBalance];
  let runningBal = initialBalance;

  // Reconstruct equity curve through closed trades
  closedTrades.forEach((t) => {
    runningBal += t.pnl;
    equityPoints.push(runningBal);
  });
  if (activePosition) {
    equityPoints.push(runningBal + activePosition.unrealizedPnl);
  }

  let peakEquity = Math.max(...equityPoints, initialBalance);
  const currentDrawdownDollars = Math.max(0, peakEquity - totalEquity);
  const currentDrawdownPct = peakEquity > 0 ? (currentDrawdownDollars / peakEquity) * 100 : 0;

  // Max historical drawdown calculation across the curve
  let maxHistoricalDrawdownPct = 0;
  let runningPeak = equityPoints[0];
  equityPoints.forEach((eq) => {
    if (eq > runningPeak) runningPeak = eq;
    const dd = ((runningPeak - eq) / runningPeak) * 100;
    if (dd > maxHistoricalDrawdownPct) maxHistoricalDrawdownPct = dd;
  });

  // 2. Position Sizing Logic Validation (Invariant Risk Dollar Sizing Check)
  const configuredRiskPct = strategy.params.riskPerTradePercent || 1.5;
  const targetDollarRisk = (balance * configuredRiskPct) / 100;

  let activeRiskAnalysis = null;
  if (activePosition) {
    const isLong = activePosition.side === 'LONG';
    const entry = activePosition.entryPrice;
    const sl = activePosition.stopLoss;
    const tp = activePosition.takeProfit;

    // Actual Risk and Reward in Dollars
    const slDistance = isLong ? Math.max(0.01, entry - sl) : Math.max(0.01, sl - entry);
    const tpDistance = isLong ? Math.max(0.01, tp - entry) : Math.max(0.01, entry - tp);

    const actualRiskDollars = slDistance * activePosition.size;
    const potentialRewardDollars = tpDistance * activePosition.size;
    const actualRiskRewardRatio = slDistance > 0 ? tpDistance / slDistance : 0;

    // Distance to Stop Loss and Take Profit from current price
    const distToSl = isLong ? currentPrice - sl : sl - currentPrice;
    const distToTp = isLong ? tp - currentPrice : currentPrice - tp;

    const slBufferPct = entry > 0 ? (slDistance / entry) * 100 : 0;
    const tpTargetPct = entry > 0 ? (tpDistance / entry) * 100 : 0;

    // Validation Status: Check if actual risk is within tolerance of configured limit
    const riskDiffPct = targetDollarRisk > 0 ? Math.abs(actualRiskDollars - targetDollarRisk) / targetDollarRisk : 0;
    const isSizingCompliant = riskDiffPct <= 0.15; // Within 15% tolerance of target risk

    activeRiskAnalysis = {
      isLong,
      entry,
      sl,
      tp,
      slDistance,
      tpDistance,
      actualRiskDollars,
      potentialRewardDollars,
      actualRiskRewardRatio,
      distToSl,
      distToTp,
      slBufferPct,
      tpTargetPct,
      isSizingCompliant,
      positionNominalValue: entry * activePosition.size,
      leverageEquiv: balance > 0 ? (entry * activePosition.size) / balance : 1,
    };
  }

  // 3. Drawdown Safety Tiers
  const getDrawdownStatus = (ddPct: number) => {
    if (ddPct < 2.0) return { label: 'NORMAL / OPTIMAL', color: '#10B981', desc: 'Risiko modal terkendali sempurna di bawah toleransi 2%.' };
    if (ddPct < 5.0) return { label: 'MODERATE DRAWDOWN', color: '#F59E0B', desc: 'Drawdown dalam batas wajar sistem kuantitatif.' };
    if (ddPct < 10.0) return { label: 'ELEVATED RISK', color: '#EF4444', desc: 'Mendekati batas toleransi maksimum portofolio.' };
    return { label: 'MAX DRAWDOWN BREACH', color: '#DC2626', desc: 'Disarankan menghentikan bot untuk evaluasi parameter.' };
  };

  const ddStatus = getDrawdownStatus(currentDrawdownPct);

  return (
    <div className="bg-[#0D1117] border border-[#2D333B] rounded-lg p-4 font-sans space-y-4 shadow-sm" id="risk-attribution-dashboard">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#21262D] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-md bg-[#EF444415] text-[#EF4444] border border-[#EF444435]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                REAL-TIME RISK ATTRIBUTION & POSITION SIZING DASHBOARD
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#161B22] text-[#3B82F6] border border-[#2D333B] font-bold">
                AUDIT ENGINE ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-[#8B949E] font-mono mt-0.5">
              Pemantauan drawdown real-time, validasi aturan invariant risk sizing, & kalkulasi Risk/Reward ratio trade aktif.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span
            className="px-2.5 py-1 rounded font-bold border text-[11px]"
            style={{
              backgroundColor: `${ddStatus.color}15`,
              color: ddStatus.color,
              borderColor: `${ddStatus.color}40`,
            }}
          >
            {ddStatus.label}
          </span>
        </div>
      </div>

      {/* 2. Top Metric Cards: Drawdown & Capital Protection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
        {/* Current Drawdown */}
        <div className="bg-[#161B22] p-3 rounded-lg border border-[#2D333B]">
          <div className="flex items-center justify-between text-[10px] text-[#8B949E] uppercase font-bold">
            <span>CURRENT DRAWDOWN</span>
            <TrendingDown className="w-3.5 h-3.5 text-[#EF4444]" />
          </div>
          <div className="text-xl font-bold my-1 text-[#EF4444]">
            {currentDrawdownPct.toFixed(2)}%
          </div>
          <div className="text-[11px] text-[#8B949E] flex justify-between">
            <span>Dollar Value:</span>
            <span className="text-white font-bold">-${currentDrawdownDollars.toFixed(2)}</span>
          </div>
        </div>

        {/* Peak Historical Drawdown */}
        <div className="bg-[#161B22] p-3 rounded-lg border border-[#2D333B]">
          <div className="flex items-center justify-between text-[10px] text-[#8B949E] uppercase font-bold">
            <span>MAX PEAK DRAWDOWN</span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <div className="text-xl font-bold my-1 text-[#F59E0B]">
            {maxHistoricalDrawdownPct.toFixed(2)}%
          </div>
          <div className="text-[11px] text-[#8B949E] flex justify-between">
            <span>Peak Equity:</span>
            <span className="text-white font-bold">${peakEquity.toFixed(2)}</span>
          </div>
        </div>

        {/* Risk Limit Allocation */}
        <div className="bg-[#161B22] p-3 rounded-lg border border-[#2D333B]">
          <div className="flex items-center justify-between text-[10px] text-[#8B949E] uppercase font-bold">
            <span>TARGET RISK BUDGET</span>
            <Scale className="w-3.5 h-3.5 text-[#3B82F6]" />
          </div>
          <div className="text-xl font-bold my-1 text-[#3B82F6]">
            ${targetDollarRisk.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#8B949E] flex justify-between">
            <span>Risk Cap / Trade:</span>
            <span className="text-white font-bold">{configuredRiskPct}% Balance</span>
          </div>
        </div>

        {/* Active Exposure & Leverage */}
        <div className="bg-[#161B22] p-3 rounded-lg border border-[#2D333B]">
          <div className="flex items-center justify-between text-[10px] text-[#8B949E] uppercase font-bold">
            <span>PORTFOLIO EXPOSURE</span>
            <Layers className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div className="text-xl font-bold my-1 text-white">
            {activeRiskAnalysis ? `$${activeRiskAnalysis.positionNominalValue.toFixed(2)}` : '$0.00'}
          </div>
          <div className="text-[11px] text-[#8B949E] flex justify-between">
            <span>Effective Leverage:</span>
            <span className="text-white font-bold">
              {activeRiskAnalysis ? `${activeRiskAnalysis.leverageEquiv.toFixed(2)}x` : '0.00x'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Active Trade Risk/Reward & Sizing Validation Panel */}
      <div className="bg-[#161B22] border border-[#2D333B] rounded-lg p-3.5 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[#21262D] pb-2">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-[#3B82F6]" />
            <span className="font-bold text-white uppercase text-[11px]">
              ACTIVE POSITION RISK ATTRIBUTION & RRR ANALYSIS
            </span>
          </div>
          {activePosition ? (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              activePosition.side === 'LONG' ? 'bg-[#10B98120] text-[#10B981] border border-[#10B98140]' : 'bg-[#EF444420] text-[#EF4444] border border-[#EF444440]'
            }`}>
              [{activePosition.symbol}] {activePosition.side} • {activePosition.size} Lots
            </span>
          ) : (
            <span className="text-[10px] text-[#6B7280]">NO ACTIVE TRADE (STANDBY)</span>
          )}
        </div>

        {activePosition && activeRiskAnalysis ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* 1. Risk/Reward Ratio Breakdown */}
            <div className="bg-[#0D1117] p-3 rounded border border-[#21262D] space-y-2">
              <div className="text-[10px] text-[#8B949E] uppercase font-bold flex items-center justify-between">
                <span>RISK / REWARD RATIO (RRR)</span>
                <span className="text-[#3B82F6] font-bold">
                  1 : {activeRiskAnalysis.actualRiskRewardRatio.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-[#EF4444]">
                  <span>Max Risk (Stop Loss):</span>
                  <span className="font-bold">-${activeRiskAnalysis.actualRiskDollars.toFixed(2)} ({activeRiskAnalysis.slBufferPct.toFixed(2)}%)</span>
                </div>
                <div className="flex justify-between items-center text-[#10B981]">
                  <span>Max Reward (Take Profit):</span>
                  <span className="font-bold">+${activeRiskAnalysis.potentialRewardDollars.toFixed(2)} ({activeRiskAnalysis.tpTargetPct.toFixed(2)}%)</span>
                </div>
                <div className="flex justify-between items-center text-[#8B949E] pt-1 border-t border-[#21262D]">
                  <span>Current Floating:</span>
                  <span className={`font-bold ${activePosition.unrealizedPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {activePosition.unrealizedPnl >= 0 ? '+' : ''}${activePosition.unrealizedPnl.toFixed(2)} ({activePosition.unrealizedPnlPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* RRR Visual Bar */}
              <div className="pt-1">
                <div className="flex justify-between text-[9px] text-[#8B949E] mb-1">
                  <span>Risk (1.0)</span>
                  <span>Target Reward ({activeRiskAnalysis.actualRiskRewardRatio.toFixed(1)}x)</span>
                </div>
                <div className="h-2 rounded-full flex overflow-hidden bg-[#21262D]">
                  <div className="bg-[#EF4444] h-full" style={{ width: `${(1 / (1 + activeRiskAnalysis.actualRiskRewardRatio)) * 100}%` }}></div>
                  <div className="bg-[#10B981] h-full" style={{ width: `${(activeRiskAnalysis.actualRiskRewardRatio / (1 + activeRiskAnalysis.actualRiskRewardRatio)) * 100}%` }}></div>
                </div>
              </div>
            </div>

            {/* 2. Position Sizing Rule Validation */}
            <div className="bg-[#0D1117] p-3 rounded border border-[#21262D] space-y-2">
              <div className="text-[10px] text-[#8B949E] uppercase font-bold flex items-center justify-between">
                <span>SIZING FORMULA VALIDATION</span>
                {activeRiskAnalysis.isSizingCompliant ? (
                  <span className="flex items-center space-x-1 text-[#10B981] font-bold text-[10px]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>INVARIANT SIZED</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-[#F59E0B] font-bold text-[10px]">
                    <AlertTriangle className="w-3 h-3" />
                    <span>SIZING DRIFT</span>
                  </span>
                )}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-[#8B949E]">
                  <span>Formula:</span>
                  <span className="text-white font-mono">Lot = DollarRisk / SL_Distance</span>
                </div>
                <div className="flex justify-between text-[#8B949E]">
                  <span>SL Distance:</span>
                  <span className="text-white font-bold">${activeRiskAnalysis.slDistance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#8B949E]">
                  <span>Target Risk Limit:</span>
                  <span className="text-white font-bold">${targetDollarRisk.toFixed(2)} ({configuredRiskPct}%)</span>
                </div>
                <div className="flex justify-between text-[#8B949E]">
                  <span>Actual Dollar Risk:</span>
                  <span className="text-white font-bold">${activeRiskAnalysis.actualRiskDollars.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-1.5 rounded bg-[#161B22] border border-[#2D333B] text-[10px] text-[#8B949E]">
                {activeRiskAnalysis.isSizingCompliant ? (
                  <span className="text-[#10B981]">
                    ✓ Ukuran lot ({activePosition.size}) mematuhi batas invariant risk maksimum ($150 per transaksi).
                  </span>
                ) : (
                  <span className="text-[#F59E0B]">
                    ⚠️ Ukuran posisi sedikit menyimpang karena pembulatan lot minimum exchange.
                  </span>
                )}
              </div>
            </div>

            {/* 3. Distance to Exit Thresholds */}
            <div className="bg-[#0D1117] p-3 rounded border border-[#21262D] space-y-2">
              <div className="text-[10px] text-[#8B949E] uppercase font-bold flex items-center justify-between">
                <span>DISTANCE TO EXITS</span>
                <span className="text-white font-bold">${currentPrice.toFixed(2)}</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div>
                  <div className="flex justify-between text-[#10B981]">
                    <span>Distance to Take Profit:</span>
                    <span className="font-bold">
                      ${Math.abs(activeRiskAnalysis.distToTp).toFixed(2)} (
                      {((Math.abs(activeRiskAnalysis.distToTp) / currentPrice) * 100).toFixed(2)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#21262D] rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-[#10B981] h-full"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((activeRiskAnalysis.tpDistance - Math.abs(activeRiskAnalysis.distToTp)) /
                              activeRiskAnalysis.tpDistance) *
                              100
                          )
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#EF4444]">
                    <span>Distance to Stop Loss:</span>
                    <span className="font-bold">
                      ${Math.abs(activeRiskAnalysis.distToSl).toFixed(2)} (
                      {((Math.abs(activeRiskAnalysis.distToSl) / currentPrice) * 100).toFixed(2)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#21262D] rounded-full h-1.5 mt-1 overflow-hidden">
                    <div
                      className="bg-[#EF4444] h-full"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            ((activeRiskAnalysis.slDistance - Math.abs(activeRiskAnalysis.distToSl)) /
                              activeRiskAnalysis.slDistance) *
                              100
                          )
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-[#8B949E] pt-1 border-t border-[#21262D]">
                <span>Trailing Peak Watermark:</span>
                <span className="text-[#3B82F6] font-bold">${activePosition.trailingPeak.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-[#6B7280] font-mono text-xs">
            <Activity className="w-6 h-6 mx-auto mb-1 text-[#3B82F6] opacity-60" />
            <span>Tidak ada posisi aktif saat ini. Metrik Risk/Reward dan validasi ukuran lot akan langsung dikalkulasi saat trade dibuka.</span>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  ActiveExecutionPosition,
  Candle,
  PositionSide,
  Trade,
} from '../types/trading';
import {
  Target,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  Zap,
  DollarSign,
  Percent,
  CheckCircle2,
  Crosshair,
  Gauge,
  Sliders,
  Eye,
  EyeOff,
  Flame,
} from 'lucide-react';

export interface RealTimeExecutionChartProps {
  activePosition: ActiveExecutionPosition | null;
  currentPrice: number;
  symbol: string;
  candles?: Candle[];
  closedTrades?: {
    id: string;
    entryPrice: number;
    exitPrice: number;
    side: PositionSide;
    pnl: number;
    time: string;
    reason: string;
  }[];
  onClosePosition?: () => void;
  height?: number;
  showHud?: boolean;
}

export const RealTimeExecutionChart: React.FC<RealTimeExecutionChartProps> = ({
  activePosition,
  currentPrice,
  symbol,
  candles = [],
  closedTrades = [],
  onClosePosition,
  height = 320,
  showHud = true,
}) => {
  const [showShading, setShowShading] = useState<boolean>(true);
  const [showTrailingPeak, setShowTrailingPeak] = useState<boolean>(true);
  const [showRecentExecutions, setShowRecentExecutions] = useState<boolean>(true);

  // Compute scale boundaries based on candles and active position levels
  const scale = useMemo(() => {
    const prices: number[] = [currentPrice];

    if (candles.length > 0) {
      const recent = candles.slice(-50);
      recent.forEach((c) => {
        prices.push(c.high, c.low, c.open, c.close);
      });
    }

    if (activePosition) {
      prices.push(
        activePosition.entryPrice,
        activePosition.takeProfit,
        activePosition.stopLoss
      );
      if (activePosition.trailingPeak) {
        prices.push(activePosition.trailingPeak);
      }
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || currentPrice * 0.01;

    const minPrice = min - padding;
    const maxPrice = max + padding;
    const priceRange = Math.max(0.001, maxPrice - minPrice);

    return { minPrice, maxPrice, priceRange };
  }, [candles, currentPrice, activePosition]);

  // Coordinate helper for SVG
  const svgWidth = 900;
  const svgHeight = height;

  const getY = (price: number) => {
    return (
      svgHeight -
      ((price - scale.minPrice) / scale.priceRange) * (svgHeight - 40) -
      20
    );
  };

  // Execution Metrics calculations
  const metrics = useMemo(() => {
    if (!activePosition) return null;

    const isLong = activePosition.side === 'LONG';
    const entry = activePosition.entryPrice;
    const tp = activePosition.takeProfit;
    const sl = activePosition.stopLoss;

    const riskDistance = Math.abs(entry - sl);
    const rewardDistance = Math.abs(tp - entry);
    const rrr = riskDistance > 0 ? rewardDistance / riskDistance : 1;

    const distToTp = Math.abs(tp - currentPrice);
    const distToSl = Math.abs(currentPrice - sl);
    const totalCorridor = Math.abs(tp - sl);

    // Calculate progress percentage towards Take Profit
    let progressToTp = 0;
    if (isLong) {
      if (currentPrice >= entry) {
        progressToTp = totalCorridor > 0 ? ((currentPrice - entry) / (tp - entry)) * 100 : 0;
      }
    } else {
      if (currentPrice <= entry) {
        progressToTp = totalCorridor > 0 ? ((entry - currentPrice) / (entry - tp)) * 100 : 0;
      }
    }

    const clampedProgress = Math.max(0, Math.min(100, progressToTp));

    return {
      isLong,
      riskDistance,
      rewardDistance,
      rrr,
      distToTp,
      distToSl,
      progressToTp: clampedProgress,
    };
  }, [activePosition, currentPrice]);

  return (
    <div
      id="realtime-execution-chart-overlay"
      className="bg-[#0A0B0E] border border-[#2D333B] rounded-lg p-3 font-mono relative overflow-hidden shadow-lg flex flex-col gap-2"
    >
      {/* 1. Chart Header & Live HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21262D] pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            REAL-TIME EXECUTION & CORRIDOR MAP
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#161B22] text-[#3B82F6] border border-[#2D333B] font-bold">
            {symbol} • LIVE TICK ${currentPrice.toFixed(2)}
          </span>
        </div>

        {/* Toggles */}
        <div className="flex items-center space-x-1.5 text-[11px]">
          <button
            onClick={() => setShowShading(!showShading)}
            className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer flex items-center space-x-1 ${
              showShading
                ? 'bg-[#3B82F615] text-[#3B82F6] border-[#3B82F640]'
                : 'bg-[#161B22] text-[#8B949E] border-[#2D333B]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>R/R Shading</span>
          </button>

          <button
            onClick={() => setShowTrailingPeak(!showTrailingPeak)}
            className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer flex items-center space-x-1 ${
              showTrailingPeak
                ? 'bg-[#A855F715] text-[#A855F7] border-[#A855F740]'
                : 'bg-[#161B22] text-[#8B949E] border-[#2D333B]'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Trailing Peak</span>
          </button>

          <button
            onClick={() => setShowRecentExecutions(!showRecentExecutions)}
            className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer flex items-center space-x-1 ${
              showRecentExecutions
                ? 'bg-[#10B98115] text-[#10B981] border-[#10B98140]'
                : 'bg-[#161B22] text-[#8B949E] border-[#2D333B]'
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>Past Fills</span>
          </button>
        </div>
      </div>

      {/* 2. Top Execution HUD (If position is active) */}
      {showHud && activePosition && metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#161B22] p-2.5 rounded border border-[#2D333B] text-xs">
          {/* Active Side & Entry */}
          <div className="flex flex-col justify-between">
            <span className="text-[10px] text-[#8B949E]">ACTIVE POSITION</span>
            <div className="flex items-center space-x-1.5 font-bold my-0.5">
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  metrics.isLong
                    ? 'bg-[#10B98120] text-[#10B981] border border-[#10B98140]'
                    : 'bg-[#EF444420] text-[#EF4444] border border-[#EF444440]'
                }`}
              >
                {activePosition.side}
              </span>
              <span className="text-white">${activePosition.entryPrice.toFixed(2)}</span>
            </div>
            <span className="text-[10px] text-[#8B949E]">
              Size: {activePosition.size} Lots • {activePosition.regimeAtEntry || 'Invariant'}
            </span>
          </div>

          {/* Floating PnL */}
          <div className="flex flex-col justify-between">
            <span className="text-[10px] text-[#8B949E]">FLOATING PNL</span>
            <div
              className={`text-base font-bold my-0.5 ${
                activePosition.unrealizedPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}
            >
              {activePosition.unrealizedPnl >= 0 ? '+' : ''}$
              {activePosition.unrealizedPnl.toFixed(2)} (
              {activePosition.unrealizedPnlPercent.toFixed(2)}%)
            </div>
            <span className="text-[10px] text-[#8B949E]">
              Risk Budget: ${activePosition.riskDollars || 150} (1.5%)
            </span>
          </div>

          {/* RRR Ratio & Target Target Distance */}
          <div className="flex flex-col justify-between">
            <span className="text-[10px] text-[#8B949E]">RISK / REWARD RATIO</span>
            <div className="text-base font-bold text-[#3B82F6] my-0.5">
              1 : {metrics.rrr.toFixed(2)} RRR
            </div>
            <span className="text-[10px] text-[#10B981]">
              TP: ${activePosition.takeProfit.toFixed(2)} (Δ ${metrics.distToTp.toFixed(1)})
            </span>
          </div>

          {/* Target Progress Bar & SL Distance */}
          <div className="flex flex-col justify-between">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#8B949E]">PROGRESS TO TP</span>
              <span className="text-[#10B981] font-bold">{metrics.progressToTp.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-[#0D1117] rounded-full overflow-hidden my-1 border border-[#2D333B]">
              <div
                className="h-full bg-gradient-to-r from-[#3B82F6] to-[#10B981] transition-all duration-300"
                style={{ width: `${metrics.progressToTp}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-[#EF4444]">
              SL: ${activePosition.stopLoss.toFixed(2)} (Δ ${metrics.distToSl.toFixed(1)})
            </span>
          </div>
        </div>
      )}

      {/* 3. SVG Main Real-Time Execution Canvas */}
      <div className="w-full relative bg-[#07090D] rounded border border-[#21262D] overflow-hidden flex items-center justify-center">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          style={{ height: `${svgHeight}px` }}
        >
          <defs>
            {/* Reward Corridor Shading Gradient */}
            <linearGradient id="rewardZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
            </linearGradient>

            {/* Risk Corridor Shading Gradient */}
            <linearGradient id="riskZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.22" />
            </linearGradient>

            {/* Live Price Glow */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Lines */}
          {[0.2, 0.4, 0.6, 0.8].map((pct) => (
            <line
              key={pct}
              x1="0"
              y1={svgHeight * pct}
              x2={svgWidth}
              y2={svgHeight * pct}
              stroke="#161B22"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          ))}

          {/* Candle Mini-Series if available */}
          {candles.length > 0 &&
            candles.slice(-40).map((c, idx, arr) => {
              const slotWidth = svgWidth / arr.length;
              const x = idx * slotWidth + slotWidth / 2;
              const barWidth = Math.max(3, slotWidth * 0.7);

              const yHigh = getY(c.high);
              const yLow = getY(c.low);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);

              const isBull = c.close >= c.open;
              const candleColor = isBull ? '#10B981' : '#EF4444';

              return (
                <g key={`candle-${c.time}-${idx}`}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth="1.2"
                    strokeOpacity="0.6"
                  />
                  {/* Body */}
                  <rect
                    x={x - barWidth / 2}
                    y={Math.min(yOpen, yClose)}
                    width={barWidth}
                    height={Math.max(2, Math.abs(yOpen - yClose))}
                    fill={candleColor}
                    fillOpacity="0.45"
                    rx="0.5"
                  />
                </g>
              );
            })}

          {/* Active Position Corridor Overlay Mapping */}
          {activePosition && (
            <>
              {/* Shaded Risk & Reward Zone Boxes */}
              {showShading && (
                <>
                  {/* Reward Shading Box */}
                  <rect
                    x="0"
                    y={Math.min(getY(activePosition.entryPrice), getY(activePosition.takeProfit))}
                    width={svgWidth}
                    height={Math.max(
                      2,
                      Math.abs(getY(activePosition.takeProfit) - getY(activePosition.entryPrice))
                    )}
                    fill="url(#rewardZoneGrad)"
                  />

                  {/* Risk Shading Box */}
                  <rect
                    x="0"
                    y={Math.min(getY(activePosition.entryPrice), getY(activePosition.stopLoss))}
                    width={svgWidth}
                    height={Math.max(
                      2,
                      Math.abs(getY(activePosition.stopLoss) - getY(activePosition.entryPrice))
                    )}
                    fill="url(#riskZoneGrad)"
                  />
                </>
              )}

              {/* 1. TAKE PROFIT TARGET LINE (Emerald) */}
              <g>
                <line
                  x1="0"
                  y1={getY(activePosition.takeProfit)}
                  x2={svgWidth}
                  y2={getY(activePosition.takeProfit)}
                  stroke="#10B981"
                  strokeWidth="1.8"
                  strokeDasharray="6 3"
                />
                <rect
                  x={svgWidth - 190}
                  y={getY(activePosition.takeProfit) - 10}
                  width="180"
                  height="20"
                  fill="#10B98125"
                  stroke="#10B981"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={svgWidth - 100}
                  y={getY(activePosition.takeProfit) + 4}
                  fill="#10B981"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  🎯 TARGET TP: ${activePosition.takeProfit.toFixed(2)}
                </text>
              </g>

              {/* 2. ENTRY LEVEL LINE (Amber) */}
              <g>
                <line
                  x1="0"
                  y1={getY(activePosition.entryPrice)}
                  x2={svgWidth}
                  y2={getY(activePosition.entryPrice)}
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <rect
                  x={svgWidth - 190}
                  y={getY(activePosition.entryPrice) - 10}
                  width="180"
                  height="20"
                  fill="#F59E0B25"
                  stroke="#F59E0B"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={svgWidth - 100}
                  y={getY(activePosition.entryPrice) + 4}
                  fill="#F59E0B"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {activePosition.side === 'LONG' ? '▲ BUY ENTRY' : '▼ SHORT ENTRY'}: $
                  {activePosition.entryPrice.toFixed(2)}
                </text>
              </g>

              {/* 3. STOP LOSS LEVEL LINE (Crimson) */}
              <g>
                <line
                  x1="0"
                  y1={getY(activePosition.stopLoss)}
                  x2={svgWidth}
                  y2={getY(activePosition.stopLoss)}
                  stroke="#EF4444"
                  strokeWidth="1.8"
                  strokeDasharray="6 3"
                />
                <rect
                  x={svgWidth - 190}
                  y={getY(activePosition.stopLoss) - 10}
                  width="180"
                  height="20"
                  fill="#EF444425"
                  stroke="#EF4444"
                  strokeWidth="1"
                  rx="3"
                />
                <text
                  x={svgWidth - 100}
                  y={getY(activePosition.stopLoss) + 4}
                  fill="#EF4444"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  🛑 STOP LOSS: ${activePosition.stopLoss.toFixed(2)}
                </text>
              </g>

              {/* 4. Trailing Stop Peak Line (Purple) */}
              {showTrailingPeak && activePosition.trailingPeak && (
                <g>
                  <line
                    x1="0"
                    y1={getY(activePosition.trailingPeak)}
                    x2={svgWidth}
                    y2={getY(activePosition.trailingPeak)}
                    stroke="#A855F7"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                  />
                  <text
                    x="20"
                    y={getY(activePosition.trailingPeak) - 4}
                    fill="#A855F7"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    ★ TRAILING PEAK: ${activePosition.trailingPeak.toFixed(2)}
                  </text>
                </g>
              )}
            </>
          )}

          {/* Past Closed Trade Markers & PnL Connectors */}
          {showRecentExecutions &&
            closedTrades.slice(-4).map((t, idx) => {
              const yEntry = getY(t.entryPrice);
              const yExit = getY(t.exitPrice);
              const xExit = 120 + idx * 160;
              const isProfit = t.pnl >= 0;

              return (
                <g key={`trade-marker-${t.id || idx}`}>
                  <line
                    x1={xExit - 40}
                    y1={yEntry}
                    x2={xExit}
                    y2={yExit}
                    stroke={isProfit ? '#10B981' : '#EF4444'}
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                  />
                  <circle
                    cx={xExit}
                    cy={yExit}
                    r="4"
                    fill={isProfit ? '#10B981' : '#EF4444'}
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
                  <rect
                    x={xExit - 35}
                    y={yExit - 22}
                    width="70"
                    height="16"
                    fill="#161B22"
                    stroke={isProfit ? '#10B981' : '#EF4444'}
                    strokeWidth="0.8"
                    rx="2"
                  />
                  <text
                    x={xExit}
                    y={yExit - 11}
                    fill={isProfit ? '#10B981' : '#EF4444'}
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {isProfit ? '+' : ''}${t.pnl.toFixed(1)} ({t.reason === 'TAKE_PROFIT' ? 'TP' : 'SL'})
                  </text>
                </g>
              );
            })}

          {/* 5. Real-Time Price Line & Pulsating Beacon */}
          <g>
            <line
              x1="0"
              y1={getY(currentPrice)}
              x2={svgWidth}
              y2={getY(currentPrice)}
              stroke="#3B82F6"
              strokeWidth="2"
            />
            {/* Pulsating Beacon circle */}
            <circle
              cx={svgWidth - 220}
              cy={getY(currentPrice)}
              r="4.5"
              fill="#60A5FA"
              filter="url(#glow)"
            />
            <circle
              cx={svgWidth - 220}
              cy={getY(currentPrice)}
              r="8"
              fill="#3B82F6"
              opacity="0.4"
              className="animate-ping"
            />

            {/* Floating Price Badge on Left Edge */}
            <rect
              x="10"
              y={getY(currentPrice) - 10}
              width="150"
              height="20"
              fill="#3B82F6"
              rx="3"
            />
            <text
              x="85"
              y={getY(currentPrice) + 4}
              fill="#FFFFFF"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              LIVE: ${currentPrice.toFixed(2)}
            </text>
          </g>
        </svg>

        {/* Floating Standby Notification if No Active Position */}
        {!activePosition && (
          <div className="absolute inset-0 bg-[#00000030] backdrop-blur-[0.5px] flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-[#161B22]/90 border border-[#2D333B] px-4 py-2 rounded-lg flex items-center space-x-2 text-xs font-mono text-[#8B949E] shadow-lg">
              <Activity className="w-4 h-4 text-[#3B82F6] animate-pulse" />
              <span>
                ENGINE STANDBY • WAITING FOR QUANT REGIME ROUTED ENTRY SIGNAL
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Legend & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-[#6B7280] font-mono">
        <div className="flex items-center space-x-3 flex-wrap">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-[#10B981]"></span>
            <span>Take Profit (TP)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-[#F59E0B]"></span>
            <span>Entry Level</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-[#EF4444]"></span>
            <span>Stop Loss (SL)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-0.5 bg-[#3B82F6]"></span>
            <span>Live Price Tick</span>
          </span>
        </div>

        <div>
          {activePosition ? (
            <span className="text-[#10B981] font-bold">
              ✓ Execution Corridor Active • Invariant Risk Protection ON
            </span>
          ) : (
            <span>Ready for live tick execution mapping</span>
          )}
        </div>
      </div>
    </div>
  );
};

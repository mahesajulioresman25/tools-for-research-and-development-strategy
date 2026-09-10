import React, { useState, useRef, useMemo } from 'react';
import {
  Candle,
  Trade,
  DetectedPattern,
  IndicatorMap,
  ActiveExecutionPosition,
} from '../types/trading';
import { calculateMarketRegime } from '../utils/regimeDetector';
import { MarketRegimeBar } from './MarketRegimeBar';
import {
  Maximize2,
  Eye,
  EyeOff,
  Layers,
  Crosshair,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Target,
  ShieldAlert,
  Zap,
  Activity,
} from 'lucide-react';

interface CandleChartProps {
  candles: Candle[];
  trades: Trade[];
  patterns: DetectedPattern[];
  indicators: IndicatorMap;
  symbol: string;
  interval: string;
  activePosition?: ActiveExecutionPosition | null;
  livePrice?: number;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  candles,
  trades,
  patterns,
  indicators,
  symbol,
  interval,
  activePosition,
  livePrice,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showPatterns, setShowPatterns] = useState(true);
  const [showTrades, setShowTrades] = useState(true);
  const [showEMA, setShowEMA] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showExecutionOverlay, setShowExecutionOverlay] = useState(true);
  const [visibleCount, setVisibleCount] = useState<number>(80);

  const containerRef = useRef<HTMLDivElement>(null);

  // Slice visible candles from end
  const visibleCandles = useMemo(() => {
    if (candles.length <= visibleCount) return candles;
    return candles.slice(candles.length - visibleCount);
  }, [candles, visibleCount]);

  const offsetIndex = candles.length - visibleCandles.length;

  // Quantitative Market Regime State Engine
  const regimeState = useMemo(() => {
    return calculateMarketRegime(candles, 10000, 1.5);
  }, [candles]);

  // Calculate Price Range with active position consideration
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 0, maxPrice: 1, maxVolume: 1 };
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    if (activePosition && showExecutionOverlay) {
      min = Math.min(min, activePosition.entryPrice, activePosition.stopLoss, activePosition.takeProfit);
      max = Math.max(max, activePosition.entryPrice, activePosition.stopLoss, activePosition.takeProfit);
      if (activePosition.trailingPeak) {
        min = Math.min(min, activePosition.trailingPeak);
        max = Math.max(max, activePosition.trailingPeak);
      }
    }
    if (livePrice && showExecutionOverlay) {
      min = Math.min(min, livePrice);
      max = Math.max(max, livePrice);
    }

    // Add padding
    const padding = (max - min) * 0.06 || 10;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      maxVolume: maxVol || 1,
    };
  }, [visibleCandles, activePosition, showExecutionOverlay, livePrice]);

  // Coordinate scales
  const chartHeight = 360;
  const volumeHeight = 70;
  const rsiHeight = 90;
  const totalSvgHeight = chartHeight + volumeHeight + rsiHeight + 30;

  const getY = (price: number) => {
    if (maxPrice === minPrice) return chartHeight / 2;
    return chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * (chartHeight - 20) - 10;
  };

  const getVolY = (volume: number) => {
    return (
      chartHeight +
      volumeHeight -
      (volume / maxVolume) * (volumeHeight - 10)
    );
  };

  const getRsiY = (rsiVal: number) => {
    const rsiTop = chartHeight + volumeHeight + 20;
    return rsiTop + rsiHeight - (rsiVal / 100) * (rsiHeight - 10) - 5;
  };

  // SVG coordinate helpers
  const getX = (idx: number, total: number, width: number) => {
    const slotWidth = width / total;
    return idx * slotWidth + slotWidth / 2;
  };

  // Hovered candle data
  const hoveredCandle = hoverIndex !== null && visibleCandles[hoverIndex] ? visibleCandles[hoverIndex] : null;
  const hoveredGlobalIndex = hoverIndex !== null ? offsetIndex + hoverIndex : null;

  return (
    <div
      id="candle-chart-container"
      className="bg-[#0D1117] border border-[#2D333B] rounded-lg p-3.5 shadow-sm flex flex-col font-sans gap-2"
    >
      {/* Market Regime Badge & Risk Auto-Tuner HUD */}
      <MarketRegimeBar
        regimeState={regimeState}
        symbol={symbol}
        currentPrice={candles[candles.length - 1]?.close || 0}
      />

      {/* Chart Header & Layer Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5 pb-2 border-b border-[#2D333B]">
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-xs font-mono">{symbol}</span>
              <span className="text-[10px] bg-[#161B22] text-[#9CA3AF] px-1.5 py-0.5 rounded border border-[#2D333B] font-mono">
                {interval}
              </span>
              <span className="text-[10px] text-[#6B7280] font-mono">
                ({visibleCandles.length} candles in buffer)
              </span>
            </div>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center space-x-1.5 flex-wrap text-xs font-mono">
          {/* Zoom buttons */}
          <div className="flex items-center bg-[#161B22] border border-[#2D333B] rounded p-0.5">
            <button
              onClick={() => setVisibleCount((prev) => Math.min(candles.length, prev + 20))}
              className="px-2 py-0.5 text-[10px] text-[#9CA3AF] hover:text-white"
              title="Perluas Rentang Lilin"
            >
              - Zoom Out
            </button>
            <span className="text-[#2D333B] px-1">|</span>
            <button
              onClick={() => setVisibleCount((prev) => Math.max(30, prev - 20))}
              className="px-2 py-0.5 text-[10px] text-[#9CA3AF] hover:text-white"
              title="Persempit Lilin"
            >
              + Zoom In
            </button>
          </div>

          <button
            onClick={() => setShowPatterns(!showPatterns)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded border text-[11px] transition-all ${
              showPatterns
                ? 'bg-[#F59E0B15] border-[#F59E0B50] text-[#F59E0B]'
                : 'bg-[#161B22] border-[#2D333B] text-[#6B7280]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>FVG / Sweeps</span>
          </button>

          <button
            onClick={() => setShowTrades(!showTrades)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded border text-[11px] transition-all ${
              showTrades
                ? 'bg-[#10B98115] border-[#10B98150] text-[#10B981]'
                : 'bg-[#161B22] border-[#2D333B] text-[#6B7280]'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>Algo Orders</span>
          </button>

          <button
            onClick={() => setShowExecutionOverlay(!showExecutionOverlay)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded border text-[11px] font-bold transition-all ${
              showExecutionOverlay
                ? 'bg-[#F59E0B20] border-[#F59E0B60] text-[#F59E0B]'
                : 'bg-[#161B22] border-[#2D333B] text-[#6B7280]'
            }`}
            title="Tampilkan / Sembunyikan Real-Time Entry, Stop Loss & Take Profit Corridor"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Live Execution (TP/SL)</span>
            {activePosition && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping ml-0.5"></span>
            )}
          </button>

          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`flex items-center space-x-1 px-2 py-1 rounded border text-[10px] ${
              showEMA
                ? 'bg-[#3B82F615] border-[#3B82F650] text-[#3B82F6]'
                : 'bg-[#161B22] border-[#2D333B] text-[#6B7280]'
            }`}
          >
            EMA (20/50)
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`flex items-center space-x-1 px-2 py-1 rounded border text-[10px] ${
              showBollinger
                ? 'bg-[#8B5CF615] border-[#8B5CF650] text-[#8B5CF6]'
                : 'bg-[#161B22] border-[#2D333B] text-[#6B7280]'
            }`}
          >
            Bollinger (2.0)
          </button>
        </div>
      </div>

      {/* Active Live Execution HUD Overlay Banner */}
      {showExecutionOverlay && activePosition && (
        <div className="bg-[#161B22] border border-[#2D333B] p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2.5 font-mono text-xs shadow-md">
          <div className="flex items-center space-x-3 flex-wrap">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
              <span className="text-[10px] text-[#8B949E] uppercase font-bold">LIVE POSITION:</span>
              <span
                className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                  activePosition.side === 'LONG'
                    ? 'bg-[#10B98120] text-[#10B981] border-[#10B98140]'
                    : 'bg-[#EF444420] text-[#EF4444] border-[#EF444440]'
                }`}
              >
                {activePosition.side} {activePosition.size} Lots
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-[#8B949E]">Entry:</span>
              <span className="text-[#F59E0B] font-bold">${activePosition.entryPrice.toFixed(2)}</span>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-[#8B949E]">TP:</span>
              <span className="text-[#10B981] font-bold">${activePosition.takeProfit.toFixed(2)}</span>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-[#8B949E]">SL:</span>
              <span className="text-[#EF4444] font-bold">${activePosition.stopLoss.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="text-[#8B949E]">Floating PnL:</span>
              <span
                className={`font-bold ${
                  activePosition.unrealizedPnl >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {activePosition.unrealizedPnl >= 0 ? '+' : ''}$
                {activePosition.unrealizedPnl.toFixed(2)} ({activePosition.unrealizedPnlPercent.toFixed(2)}%)
              </span>
            </div>

            {livePrice && (
              <div className="bg-[#0D1117] px-2 py-0.5 rounded border border-[#2D333B] text-[10px] text-[#38BDF8] font-bold flex items-center space-x-1">
                <Activity className="w-3 h-3 text-[#38BDF8]" />
                <span>Mark: ${livePrice.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candlestick OHLC Bar details on hover */}
      <div className="h-6 flex items-center space-x-4 text-[11px] font-mono text-[#D1D5DB] mb-1 px-1 overflow-x-auto">
        {hoveredCandle ? (
          <>
            <span className="text-[#6B7280]">
              {new Date(hoveredCandle.time * 1000).toLocaleString('id-ID', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span>
              O: <span className="text-white">${hoveredCandle.open.toFixed(2)}</span>
            </span>
            <span>
              H: <span className="text-[#10B981]">${hoveredCandle.high.toFixed(2)}</span>
            </span>
            <span>
              L: <span className="text-[#EF4444]">${hoveredCandle.low.toFixed(2)}</span>
            </span>
            <span>
              C:{' '}
              <span
                className={
                  hoveredCandle.close >= hoveredCandle.open ? 'text-[#10B981]' : 'text-[#EF4444]'
                }
              >
                ${hoveredCandle.close.toFixed(2)}
              </span>
            </span>
            <span>
              Vol: <span className="text-[#3B82F6]">{hoveredCandle.volume.toFixed(1)}</span>
            </span>
            {hoveredGlobalIndex !== null && indicators.rsi?.[hoveredGlobalIndex] && (
              <span>
                RSI(14):{' '}
                <span className="text-[#A855F7] font-bold">
                  {indicators.rsi[hoveredGlobalIndex]?.toFixed(1)}
                </span>
              </span>
            )}
          </>
        ) : (
          <span className="text-[#6B7280] text-[10px] uppercase tracking-wider">
            Hover over candlestick chart to inspect precision tick & indicator values
          </span>
        )}
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-[#0A0B0E] rounded border border-[#2D333B] cursor-crosshair select-none"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 1000 ${totalSvgHeight}`}
          className="w-full h-auto block"
          preserveAspectRatio="none"
          onMouseMove={(e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const normalizedX = mouseX / rect.width;
            const idx = Math.floor(normalizedX * visibleCandles.length);
            if (idx >= 0 && idx < visibleCandles.length) {
              setHoverIndex(idx);
            }
          }}
        >
          <defs>
            {/* Gradient for Bollinger Bands Fill */}
            <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="rsiOverboughtGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="rsiOversoldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
            </linearGradient>
            {/* Execution Corridor Shading Gradients */}
            <linearGradient id="candleRewardZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="candleRiskZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.22" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
            const y = chartHeight * ratio;
            const price = maxPrice - ratio * (maxPrice - minPrice);
            return (
              <g key={`grid-${ratio}`}>
                <line x1="0" y1={y} x2="1000" y2={y} stroke="#21262D" strokeDasharray="3 3" strokeWidth="0.8" />
                <text x="990" y={y - 3} fill="#6B7280" fontSize="9" textAnchor="end" fontFamily="monospace">
                  ${price.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Divider between Main chart & Volume */}
          <line x1="0" y1={chartHeight} x2="1000" y2={chartHeight} stroke="#2D333B" strokeWidth="1" />
          <text x="12" y={chartHeight + 14} fill="#6B7280" fontSize="8" fontWeight="bold" fontFamily="monospace">
            VOLUME LADDER
          </text>

          {/* Divider between Volume & RSI */}
          <line
            x1="0"
            y1={chartHeight + volumeHeight}
            x2="1000"
            y2={chartHeight + volumeHeight}
            stroke="#2D333B"
            strokeWidth="1"
          />
          <text x="12" y={chartHeight + volumeHeight + 14} fill="#3B82F6" fontSize="8" fontWeight="bold" fontFamily="monospace">
            RSI(14) OSCILLATOR
          </text>

          {/* RSI Background bands (30 and 70) */}
          <line
            x1="0"
            y1={getRsiY(70)}
            x2="1000"
            y2={getRsiY(70)}
            stroke="#ef4444"
            strokeDasharray="2 2"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />
          <text x="990" y={getRsiY(70) - 2} fill="#ef4444" fontSize="8" textAnchor="end" fontFamily="monospace">
            70 OB
          </text>

          <line
            x1="0"
            y1={getRsiY(30)}
            x2="1000"
            y2={getRsiY(30)}
            stroke="#10b981"
            strokeDasharray="2 2"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />
          <text x="990" y={getRsiY(30) + 9} fill="#10b981" fontSize="8" textAnchor="end" fontFamily="monospace">
            30 OS
          </text>

          {/* 1. Draw Fair Value Gaps (FVG) boxes if enabled */}
          {showPatterns &&
            patterns
              .filter((p) => p.type === 'FVG' && p.topPrice && p.bottomPrice)
              .map((p) => {
                const candleIdx = p.candleIndex - offsetIndex;
                if (candleIdx < 0 || candleIdx >= visibleCandles.length) return null;

                const x = getX(candleIdx, visibleCandles.length, 1000);
                const width = (1000 / visibleCandles.length) * 3; // span 3 candles
                const yTop = getY(p.topPrice!);
                const yBottom = getY(p.bottomPrice!);
                const height = Math.max(2, Math.abs(yBottom - yTop));
                const isBullish = p.direction === 'BULLISH';

                return (
                  <g key={p.id}>
                    <rect
                      x={Math.max(0, x - width / 3)}
                      y={Math.min(yTop, yBottom)}
                      width={width}
                      height={height}
                      fill={isBullish ? '#10b981' : '#ef4444'}
                      fillOpacity="0.18"
                      stroke={isBullish ? '#10b981' : '#ef4444'}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={x}
                      y={Math.min(yTop, yBottom) - 3}
                      fill={isBullish ? '#10b981' : '#ef4444'}
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {isBullish ? 'Bullish FVG' : 'Bearish FVG'}
                    </text>
                  </g>
                );
              })}

          {/* 2. Draw Bollinger Bands */}
          {showBollinger && (
            <>
              {/* Upper band */}
              <path
                d={visibleCandles
                  .map((_, i) => {
                    const gIdx = offsetIndex + i;
                    const val = indicators.bbUpper?.[gIdx];
                    if (val === null || val === undefined) return '';
                    const x = getX(i, visibleCandles.length, 1000);
                    const y = getY(val);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1"
                strokeOpacity="0.5"
                strokeDasharray="2 2"
              />
              {/* Lower band */}
              <path
                d={visibleCandles
                  .map((_, i) => {
                    const gIdx = offsetIndex + i;
                    const val = indicators.bbLower?.[gIdx];
                    if (val === null || val === undefined) return '';
                    const x = getX(i, visibleCandles.length, 1000);
                    const y = getY(val);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="1"
                strokeOpacity="0.5"
                strokeDasharray="2 2"
              />
            </>
          )}

          {/* 3. Draw EMAs */}
          {showEMA && (
            <>
              {/* Fast EMA 20 (Cyan/Blue) */}
              <path
                d={visibleCandles
                  .map((_, i) => {
                    const gIdx = offsetIndex + i;
                    const val = indicators.emaFast?.[gIdx];
                    if (val === null || val === undefined) return '';
                    const x = getX(i, visibleCandles.length, 1000);
                    const y = getY(val);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              {/* Slow EMA 50 (Amber) */}
              <path
                d={visibleCandles
                  .map((_, i) => {
                    const gIdx = offsetIndex + i;
                    const val = indicators.emaSlow?.[gIdx];
                    if (val === null || val === undefined) return '';
                    const x = getX(i, visibleCandles.length, 1000);
                    const y = getY(val);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* 4. Draw Candlesticks and Volume Bars */}
          {visibleCandles.map((c, i) => {
            const x = getX(i, visibleCandles.length, 1000);
            const slotW = 1000 / visibleCandles.length;
            const barW = Math.max(2, slotW * 0.75);

            const isBullish = c.close >= c.open;
            const color = isBullish ? '#10b981' : '#ef4444';

            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const yHigh = getY(c.high);
            const yLow = getY(c.low);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(1.5, Math.abs(yOpen - yClose));

            const volY = getVolY(c.volume);
            const volH = chartHeight + volumeHeight - volY;

            return (
              <g key={`candle-${c.time}-${i}`}>
                {/* Volume Bar */}
                <rect
                  x={x - barW / 2}
                  y={volY}
                  width={barW}
                  height={volH}
                  fill={color}
                  fillOpacity="0.35"
                />

                {/* Candle Wick (High to Low) */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={color}
                  strokeWidth="1.2"
                />

                {/* Candle Body */}
                <rect
                  x={x - barW / 2}
                  y={bodyTop}
                  width={barW}
                  height={bodyHeight}
                  fill={color}
                  rx="0.5"
                />
              </g>
            );
          })}

          {/* 5. Draw Liquidity Sweeps & Stop Hunt markers */}
          {showPatterns &&
            patterns
              .filter((p) => p.type === 'LIQUIDITY_SWEEP')
              .map((p) => {
                const candleIdx = p.candleIndex - offsetIndex;
                if (candleIdx < 0 || candleIdx >= visibleCandles.length) return null;
                const x = getX(candleIdx, visibleCandles.length, 1000);
                const isBull = p.direction === 'BULLISH';
                const y = isBull ? getY(p.price) + 14 : getY(p.price) - 14;

                return (
                  <g key={p.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r="3.5"
                      fill={isBull ? '#10b981' : '#ef4444'}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={isBull ? y + 10 : y - 6}
                      fill={isBull ? '#10b981' : '#ef4444'}
                      fontSize="7.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {isBull ? '⚡ Liq Grab' : '⚡ Stop Hunt'}
                    </text>
                  </g>
                );
              })}

          {/* 6. Draw Algorithmic Trade Markers (Entry, TP, SL) */}
          {showTrades &&
            trades.map((trade) => {
              const entryIdx = trade.entryIndex - offsetIndex;
              const hasEntry = entryIdx >= 0 && entryIdx < visibleCandles.length;
              const exitIdx = trade.exitIndex !== undefined ? trade.exitIndex - offsetIndex : -1;
              const hasExit = exitIdx >= 0 && exitIdx < visibleCandles.length;

              const isLong = trade.side === 'LONG';
              const entryColor = isLong ? '#10b981' : '#ef4444';
              const isProfit = (trade.pnl || 0) > 0;

              return (
                <g key={trade.id}>
                  {/* Entry Marker */}
                  {hasEntry && (
                    <g>
                      <polygon
                        points={
                          isLong
                            ? `${getX(entryIdx, visibleCandles.length, 1000)},${getY(trade.entryPrice) + 8} ${
                                getX(entryIdx, visibleCandles.length, 1000) - 5
                              },${getY(trade.entryPrice) + 17} ${
                                getX(entryIdx, visibleCandles.length, 1000) + 5
                              },${getY(trade.entryPrice) + 17}`
                            : `${getX(entryIdx, visibleCandles.length, 1000)},${getY(trade.entryPrice) - 8} ${
                                getX(entryIdx, visibleCandles.length, 1000) - 5
                              },${getY(trade.entryPrice) - 17} ${
                                getX(entryIdx, visibleCandles.length, 1000) + 5
                              },${getY(trade.entryPrice) - 17}`
                        }
                        fill={entryColor}
                        stroke="#ffffff"
                        strokeWidth="0.8"
                      />
                      <text
                        x={getX(entryIdx, visibleCandles.length, 1000)}
                        y={isLong ? getY(trade.entryPrice) + 26 : getY(trade.entryPrice) - 20}
                        fill={entryColor}
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {isLong ? '▲ BUY' : '▼ SHORT'}
                      </text>
                    </g>
                  )}

                  {/* Exit Marker & Connection Line */}
                  {hasExit && trade.exitPrice && (
                    <g>
                      {hasEntry && (
                        <line
                          x1={getX(entryIdx, visibleCandles.length, 1000)}
                          y1={getY(trade.entryPrice)}
                          x2={getX(exitIdx, visibleCandles.length, 1000)}
                          y2={getY(trade.exitPrice)}
                          stroke={isProfit ? '#10b981' : '#ef4444'}
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )}
                      <circle
                        cx={getX(exitIdx, visibleCandles.length, 1000)}
                        cy={getY(trade.exitPrice)}
                        r="3.5"
                        fill={isProfit ? '#10b981' : '#ef4444'}
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      <text
                        x={getX(exitIdx, visibleCandles.length, 1000)}
                        y={getY(trade.exitPrice) - 6}
                        fill={isProfit ? '#10b981' : '#ef4444'}
                        fontSize="7.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {trade.exitReason === 'TAKE_PROFIT'
                          ? '🎯 TP'
                          : trade.exitReason === 'TRAILING_STOP'
                          ? '🚀 Trail'
                          : '🛑 SL'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

          {/* 6b. Draw Real-Time Execution Corridor (TP, Entry, SL, Trailing) during Live Simulation */}
          {showExecutionOverlay && activePosition && (
            <g id="realtime-execution-corridor">
              {/* Shaded Reward Zone Corridor */}
              <rect
                x="0"
                y={Math.min(getY(activePosition.entryPrice), getY(activePosition.takeProfit))}
                width="1000"
                height={Math.max(
                  2,
                  Math.abs(getY(activePosition.takeProfit) - getY(activePosition.entryPrice))
                )}
                fill="url(#candleRewardZoneGrad)"
              />

              {/* Shaded Risk Zone Corridor */}
              <rect
                x="0"
                y={Math.min(getY(activePosition.entryPrice), getY(activePosition.stopLoss))}
                width="1000"
                height={Math.max(
                  2,
                  Math.abs(getY(activePosition.stopLoss) - getY(activePosition.entryPrice))
                )}
                fill="url(#candleRiskZoneGrad)"
              />

              {/* TAKE PROFIT LEVEL LINE (Emerald) */}
              <g>
                <line
                  x1="0"
                  y1={getY(activePosition.takeProfit)}
                  x2="1000"
                  y2={getY(activePosition.takeProfit)}
                  stroke="#10B981"
                  strokeWidth="1.8"
                  strokeDasharray="5 3"
                />
                <rect
                  x="820"
                  y={getY(activePosition.takeProfit) - 10}
                  width="170"
                  height="20"
                  fill="#10B981"
                  rx="3"
                />
                <text
                  x="905"
                  y={getY(activePosition.takeProfit) + 4}
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  🎯 TARGET TP: ${activePosition.takeProfit.toFixed(2)}
                </text>
              </g>

              {/* ENTRY PRICE LEVEL LINE (Amber) */}
              <g>
                <line
                  x1="0"
                  y1={getY(activePosition.entryPrice)}
                  x2="1000"
                  y2={getY(activePosition.entryPrice)}
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <rect
                  x="820"
                  y={getY(activePosition.entryPrice) - 10}
                  width="170"
                  height="20"
                  fill="#F59E0B"
                  rx="3"
                />
                <text
                  x="905"
                  y={getY(activePosition.entryPrice) + 4}
                  fill="#000000"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {activePosition.side === 'LONG' ? '▲ BUY' : '▼ SHORT'} @ ${activePosition.entryPrice.toFixed(2)}
                </text>
              </g>

              {/* STOP LOSS LEVEL LINE (Crimson) */}
              <g>
                <line
                  x1="0"
                  y1={getY(activePosition.stopLoss)}
                  x2="1000"
                  y2={getY(activePosition.stopLoss)}
                  stroke="#EF4444"
                  strokeWidth="1.8"
                  strokeDasharray="5 3"
                />
                <rect
                  x="820"
                  y={getY(activePosition.stopLoss) - 10}
                  width="170"
                  height="20"
                  fill="#EF4444"
                  rx="3"
                />
                <text
                  x="905"
                  y={getY(activePosition.stopLoss) + 4}
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  🛑 STOP LOSS: ${activePosition.stopLoss.toFixed(2)}
                </text>
              </g>

              {/* Trailing Stop Peak Line if exists */}
              {activePosition.trailingPeak && (
                <g>
                  <line
                    x1="0"
                    y1={getY(activePosition.trailingPeak)}
                    x2="1000"
                    y2={getY(activePosition.trailingPeak)}
                    stroke="#A855F7"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x="20"
                    y={getY(activePosition.trailingPeak) - 4}
                    fill="#A855F7"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    ★ TRAIL PEAK: ${activePosition.trailingPeak.toFixed(2)}
                  </text>
                </g>
              )}

              {/* Live Floating Price Marker Line & Beacon if livePrice available */}
              {livePrice && (
                <g>
                  <line
                    x1="0"
                    y1={getY(livePrice)}
                    x2="1000"
                    y2={getY(livePrice)}
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="800"
                    cy={getY(livePrice)}
                    r="4"
                    fill="#38BDF8"
                  />
                  <circle
                    cx="800"
                    cy={getY(livePrice)}
                    r="8"
                    fill="#38BDF8"
                    opacity="0.3"
                    className="animate-ping"
                  />
                </g>
              )}
            </g>
          )}

          {/* 7. Draw RSI Line in Subchart */}
          <path
            d={visibleCandles
              .map((_, i) => {
                const gIdx = offsetIndex + i;
                const rsiVal = indicators.rsi?.[gIdx];
                if (rsiVal === null || rsiVal === undefined) return '';
                const x = getX(i, visibleCandles.length, 1000);
                const y = getRsiY(rsiVal);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.5"
          />

          {/* 8. Crosshair on Mouse Hover */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex, visibleCandles.length, 1000)}
                y1="0"
                x2={getX(hoverIndex, visibleCandles.length, 1000)}
                y2={totalSvgHeight}
                stroke="#484F58"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {hoveredCandle && (
                <line
                  x1="0"
                  y1={getY(hoveredCandle.close)}
                  x2="1000"
                  y2={getY(hoveredCandle.close)}
                  stroke="#484F58"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Indicator Legend & Strategy Explanations */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 text-[10px] text-[#6B7280] font-mono border-t border-[#2D333B]">
        <div className="flex items-center space-x-3.5 flex-wrap">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8]"></span>
            <span>EMA(20)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
            <span>EMA(50)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span>
            <span>BBands(2.0)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded bg-[#10b981]/30 border border-[#10b981]"></span>
            <span>Fair Value Gap</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>
            <span>RSI(14)</span>
          </span>
        </div>

        <div className="text-[#6B7280]">
          Simulating Maker/Taker Spread & Order Latency Model
        </div>
      </div>
    </div>
  );
};

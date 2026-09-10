import React, { useState, useMemo } from 'react';
import { AssetScanItem } from '../types/trading';
import {
  Flame,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Search,
  Filter,
  BarChart3,
  Layers,
  ShieldAlert,
  Compass,
  Maximize2,
  RefreshCw,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface VolatilityHeatmapProps {
  assets: AssetScanItem[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export type HeatmapMetricMode = 'RANGE_PCT' | 'ALPHA_SCORE' | 'ADX_MOMENTUM' | 'ORDERBOOK_IMBALANCE';
export type HeatmapViewMode = 'GRID' | 'QUADRANT' | 'COMPACT_TILES';

export const VolatilityHeatmap: React.FC<VolatilityHeatmapProps> = ({
  assets,
  selectedSymbol,
  onSelectSymbol,
  isLoading = false,
  onRefresh,
}) => {
  const [metricMode, setMetricMode] = useState<HeatmapMetricMode>('RANGE_PCT');
  const [viewMode, setViewMode] = useState<HeatmapViewMode>('GRID');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegime, setSelectedRegime] = useState<string>('ALL');
  const [onlyHighAlpha, setOnlyHighAlpha] = useState<boolean>(false);
  const [hoveredAsset, setHoveredAsset] = useState<AssetScanItem | null>(null);

  // Compute enriched metrics for each asset
  const enrichedAssets = useMemo(() => {
    return assets.map((asset) => {
      const price = asset.price || 1;
      const high = asset.high24h || price * 1.02;
      const low = asset.low24h || price * 0.98;
      const rangePct = Math.max(0.1, ((high - low) / price) * 100);
      const absChange = Math.abs(asset.change24h || 0);

      // Volatility tier determination
      let volTier: 'EXPANSION' | 'MOMENTUM' | 'NORMAL' | 'SQUEEZE' = 'NORMAL';
      if (rangePct >= 5.0 || absChange >= 4.0) {
        volTier = 'EXPANSION';
      } else if (rangePct >= 3.0 || absChange >= 2.0) {
        volTier = 'MOMENTUM';
      } else if (rangePct <= 1.2 && asset.adx < 18) {
        volTier = 'SQUEEZE';
      }

      // Alpha Opportunity Rating
      const isHighAlpha = asset.alphaScore >= 70;

      // Recommended Sizing Multiplier (Inverse Volatility / Kelly Criterion weighting)
      const sizingMultiplier = parseFloat(
        Math.max(0.4, Math.min(2.0, 1.5 / (rangePct / 2.5))).toFixed(2)
      );

      return {
        ...asset,
        rangePct,
        absChange,
        volTier,
        isHighAlpha,
        sizingMultiplier,
      };
    });
  }, [assets]);

  // Filter and Sort Assets
  const filteredAssets = useMemo(() => {
    return enrichedAssets
      .filter((item) => {
        const matchSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.displaySymbol.toLowerCase().includes(searchQuery.toLowerCase());
        const matchRegime = selectedRegime === 'ALL' || item.regime === selectedRegime;
        const matchAlpha = !onlyHighAlpha || item.isHighAlpha;
        return matchSearch && matchRegime && matchAlpha;
      })
      .sort((a, b) => {
        if (metricMode === 'RANGE_PCT') return b.rangePct - a.rangePct;
        if (metricMode === 'ALPHA_SCORE') return b.alphaScore - a.alphaScore;
        if (metricMode === 'ADX_MOMENTUM') return b.adx - a.adx;
        if (metricMode === 'ORDERBOOK_IMBALANCE') {
          return Math.abs(b.orderbookImbalance - 1) - Math.abs(a.orderbookImbalance - 1);
        }
        return b.alphaScore - a.alphaScore;
      });
  }, [enrichedAssets, searchQuery, selectedRegime, onlyHighAlpha, metricMode]);

  // Aggregate Market Stats
  const stats = useMemo(() => {
    if (enrichedAssets.length === 0) {
      return {
        avgVolatility: 0,
        maxVolAsset: null,
        topAlphaAsset: null,
        squeezeCount: 0,
        expansionCount: 0,
      };
    }

    const totalRange = enrichedAssets.reduce((acc, curr) => acc + curr.rangePct, 0);
    const avgVolatility = totalRange / enrichedAssets.length;
    const sortedByVol = [...enrichedAssets].sort((a, b) => b.rangePct - a.rangePct);
    const sortedByAlpha = [...enrichedAssets].sort((a, b) => b.alphaScore - a.alphaScore);
    const squeezeCount = enrichedAssets.filter((a) => a.volTier === 'SQUEEZE').length;
    const expansionCount = enrichedAssets.filter((a) => a.volTier === 'EXPANSION').length;

    return {
      avgVolatility,
      maxVolAsset: sortedByVol[0] || null,
      topAlphaAsset: sortedByAlpha[0] || null,
      squeezeCount,
      expansionCount,
    };
  }, [enrichedAssets]);

  // Helper for Heatmap Color Intensity
  const getTileHeatStyle = (asset: typeof enrichedAssets[0]) => {
    if (metricMode === 'RANGE_PCT') {
      const val = asset.rangePct;
      if (val >= 5.0) {
        return {
          bg: 'bg-gradient-to-br from-[#EF444425] via-[#DC262615] to-[#161B22]',
          border: 'border-[#EF444480]',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
          badgeBg: 'bg-[#EF444420] text-[#EF4444] border-[#EF444450]',
          heatLabel: 'ULTRA HIGH VOL (EXPANSION)',
        };
      } else if (val >= 3.0) {
        return {
          bg: 'bg-gradient-to-br from-[#F59E0B22] via-[#D9770610] to-[#161B22]',
          border: 'border-[#F59E0B70]',
          glow: 'shadow-[0_0_12px_rgba(245,158,11,0.12)]',
          badgeBg: 'bg-[#F59E0B20] text-[#F59E0B] border-[#F59E0B50]',
          heatLabel: 'HIGH VOLATILITY',
        };
      } else if (val >= 1.8) {
        return {
          bg: 'bg-gradient-to-br from-[#10B98118] via-[#05966908] to-[#161B22]',
          border: 'border-[#10B98150]',
          glow: '',
          badgeBg: 'bg-[#10B98120] text-[#10B981] border-[#10B98140]',
          heatLabel: 'MODERATE MOMENTUM',
        };
      } else {
        return {
          bg: 'bg-gradient-to-br from-[#38BDF815] via-[#0284C708] to-[#161B22]',
          border: 'border-[#38BDF840]',
          glow: '',
          badgeBg: 'bg-[#38BDF815] text-[#38BDF8] border-[#38BDF830]',
          heatLabel: 'COMPRESSION / SQUEEZE',
        };
      }
    } else if (metricMode === 'ALPHA_SCORE') {
      const val = asset.alphaScore;
      if (val >= 80) {
        return {
          bg: 'bg-gradient-to-br from-[#10B98128] via-[#05966915] to-[#161B22]',
          border: 'border-[#10B98180]',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
          badgeBg: 'bg-[#10B98125] text-[#10B981] border-[#10B98160]',
          heatLabel: 'CRITICAL ALPHA (OPTIMAL)',
        };
      } else if (val >= 60) {
        return {
          bg: 'bg-gradient-to-br from-[#3B82F622] via-[#2563EB10] to-[#161B22]',
          border: 'border-[#3B82F660]',
          glow: '',
          badgeBg: 'bg-[#3B82F620] text-[#3B82F6] border-[#3B82F640]',
          heatLabel: 'STRONG ALPHA',
        };
      } else {
        return {
          bg: 'bg-[#161B22]',
          border: 'border-[#2D333B]',
          glow: '',
          badgeBg: 'bg-[#21262D] text-[#8B949E] border-[#30363D]',
          heatLabel: 'MODERATE / NEUTRAL',
        };
      }
    } else if (metricMode === 'ADX_MOMENTUM') {
      const val = asset.adx;
      if (val >= 35) {
        return {
          bg: 'bg-gradient-to-br from-[#8B5CF625] via-[#7C3AED10] to-[#161B22]',
          border: 'border-[#8B5CF670]',
          glow: 'shadow-[0_0_12px_rgba(139,92,246,0.15)]',
          badgeBg: 'bg-[#8B5CF620] text-[#8B5CF6] border-[#8B5CF650]',
          heatLabel: 'STRONG TREND (ADX > 35)',
        };
      } else if (val >= 22) {
        return {
          bg: 'bg-gradient-to-br from-[#3B82F618] to-[#161B22]',
          border: 'border-[#3B82F650]',
          glow: '',
          badgeBg: 'bg-[#3B82F615] text-[#3B82F6] border-[#3B82F630]',
          heatLabel: 'DEVELOPING TREND',
        };
      } else {
        return {
          bg: 'bg-[#161B22]',
          border: 'border-[#2D333B]',
          glow: '',
          badgeBg: 'bg-[#21262D] text-[#6E7681] border-[#30363D]',
          heatLabel: 'CHOPPY / NO TREND',
        };
      }
    } else {
      const imb = asset.orderbookImbalance;
      if (imb >= 1.25) {
        return {
          bg: 'bg-gradient-to-br from-[#10B98122] to-[#161B22]',
          border: 'border-[#10B98160]',
          glow: '',
          badgeBg: 'bg-[#10B98120] text-[#10B981] border-[#10B98140]',
          heatLabel: 'BID HEAVY (BUY PRESSURE)',
        };
      } else if (imb <= 0.8) {
        return {
          bg: 'bg-gradient-to-br from-[#EF444422] to-[#161B22]',
          border: 'border-[#EF444460]',
          glow: '',
          badgeBg: 'bg-[#EF444420] text-[#EF4444] border-[#EF444440]',
          heatLabel: 'ASK HEAVY (SELL PRESSURE)',
        };
      } else {
        return {
          bg: 'bg-[#161B22]',
          border: 'border-[#2D333B]',
          glow: '',
          badgeBg: 'bg-[#21262D] text-[#8B949E] border-[#30363D]',
          heatLabel: 'BALANCED ORDERBOOK',
        };
      }
    }
  };

  return (
    <div className="bg-[#0D1117] border border-[#2D333B] rounded-lg p-4 font-sans space-y-4 shadow-xl">
      {/* 1. Header Bar & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#21262D] pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-[#EF444420] to-[#F59E0B20] text-[#F59E0B] border border-[#F59E0B40] shadow-sm">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <span>VOLATILITY HEATMAP & ALPHA MATRIX</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161B22] text-[#10B981] border border-[#10B98130] flex items-center space-x-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                <span>REAL-TIME VOL FEED ({enrichedAssets.length} ASSETS)</span>
              </span>
            </div>
            <p className="text-xs text-[#8B949E] font-mono mt-0.5">
              Pemetaan visual volatilitas multi-dimensi, kompresi ATR, dan densitas alpha untuk memicu eksekusi breakout kuantitatif.
            </p>
          </div>
        </div>

        {/* View Switches & Refresh */}
        <div className="flex items-center space-x-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-[#161B22] p-1 rounded-lg border border-[#2D333B] text-xs font-mono">
            <button
              onClick={() => setViewMode('GRID')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'GRID' ? 'bg-[#3B82F6] text-white font-bold' : 'text-[#8B949E] hover:text-white'
              }`}
              title="Bento Heatmap Grid"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>HEAT TILES</span>
            </button>
            <button
              onClick={() => setViewMode('QUADRANT')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'QUADRANT' ? 'bg-[#3B82F6] text-white font-bold' : 'text-[#8B949E] hover:text-white'
              }`}
              title="Matrix Scatter Quadrant (Alpha vs Volatility)"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>ALPHA MATRIX</span>
            </button>
            <button
              onClick={() => setViewMode('COMPACT_TILES')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'COMPACT_TILES' ? 'bg-[#3B82F6] text-white font-bold' : 'text-[#8B949E] hover:text-white'
              }`}
              title="Compact Quick Matrix"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>COMPACT</span>
            </button>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-[#161B22] text-[#8B949E] hover:text-white border border-[#2D333B] hover:bg-[#21262D] transition-colors cursor-pointer"
              title="Segarkan data volatilitas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#3B82F6]' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metric KPI Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="bg-[#161B22] p-2.5 rounded-lg border border-[#2D333B] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8B949E] uppercase font-semibold">Market Mean Volatility</span>
            <div className="text-base font-bold text-white mt-0.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#38BDF8]" />
              <span>{stats.avgVolatility.toFixed(2)}% Range</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#38BDF815] text-[#38BDF8] border border-[#38BDF830] text-[10px] font-bold">
            24H HIGH/LOW
          </span>
        </div>

        <div className="bg-[#161B22] p-2.5 rounded-lg border border-[#2D333B] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8B949E] uppercase font-semibold">Highest Volatility Asset</span>
            <div className="text-base font-bold text-[#EF4444] mt-0.5 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#EF4444]" />
              <span>{stats.maxVolAsset ? `${stats.maxVolAsset.displaySymbol} (${stats.maxVolAsset.rangePct.toFixed(1)}%)` : '-'}</span>
            </div>
          </div>
          {stats.maxVolAsset && (
            <button
              onClick={() => onSelectSymbol(stats.maxVolAsset.displaySymbol)}
              className="px-2 py-0.5 rounded bg-[#EF444420] text-[#EF4444] border border-[#EF444440] text-[10px] font-bold hover:bg-[#EF444430] transition-colors cursor-pointer"
            >
              FOCUS
            </button>
          )}
        </div>

        <div className="bg-[#161B22] p-2.5 rounded-lg border border-[#2D333B] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8B949E] uppercase font-semibold">Top Alpha Opportunity</span>
            <div className="text-base font-bold text-[#10B981] mt-0.5 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#10B981]" />
              <span>{stats.topAlphaAsset ? `${stats.topAlphaAsset.displaySymbol} (${stats.topAlphaAsset.alphaScore}/100)` : '-'}</span>
            </div>
          </div>
          {stats.topAlphaAsset && (
            <button
              onClick={() => onSelectSymbol(stats.topAlphaAsset.displaySymbol)}
              className="px-2 py-0.5 rounded bg-[#10B98120] text-[#10B981] border border-[#10B98140] text-[10px] font-bold hover:bg-[#10B98130] transition-colors cursor-pointer"
            >
              FOCUS
            </button>
          )}
        </div>

        <div className="bg-[#161B22] p-2.5 rounded-lg border border-[#2D333B] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#8B949E] uppercase font-semibold">Regime Opportunities</span>
            <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-2">
              <span className="text-[#EF4444]">🔥 {stats.expansionCount} Expansion</span>
              <span className="text-[#38BDF8]">❄️ {stats.squeezeCount} Squeeze</span>
            </div>
          </div>
          <span className="text-[10px] text-[#8B949E]">
            {stats.expansionCount > 0 ? 'High Momentum' : 'Coiled Energy'}
          </span>
        </div>
      </div>

      {/* 3. Heatmap Filter & Parameter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono bg-[#161B22] p-2.5 rounded-lg border border-[#2D333B]">
        {/* Metric Color Spectrum Selector */}
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-[10px] text-[#8B949E] uppercase font-bold flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-[#3B82F6]" />
            <span>Heat Spectrum:</span>
          </span>
          <div className="flex items-center space-x-1 bg-[#0D1117] p-0.5 rounded-md border border-[#21262D]">
            {[
              { id: 'RANGE_PCT', label: '24H VOLATILITY RANGE (%)' },
              { id: 'ALPHA_SCORE', label: 'ALPHA SCORE (0-100)' },
              { id: 'ADX_MOMENTUM', label: 'ADX TREND STRENGTH' },
              { id: 'ORDERBOOK_IMBALANCE', label: 'ORDERBOOK IMBALANCE' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMetricMode(m.id as HeatmapMetricMode)}
                className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                  metricMode === m.id
                    ? 'bg-[#3B82F6] text-white font-bold shadow-sm'
                    : 'text-[#8B949E] hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1.5 text-[#6E7681]" />
            <input
              type="text"
              placeholder="Search ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0D1117] border border-[#2D333B] rounded-md pl-8 pr-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-[#3B82F6] w-36"
            />
          </div>

          {/* High Alpha Toggle */}
          <button
            onClick={() => setOnlyHighAlpha(!onlyHighAlpha)}
            className={`px-2.5 py-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              onlyHighAlpha
                ? 'bg-[#10B98125] text-[#10B981] border-[#10B98160] ring-1 ring-[#10B981]/30'
                : 'bg-[#0D1117] text-[#8B949E] border-[#2D333B] hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>HIGH ALPHA ONLY (≥70)</span>
          </button>
        </div>
      </div>

      {/* 4. Heatmap Main Content Area */}

      {/* MODE A: BENTO HEAT TILES GRID */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredAssets.map((asset) => {
            const isSelected =
              selectedSymbol.replace('/', '').toUpperCase() === asset.symbol.replace('/', '').toUpperCase();
            const heat = getTileHeatStyle(asset);

            return (
              <div
                key={asset.symbol}
                onMouseEnter={() => setHoveredAsset(asset)}
                onMouseLeave={() => setHoveredAsset(null)}
                className={`relative rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between group ${
                  heat.bg
                } ${heat.border} ${heat.glow} ${
                  isSelected ? 'ring-2 ring-[#3B82F6] scale-[1.01]' : 'hover:scale-[1.01]'
                }`}
              >
                {/* Top Tile Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-white tracking-wide">
                          {asset.displaySymbol}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${heat.badgeBg}`}
                        >
                          {asset.volTier}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8B949E] font-mono">{asset.name}</span>
                    </div>

                    {/* 24h Change Pill */}
                    <div
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center space-x-1 ${
                        asset.change24h >= 0 ? 'bg-[#10B98120] text-[#10B981]' : 'bg-[#EF444420] text-[#EF4444]'
                      }`}
                    >
                      {asset.change24h >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {asset.change24h >= 0 ? '+' : ''}
                        {asset.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Price & Primary Heat Value */}
                  <div className="my-2.5 font-mono">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-white tracking-tight">
                        ${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2 })}
                      </span>
                      <span className="text-[11px] text-[#8B949E]">
                        Mark: ${(asset.markPrice || asset.price * 1.0001).toFixed(2)}
                      </span>
                    </div>

                    {/* Heat Focus Metric Display */}
                    <div className="mt-2 p-2 rounded bg-[#0A0B0E]/80 border border-[#21262D] flex items-center justify-between text-xs">
                      <span className="text-[10px] text-[#8B949E] uppercase font-semibold">
                        {metricMode === 'RANGE_PCT'
                          ? '24H Range Volatility'
                          : metricMode === 'ALPHA_SCORE'
                          ? 'Alpha Opp. Score'
                          : metricMode === 'ADX_MOMENTUM'
                          ? 'ADX Trend Strength'
                          : 'Orderbook Imbalance'}
                      </span>
                      <span className="font-bold text-sm text-white">
                        {metricMode === 'RANGE_PCT'
                          ? `${asset.rangePct.toFixed(2)}%`
                          : metricMode === 'ALPHA_SCORE'
                          ? `${asset.alphaScore}/100`
                          : metricMode === 'ADX_MOMENTUM'
                          ? `${asset.adx.toFixed(1)}`
                          : `${asset.orderbookImbalance}x`}
                      </span>
                    </div>
                  </div>

                  {/* Volatility & Regime Mini Gauges */}
                  <div className="space-y-1.5 font-mono text-[10px] my-2">
                    {/* Range High-Low Bar */}
                    <div>
                      <div className="flex justify-between text-[#8B949E] mb-0.5">
                        <span>Low: ${asset.low24h.toFixed(2)}</span>
                        <span>High: ${asset.high24h.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-[#21262D] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (asset.rangePct / 8) * 100)}%`,
                            backgroundColor:
                              asset.rangePct > 4.5
                                ? '#EF4444'
                                : asset.rangePct > 2.5
                                ? '#F59E0B'
                                : '#10B981',
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Secondary Metrics Badges */}
                    <div className="flex items-center justify-between pt-1 text-[#8B949E]">
                      <span>
                        ADX: <strong className="text-white">{asset.adx.toFixed(1)}</strong>
                      </span>
                      <span>
                        Spread: <strong className="text-white">{asset.spreadBps} bps</strong>
                      </span>
                      <span>
                        Size Multiplier: <strong className="text-[#38BDF8]">{asset.sizingMultiplier}x</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Tile Action Bar */}
                <div className="pt-2 border-t border-[#21262D]/60 flex items-center justify-between gap-2 mt-1">
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border"
                    style={{
                      backgroundColor: `${asset.regimeColor}15`,
                      color: asset.regimeColor,
                      borderColor: `${asset.regimeColor}35`,
                    }}
                  >
                    {asset.regimeLabel.split(' ')[0]}
                  </span>

                  <button
                    onClick={() => onSelectSymbol(asset.displaySymbol)}
                    className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-[#3B82F6] text-white shadow-md'
                        : 'bg-[#21262D] text-[#D1D5DB] hover:bg-[#3B82F6] hover:text-white'
                    }`}
                  >
                    <span>{isSelected ? 'ACTIVE IN BOT' : 'FOCUS & SIMULATE'}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE B: 2D ALPHA & VOLATILITY MATRIX QUADRANTS */}
      {viewMode === 'QUADRANT' && (
        <div className="space-y-3 font-mono">
          <div className="bg-[#0A0B0E] p-3 rounded-lg border border-[#2D333B] text-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-white uppercase flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#3B82F6]" />
                <span>2D QUANTITATIVE ALPHA VS. VOLATILITY OPPORTUNITY MATRIX</span>
              </span>
              <span className="text-[10px] text-[#8B949E]">
                X-Axis: 24h Volatility Range (%) | Y-Axis: Quantitative Alpha Score (0-100)
              </span>
            </div>

            {/* 4 Quadrants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Q1: HIGH ALPHA + HIGH VOLATILITY (OPTIMAL BREAKOUT ZONE) */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-[#10B98115] to-[#161B22] border border-[#10B98150]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#10B981] text-xs flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Q1: HIGH ALPHA + HIGH VOLATILITY (OPTIMAL HUNT)</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#10B98120] text-[#10B981] font-bold">
                    HIGHEST EXPECTANCY
                  </span>
                </div>
                <p className="text-[10px] text-[#8B949E] mb-2">
                  Aset dengan ekspansi momentum tinggi dan inefisiensi harga tajam—ideal untuk Breakout & Trend Following.
                </p>
                <div className="space-y-1.5">
                  {enrichedAssets
                    .filter((a) => a.alphaScore >= 65 && a.rangePct >= 2.5)
                    .map((a) => (
                      <div
                        key={a.symbol}
                        onClick={() => onSelectSymbol(a.displaySymbol)}
                        className="p-2 rounded bg-[#0D1117] border border-[#21262D] hover:border-[#10B981] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{a.displaySymbol}</span>
                          <span className="text-[#10B981] font-semibold text-[10px]">
                            Alpha: {a.alphaScore} | Vol: {a.rangePct.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-[#3B82F6] hover:underline">TRADE PAIR →</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Q2: HIGH ALPHA + LOW VOLATILITY (COILED SQUEEZE ZONE) */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-[#38BDF815] to-[#161B22] border border-[#38BDF850]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#38BDF8] text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Q2: HIGH ALPHA + COMPRESSION (COILED SQUEEZE)</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#38BDF820] text-[#38BDF8] font-bold">
                    IMMINENT BREAKOUT
                  </span>
                </div>
                <p className="text-[10px] text-[#8B949E] mb-2">
                  Volatilitas tertekan namun struktur alpha kuat—potensi ekspansi volatilitas besar dalam waktu dekat.
                </p>
                <div className="space-y-1.5">
                  {enrichedAssets
                    .filter((a) => a.alphaScore >= 65 && a.rangePct < 2.5)
                    .map((a) => (
                      <div
                        key={a.symbol}
                        onClick={() => onSelectSymbol(a.displaySymbol)}
                        className="p-2 rounded bg-[#0D1117] border border-[#21262D] hover:border-[#38BDF8] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{a.displaySymbol}</span>
                          <span className="text-[#38BDF8] font-semibold text-[10px]">
                            Alpha: {a.alphaScore} | Vol: {a.rangePct.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-[#3B82F6] hover:underline">TRADE PAIR →</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Q3: LOW ALPHA + HIGH VOLATILITY (WHIPSAW NOISE ZONE) */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-[#EF444415] to-[#161B22] border border-[#EF444450]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#EF4444] text-xs flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Q3: HIGH VOLATILITY + LOW ALPHA (WHIPSAW RISK)</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#EF444420] text-[#EF4444] font-bold">
                    TIGHT SL REQUIRED
                  </span>
                </div>
                <p className="text-[10px] text-[#8B949E] mb-2">
                  Pergerakan liar dengan arah acak (random noise)—perlu filter konfirmasi ATR & Orderbook ketat.
                </p>
                <div className="space-y-1.5">
                  {enrichedAssets
                    .filter((a) => a.alphaScore < 65 && a.rangePct >= 2.5)
                    .map((a) => (
                      <div
                        key={a.symbol}
                        onClick={() => onSelectSymbol(a.displaySymbol)}
                        className="p-2 rounded bg-[#0D1117] border border-[#21262D] hover:border-[#EF4444] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{a.displaySymbol}</span>
                          <span className="text-[#EF4444] font-semibold text-[10px]">
                            Alpha: {a.alphaScore} | Vol: {a.rangePct.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8B949E]">Scalp Only</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Q4: LOW ALPHA + LOW VOLATILITY (STAND ASIDE / DEAD CHOP) */}
              <div className="p-3 rounded-lg bg-[#161B22] border border-[#2D333B]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#8B949E] text-xs flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Q4: LOW VOLATILITY + LOW ALPHA (STAND ASIDE)</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#21262D] text-[#8B949E] font-bold">
                    CAPITAL PRESERVATION
                  </span>
                </div>
                <p className="text-[10px] text-[#8B949E] mb-2">
                  Likuiditas dan volatilitas rendah—bot mengabaikan setup pada kuadran ini untuk mencegah drawdown modal.
                </p>
                <div className="space-y-1.5">
                  {enrichedAssets
                    .filter((a) => a.alphaScore < 65 && a.rangePct < 2.5)
                    .map((a) => (
                      <div
                        key={a.symbol}
                        onClick={() => onSelectSymbol(a.displaySymbol)}
                        className="p-2 rounded bg-[#0D1117] border border-[#21262D] hover:border-[#6B7280] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#8B949E]">{a.displaySymbol}</span>
                          <span className="text-[#6B7280] text-[10px]">
                            Alpha: {a.alphaScore} | Vol: {a.rangePct.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-[#6B7280]">Low Priority</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE C: COMPACT HEATMAP TILES */}
      {viewMode === 'COMPACT_TILES' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono">
          {filteredAssets.map((asset) => {
            const isSelected =
              selectedSymbol.replace('/', '').toUpperCase() === asset.symbol.replace('/', '').toUpperCase();
            const heat = getTileHeatStyle(asset);

            return (
              <button
                key={asset.symbol}
                onClick={() => onSelectSymbol(asset.displaySymbol)}
                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  heat.bg
                } ${heat.border} ${
                  isSelected ? 'ring-2 ring-[#3B82F6] scale-105' : 'hover:border-white/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-xs">{asset.displaySymbol.split('/')[0]}</span>
                  <span
                    className={`text-[9px] font-bold ${
                      asset.change24h >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                    }`}
                  >
                    {asset.change24h >= 0 ? '+' : ''}
                    {asset.change24h.toFixed(1)}%
                  </span>
                </div>

                <div className="my-1">
                  <div className="text-[11px] font-bold text-white truncate">
                    ${asset.price < 1 ? asset.price.toFixed(4) : asset.price.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-[#8B949E]">
                    Vol: <strong className="text-white">{asset.rangePct.toFixed(1)}%</strong>
                  </div>
                </div>

                <div className="w-full bg-[#21262D] rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${asset.alphaScore}%`,
                      backgroundColor: asset.alphaScore >= 70 ? '#10B981' : '#3B82F6',
                    }}
                  ></div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 5. Quantitative Volatility Intelligence Footer Guide */}
      <div className="bg-[#161B22] p-3 rounded-lg border border-[#2D333B] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#8B949E]">
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          <span className="text-white font-bold flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Heat Spectrum Guide:</span>
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
            <span>Expansion Volatility (Range &gt; 5.0%)</span>
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
            <span>High Momentum (3.0% - 5.0%)</span>
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>Normal Trending (1.8% - 3.0%)</span>
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]"></span>
            <span>Compression Squeeze (&lt; 1.8%)</span>
          </span>
        </div>

        <div className="text-[11px] text-[#38BDF8] flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
          <span>Real-time Binance WebSocket & REST API Synced</span>
        </div>
      </div>
    </div>
  );
};

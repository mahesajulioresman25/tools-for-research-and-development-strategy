import React, { useState } from 'react';
import { AssetScanItem } from '../types/trading';
import { VolatilityHeatmap } from './VolatilityHeatmap';
import {
  Activity,
  Flame,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Filter,
  CheckCircle2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';

interface DynamicMarketScannerProps {
  assets: AssetScanItem[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  multiAssetHunting: boolean;
  onToggleMultiAssetHunting: () => void;
}

export const DynamicMarketScanner: React.FC<DynamicMarketScannerProps> = ({
  assets,
  selectedSymbol,
  onSelectSymbol,
  isLoading,
  onRefresh,
  multiAssetHunting,
  onToggleMultiAssetHunting,
}) => {
  const [scannerView, setScannerView] = useState<'TABLE' | 'HEATMAP'>('HEATMAP');
  const [filterRegime, setFilterRegime] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'ALPHA_SCORE' | 'CHANGE_24H' | 'ADX' | 'VOLUME'>('ALPHA_SCORE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAssets = assets
    .filter((asset) => {
      const matchSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.displaySymbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRegime = filterRegime === 'ALL' || asset.regime === filterRegime;
      return matchSearch && matchRegime;
    })
    .sort((a, b) => {
      if (sortBy === 'ALPHA_SCORE') return b.alphaScore - a.alphaScore;
      if (sortBy === 'CHANGE_24H') return Math.abs(b.change24h) - Math.abs(a.change24h);
      if (sortBy === 'ADX') return b.adx - a.adx;
      if (sortBy === 'VOLUME') return b.volume24hUsd - a.volume24hUsd;
      return 0;
    });

  const bestOpportunity = assets.length > 0 ? [...assets].sort((a, b) => b.alphaScore - a.alphaScore)[0] : null;

  return (
    <div className="bg-[#0D1117] border border-[#2D333B] rounded-lg p-4 font-sans space-y-3">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#21262D] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-md bg-[#3B82F618] text-[#3B82F6] border border-[#3B82F640]">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                DYNAMIC REALTIME MARKET SCANNER
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#161B22] text-[#10B981] border border-[#2D333B] flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
                <span>BINANCE LIVE FEED ({assets.length} PAIRS)</span>
              </span>
            </div>
            <p className="text-[11px] text-[#8B949E] font-mono mt-0.5">
              Pemindaian kuantitatif otomatis untuk mendeteksi Market Regime, ADX Momentum, & Alpha Score secara organik.
            </p>
          </div>
        </div>

        {/* Controls: View Switcher, Multi-Asset Hunting Toggle & Refresh */}
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Table vs Heatmap Toggle */}
          <div className="flex items-center space-x-1 bg-[#161B22] p-1 rounded-lg border border-[#2D333B] text-xs font-mono">
            <button
              onClick={() => setScannerView('HEATMAP')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center space-x-1.5 ${
                scannerView === 'HEATMAP'
                  ? 'bg-gradient-to-r from-[#EF4444] to-[#F59E0B] text-white font-bold shadow-sm'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>VOLATILITY HEATMAP</span>
            </button>
            <button
              onClick={() => setScannerView('TABLE')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer flex items-center space-x-1.5 ${
                scannerView === 'TABLE' ? 'bg-[#3B82F6] text-white font-bold' : 'text-[#8B949E] hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>TABLE VIEW</span>
            </button>
          </div>

          <button
            onClick={onToggleMultiAssetHunting}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer flex items-center space-x-1.5 ${
              multiAssetHunting
                ? 'bg-[#10B98118] text-[#10B981] border-[#10B98150] ring-1 ring-[#10B981]/30'
                : 'bg-[#161B22] text-[#8B949E] border-[#2D333B] hover:text-white'
            }`}
            title="Jika aktif, bot akan memindai seluruh pair yang terdeteksi memiliki Alpha tinggi secara organik"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>MULTI-ASSET: {multiAssetHunting ? 'ON (8 PAIRS)' : 'OFF'}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-[#161B22] text-[#8B949E] hover:text-white border border-[#2D333B] hover:bg-[#21262D] transition-colors cursor-pointer"
            title="Refresh scan data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#3B82F6]' : ''}`} />
          </button>
        </div>
      </div>

      {scannerView === 'HEATMAP' ? (
        <VolatilityHeatmap
          assets={assets}
          selectedSymbol={selectedSymbol}
          onSelectSymbol={onSelectSymbol}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      ) : (
        <>
          {/* 2. Top Opportunity Highlight Banner */}
      {bestOpportunity && (
        <div className="bg-[#161B22] p-2.5 rounded-lg border border-[#2D333B] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-3">
            <span className="text-[10px] text-[#8B949E] uppercase font-bold flex items-center space-x-1">
              <Zap className="w-3 h-3 text-[#F59E0B]" />
              <span>TOP OPPORTUNITY:</span>
            </span>
            <span className="font-bold text-white flex items-center space-x-1">
              <span>{bestOpportunity.displaySymbol}</span>
              <span className="text-[#8B949E] font-normal">({bestOpportunity.name})</span>
            </span>
            <span
              className="px-1.5 py-0.2 rounded text-[10px] font-bold border"
              style={{
                backgroundColor: `${bestOpportunity.regimeColor}18`,
                color: bestOpportunity.regimeColor,
                borderColor: `${bestOpportunity.regimeColor}40`,
              }}
            >
              {bestOpportunity.regimeLabel}
            </span>
            <span className="text-[#8B949E] text-[11px]">
              Alpha Score: <strong className="text-[#10B981]">{bestOpportunity.alphaScore}/100</strong>
            </span>
          </div>

          <button
            onClick={() => onSelectSymbol(bestOpportunity.displaySymbol)}
            className="px-2.5 py-1 rounded bg-[#3B82F620] text-[#3B82F6] hover:bg-[#3B82F635] border border-[#3B82F650] text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
          >
            <span>FOCUS & TRADE PAIR</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. Filter & Search Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#6E7681]" />
            <input
              type="text"
              placeholder="Cari Pair (e.g. SOL, BTC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#161B22] border border-[#2D333B] rounded-lg pl-8 pr-3 py-1 text-[11px] text-white focus:outline-none focus:border-[#3B82F6] w-48"
            />
          </div>

          {/* Regime Filter Chips */}
          <div className="flex items-center space-x-1 bg-[#161B22] p-0.5 rounded-lg border border-[#2D333B]">
            {['ALL', 'TRENDING', 'HIGH_VOLATILITY', 'RANGING', 'LOW_VOL_CHOP'].map((reg) => (
              <button
                key={reg}
                onClick={() => setFilterRegime(reg)}
                className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                  filterRegime === reg
                    ? 'bg-[#3B82F6] text-white font-bold'
                    : 'text-[#8B949E] hover:text-white'
                }`}
              >
                {reg === 'ALL' ? 'ALL REGIMES' : reg.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center space-x-1.5 text-[10px] text-[#8B949E]">
          <SlidersHorizontal className="w-3 h-3" />
          <span>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#161B22] border border-[#2D333B] rounded px-2 py-0.5 text-white focus:outline-none text-[10px]"
          >
            <option value="ALPHA_SCORE">Alpha Score (Tertinggi)</option>
            <option value="CHANGE_24H">24h Volatilitas (%)</option>
            <option value="ADX">ADX Trend Strength</option>
            <option value="VOLUME">Volume 24h (USD)</option>
          </select>
        </div>
      </div>

      {/* 4. Scanner Table Grid */}
      <div className="overflow-x-auto rounded-lg border border-[#2D333B]">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-[#161B22] text-[#8B949E] border-b border-[#2D333B] text-[10px] uppercase">
              <th className="py-2 px-3">Asset / Pair</th>
              <th className="py-2 px-3">Last Price</th>
              <th className="py-2 px-3">Mark Price</th>
              <th className="py-2 px-3">24h Change</th>
              <th className="py-2 px-3">Spread (bps)</th>
              <th className="py-2 px-3">Detected Regime</th>
              <th className="py-2 px-3">ADX (14)</th>
              <th className="py-2 px-3">Alpha Opp. Score</th>
              <th className="py-2 px-3">Organic Action</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262D] bg-[#0D1117]">
            {filteredAssets.map((asset) => {
              const isSelected =
                selectedSymbol.replace('/', '').toUpperCase() === asset.symbol.replace('/', '').toUpperCase();

              return (
                <tr
                  key={asset.symbol}
                  className={`hover:bg-[#161B22]/80 transition-colors ${
                    isSelected ? 'bg-[#3B82F60D] border-l-2 border-[#3B82F6]' : ''
                  }`}
                >
                  {/* Symbol & Name */}
                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.regimeColor }}></div>
                      <div>
                        <span className="font-bold text-white">{asset.displaySymbol}</span>
                        <div className="text-[10px] text-[#6E7681]">{asset.name}</div>
                      </div>
                    </div>
                  </td>

                  {/* Last Price */}
                  <td className="py-2 px-3 text-white font-bold">
                    ${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2 })}
                  </td>

                  {/* Mark Price */}
                  <td className="py-2 px-3 text-[#3B82F6] font-semibold">
                    ${asset.markPrice.toLocaleString(undefined, { minimumFractionDigits: asset.price < 10 ? 4 : 2 })}
                  </td>

                  {/* 24h Change */}
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center text-[11px] font-bold ${
                        asset.change24h >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
                      }`}
                    >
                      {asset.change24h >= 0 ? '+' : ''}
                      {asset.change24h.toFixed(2)}%
                    </span>
                  </td>

                  {/* Spread */}
                  <td className="py-2 px-3 text-[#8B949E]">
                    <span className={asset.spreadBps <= 1.0 ? 'text-[#10B981] font-semibold' : 'text-[#8B949E]'}>
                      {asset.spreadBps} bps
                    </span>
                  </td>

                  {/* Regime Tag */}
                  <td className="py-2 px-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap"
                      style={{
                        backgroundColor: `${asset.regimeColor}18`,
                        color: asset.regimeColor,
                        borderColor: `${asset.regimeColor}40`,
                      }}
                    >
                      {asset.regimeLabel}
                    </span>
                  </td>

                  {/* ADX */}
                  <td className="py-2 px-3">
                    <span className={`font-bold ${asset.adx > 25 ? 'text-[#10B981]' : 'text-[#8B949E]'}`}>
                      {asset.adx.toFixed(1)}
                    </span>
                  </td>

                  {/* Alpha Score Bar */}
                  <td className="py-2 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-[#21262D] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${asset.alphaScore}%`,
                            backgroundColor:
                              asset.alphaScore > 75
                                ? '#10B981'
                                : asset.alphaScore > 50
                                ? '#3B82F6'
                                : asset.alphaScore > 30
                                ? '#F59E0B'
                                : '#6B7280',
                          }}
                        ></div>
                      </div>
                      <span className="font-bold text-white text-[11px]">{asset.alphaScore}</span>
                    </div>
                  </td>

                  {/* Organic Rule Status */}
                  <td className="py-2 px-3">
                    {asset.regime === 'LOW_VOL_CHOP' ? (
                      <span className="text-[10px] text-[#6E7681]">STAND ASIDE</span>
                    ) : asset.trendBias === 'BULLISH' ? (
                      <span className="text-[10px] text-[#10B981] font-bold flex items-center space-x-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>LONG ALIGNED</span>
                      </span>
                    ) : asset.trendBias === 'BEARISH' ? (
                      <span className="text-[10px] text-[#EF4444] font-bold flex items-center space-x-0.5">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>SHORT ALIGNED</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#F59E0B] font-bold">RANGE BOUND</span>
                    )}
                  </td>

                  {/* Select Button */}
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => onSelectSymbol(asset.displaySymbol)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#10B98120] text-[#10B981] border border-[#10B98160]'
                          : 'bg-[#21262D] text-[#8B949E] hover:text-white hover:bg-[#30363D]'
                      }`}
                    >
                      {isSelected ? 'ACTIVE PAIR' : 'SELECT'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  )}
</div>
  );
};

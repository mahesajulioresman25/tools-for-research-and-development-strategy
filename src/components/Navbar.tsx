import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  RefreshCw,
  Sliders,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  Bot,
} from 'lucide-react';
import { MarketTicker, MarketSentiment } from '../types/trading';

interface NavbarProps {
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  interval: string;
  onIntervalChange: (interval: string) => void;
  ticker: MarketTicker | null;
  sentiment: MarketSentiment | null;
  isLoading: boolean;
  onRefreshData: () => void;
  activeTab: 'backtest' | 'live' | 'ai_alpha' | 'bot_code';
  onTabChange: (tab: 'backtest' | 'live' | 'ai_alpha' | 'bot_code') => void;
  onOpenClaudeBridge?: () => void;
}

const POPULAR_SYMBOLS = [
  { id: 'BTCUSDT', name: 'BTC/USDT', label: 'Bitcoin' },
  { id: 'ETHUSDT', name: 'ETH/USDT', label: 'Ethereum' },
  { id: 'SOLUSDT', name: 'SOL/USDT', label: 'Solana' },
  { id: 'BNBUSDT', name: 'BNB/USDT', label: 'BNB' },
  { id: 'XRPUSDT', name: 'XRP/USDT', label: 'Ripple' },
  { id: 'DOGEUSDT', name: 'DOGE/USDT', label: 'Dogecoin' },
  { id: 'ADAUSDT', name: 'ADA/USDT', label: 'Cardano' },
  { id: 'AVAXUSDT', name: 'AVAX/USDT', label: 'Avalanche' },
];

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

export const Navbar: React.FC<NavbarProps> = ({
  symbol,
  onSymbolChange,
  interval,
  onIntervalChange,
  ticker,
  sentiment,
  isLoading,
  onRefreshData,
  activeTab,
  onTabChange,
  onOpenClaudeBridge,
}) => {
  const isPositive = (ticker?.change24h || 0) >= 0;

  const getSentimentBadge = () => {
    if (!sentiment) return null;
    const score = parseInt(sentiment.value, 10) || 50;
    const isBullish = score >= 50;

    return (
      <div
        id="sentiment-pill"
        className="hidden md:flex items-center gap-2 bg-[#161B22] px-3 py-1 rounded border border-[#2D333B] text-xs font-mono"
        title={`Fear & Greed Index: ${score}/100 (${sentiment.value_classification})`}
      >
        <span className="text-[10px] text-[#6B7280] uppercase tracking-wider">Social Pulse:</span>
        <span className={isBullish ? 'text-[#10B981] font-bold' : 'text-[#EF4444] font-bold'}>
          {score}% {sentiment.value_classification}
        </span>
        <div className="w-12 bg-[#30363D] h-1.5 rounded-full overflow-hidden ml-1">
          <div
            className={`h-full ${isBullish ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
            style={{ width: `${Math.min(100, Math.max(10, score))}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <header className="border-b border-[#2D333B] bg-[#14171C] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        {/* Top Tier: Logo, Ticker, Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#3B82F6] rounded flex items-center justify-center font-bold text-white shadow-sm font-mono text-sm">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-semibold tracking-tight text-white font-mono">
                  QUANTUM-TRADE
                  <span className="text-[#6B7280] font-mono text-[10px] ml-2 px-1.5 py-0.5 bg-[#161B22] border border-[#2D333B] rounded">
                    v2.4.0-BETA
                  </span>
                </h1>
              </div>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider hidden sm:block font-mono">
                Market Inefficiency & Alpha Discovery Engine
              </p>
            </div>
          </div>

          {/* Asset & Ticker Overview */}
          <div className="flex items-center space-x-3 flex-wrap">
            {/* Symbol Selector */}
            <div className="relative">
              <select
                id="symbol-select"
                aria-label="Pilih Aset Trading"
                value={symbol}
                onChange={(e) => onSymbolChange(e.target.value)}
                className="bg-[#161B22] border border-[#2D333B] text-white text-xs font-mono font-semibold rounded px-2.5 py-1.5 focus:outline-none focus:border-[#3B82F6] transition-colors cursor-pointer"
              >
                {POPULAR_SYMBOLS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#14171C] text-white">
                    {s.name} ({s.label})
                  </option>
                ))}
                {!POPULAR_SYMBOLS.some((s) => s.id === symbol) && (
                  <option value={symbol} className="bg-[#14171C] text-white">
                    {symbol}
                  </option>
                )}
              </select>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center bg-[#0D1117] p-0.5 rounded border border-[#2D333B] space-x-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  id={`tf-btn-${tf}`}
                  onClick={() => onIntervalChange(tf)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                    interval === tf
                      ? 'bg-[#2563EB30] text-[#3B82F6] border border-[#2563EB] font-bold'
                      : 'text-[#6B7280] hover:text-[#D1D5DB] hover:bg-[#161B22]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Price Ticker Display */}
            {ticker && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-[#161B22] border border-[#2D333B] rounded font-mono">
                <span className="text-xs font-bold text-white">
                  ${ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`flex items-center text-[11px] font-bold ${
                    isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                  )}
                  {isPositive ? '+' : ''}
                  {ticker.change24h.toFixed(2)}%
                </span>
              </div>
            )}

            {/* Fear and Greed */}
            {getSentimentBadge()}

            {/* Refresh Live Data button */}
            <button
              id="refresh-data-btn"
              onClick={onRefreshData}
              disabled={isLoading}
              className="p-1.5 rounded bg-[#161B22] border border-[#2D333B] text-[#9CA3AF] hover:text-[#3B82F6] hover:border-[#3B82F6] transition-colors disabled:opacity-50"
              title="Refresh Data Pasar Terkini"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#3B82F6]' : ''}`} />
            </button>

            {/* Engine status indicator */}
            <div className="hidden lg:flex items-center space-x-2 border-l border-[#2D333B] pl-3">
              <div className="flex flex-col items-end font-mono">
                <span className="text-[9px] text-[#6B7280] uppercase tracking-wider">Engine Status</span>
                <span className="text-[#10B981] text-[11px] uppercase flex items-center">
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full mr-1.5 animate-pulse"></span>
                  Executing
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Tier: Navigation Modes */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#2D333B] flex-wrap gap-2">
          <div className="flex items-center space-x-1.5">
            <button
              id="tab-backtest-btn"
              onClick={() => onTabChange('backtest')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'backtest'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#161B22] text-[#9CA3AF] hover:text-white border border-[#2D333B]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Backtest & Monte Carlo</span>
            </button>

            <button
              id="tab-live-btn"
              onClick={() => onTabChange('live')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'live'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#161B22] text-[#9CA3AF] hover:text-white border border-[#2D333B]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Paper Engine</span>
            </button>

            <button
              id="tab-ai-alpha-btn"
              onClick={() => onTabChange('ai_alpha')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'ai_alpha'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#161B22] text-[#9CA3AF] hover:text-white border border-[#2D333B]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Alpha Discovery (Gemini AI)</span>
            </button>

            <button
              id="tab-bot-code-btn"
              onClick={() => onTabChange('bot_code')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeTab === 'bot_code'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#161B22] text-[#9CA3AF] hover:text-white border border-[#2D333B]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Export Bot Script</span>
            </button>

            {onOpenClaudeBridge && (
              <button
                id="open-claude-bridge-btn"
                onClick={onOpenClaudeBridge}
                className="flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono font-medium bg-[#F59E0B15] text-[#F59E0B] hover:bg-[#F59E0B25] border border-[#F59E0B40] transition-all cursor-pointer shadow-sm"
                title="Hubungkan Claude AI ke sistem ini via Model Context Protocol (MCP) atau REST tanpa ekspor kode & tanpa API key"
              >
                <Bot className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span className="font-bold">Claude MCP Bridge</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse ml-0.5"></span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono text-[#6B7280]">
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full mr-1.5"></span>
              WS: 0.1s
            </span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full mr-1.5"></span>
              GPU-ACCEL: ACTIVE
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

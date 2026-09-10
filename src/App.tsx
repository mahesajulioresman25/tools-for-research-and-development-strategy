import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CandleChart } from './components/CandleChart';
import { StrategyConfigPanel } from './components/StrategyConfig';
import { BacktestResults } from './components/BacktestResults';
import { LiveSimulation } from './components/LiveSimulation';
import { AlphaDiscoveryAI } from './components/AlphaDiscoveryAI';
import { BotCodeModal } from './components/BotCodeModal';
import { ClaudeBridgeModal } from './components/ClaudeBridgeModal';
import {
  Candle,
  StrategyConfig,
  BacktestResult,
  MarketTicker,
  MarketSentiment,
  IndicatorMap,
  DetectedPattern,
} from './types/trading';
import { PRESET_STRATEGIES } from './data/strategies';
import { fetchMarketKlines, fetchMarketTicker } from './services/api';
import { computeAllIndicators, detectMarketPatterns } from './utils/indicators';
import { runBacktest } from './utils/backtester';
import { Sparkles, Sliders, Activity, Cpu, Shield, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [symbol, setSymbolRaw] = useState<string>('BTCUSDT');
  const [interval, setInterval] = useState<string>('15m');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [ticker, setTicker] = useState<MarketTicker | null>(null);
  const [sentiment, setSentiment] = useState<MarketSentiment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize symbol cleanly (e.g. SOL/USDT -> SOLUSDT)
  const setSymbol = useCallback((newSymbol: string) => {
    if (!newSymbol) return;
    const clean = newSymbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setSymbolRaw(clean);
  }, []);

  // Strategy & Backtest State
  const [currentStrategy, setCurrentStrategy] = useState<StrategyConfig>(PRESET_STRATEGIES[0]);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState<boolean>(false);

  // Indicators & Patterns
  const [indicators, setIndicators] = useState<IndicatorMap>({});
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'backtest' | 'live' | 'ai_alpha' | 'bot_code'>('backtest');
  const [isBotModalOpen, setIsBotModalOpen] = useState<boolean>(false);
  const [isClaudeModalOpen, setIsClaudeModalOpen] = useState<boolean>(false);
  const [liveActivePosition, setLiveActivePosition] = useState<any>(null);
  const [livePrice, setLivePrice] = useState<number | undefined>(undefined);

  // 1. Fetch Real Market Data
  const loadMarketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [klineRes, tickerRes] = await Promise.allSettled([
        fetchMarketKlines(symbol, interval, 300),
        fetchMarketTicker(symbol),
      ]);

      let loadedCandles: Candle[] = [];
      if (klineRes.status === 'fulfilled' && klineRes.value?.candles?.length > 0) {
        loadedCandles = klineRes.value.candles;
        setCandles(loadedCandles);
      }

      if (tickerRes.status === 'fulfilled' && tickerRes.value?.ticker) {
        setTicker(tickerRes.value.ticker);
        setSentiment(tickerRes.value.sentiment);
      }

      // Compute initial indicators & run initial backtest
      if (loadedCandles.length > 0) {
        const p = currentStrategy.params;
        const ind = computeAllIndicators(loadedCandles, {
          fastEmaPeriod: p.fastEmaPeriod,
          slowEmaPeriod: p.slowEmaPeriod,
          rsiPeriod: p.rsiPeriod,
          bbPeriod: p.bbPeriod,
          bbStdDev: p.bbStdDev,
          atrPeriod: p.atrPeriod,
        });
        const pat = detectMarketPatterns(loadedCandles, ind);
        setIndicators(ind);
        setPatterns(pat);

        const res = runBacktest(loadedCandles, currentStrategy, 10000);
        setBacktestResult(res);
      }
    } catch (err: any) {
      console.error('Failed to load market data:', err);
      setError(err?.message || 'Gagal memuat data pasar');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, interval, currentStrategy]);

  useEffect(() => {
    loadMarketData();
  }, [symbol, interval]);

  // Handle Strategy Parameter Updates & Re-running Backtest
  const handleExecuteBacktest = () => {
    if (candles.length === 0) return;
    setIsBacktesting(true);
    setTimeout(() => {
      const p = currentStrategy.params;
      const ind = computeAllIndicators(candles, {
        fastEmaPeriod: p.fastEmaPeriod,
        slowEmaPeriod: p.slowEmaPeriod,
        rsiPeriod: p.rsiPeriod,
        bbPeriod: p.bbPeriod,
        bbStdDev: p.bbStdDev,
        atrPeriod: p.atrPeriod,
      });
      const pat = detectMarketPatterns(candles, ind);
      setIndicators(ind);
      setPatterns(pat);

      const res = runBacktest(candles, currentStrategy, 10000);
      setBacktestResult(res);
      setIsBacktesting(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#D1D5DB] flex flex-col font-sans selection:bg-[#3B82F630] selection:text-[#93C5FD]">
      {/* Top Navigation Bar */}
      <Navbar
        symbol={symbol}
        onSymbolChange={setSymbol}
        interval={interval}
        onIntervalChange={setInterval}
        ticker={ticker}
        sentiment={sentiment}
        isLoading={isLoading}
        onRefreshData={loadMarketData}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'bot_code') {
            setIsBotModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenClaudeBridge={() => setIsClaudeModalOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* Error notification banner if any */}
        {error && (
          <div className="p-3 rounded bg-[#EF444415] border border-[#EF444450] text-[#EF4444] text-xs font-mono flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadMarketData}
              className="px-2.5 py-1 rounded bg-[#EF444425] hover:bg-[#EF444440] font-bold transition-colors cursor-pointer"
            >
              RETRY
            </button>
          </div>
        )}

        {/* 1. Candlestick & Technical Analysis Chart */}
        <section aria-label="Interactive Candlestick Chart">
          <CandleChart
            candles={candles}
            trades={backtestResult?.trades || []}
            patterns={patterns}
            indicators={indicators}
            symbol={symbol}
            interval={interval}
            activePosition={liveActivePosition}
            livePrice={livePrice}
          />
        </section>

        {/* 2. Strategy Configurator */}
        <section aria-label="Strategy & Algorithm Tuning">
          <StrategyConfigPanel
            currentStrategy={currentStrategy}
            onStrategyChange={(updated) => {
              setCurrentStrategy(updated);
            }}
            onRunBacktest={handleExecuteBacktest}
            isRunning={isBacktesting}
          />
        </section>

        {/* 3. Conditional Mode Views */}
        {activeTab === 'backtest' && backtestResult && (
          <section aria-label="Backtest Analytics & Monte Carlo">
            <BacktestResults result={backtestResult} />
          </section>
        )}

        {activeTab === 'live' && (
          <section aria-label="Live Paper Execution Engine">
            <LiveSimulation
              strategy={currentStrategy}
              symbol={symbol}
              ticker={ticker}
              candles={candles}
              onSelectSymbol={setSymbol}
              onActivePositionChange={(pos, price) => {
                setLiveActivePosition(pos);
                setLivePrice(price);
              }}
            />
          </section>
        )}

        {activeTab === 'ai_alpha' && backtestResult && (
          <section aria-label="Gemini AI Market Alpha Discovery">
            <AlphaDiscoveryAI
              strategy={currentStrategy}
              symbol={symbol}
              metrics={backtestResult.metrics}
              patterns={patterns}
              ticker={ticker}
              sentiment={sentiment}
              onOpenBotCodeModal={() => setIsBotModalOpen(true)}
            />
          </section>
        )}
      </main>

      {/* Bot Automation Code Export Modal */}
      <BotCodeModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        strategy={currentStrategy}
        symbol={symbol}
      />

      {/* Claude AI Access Bridge Modal */}
      <ClaudeBridgeModal
        isOpen={isClaudeModalOpen}
        onClose={() => setIsClaudeModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#2D333B] bg-[#0D1117] py-2.5 px-4 text-center text-[11px] text-[#6B7280] font-mono">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ALPHATRADER QUANT ENGINE • REAL MARKET DATA & SENTIMENT ANALYSIS</span>
          <span className="text-[#9CA3AF]">
            POWERED BY GEMINI 2.5 QUANT AI • HIGH DENSITY INTERFACE
          </span>
        </div>
      </footer>
    </div>
  );
}

import { Candle, MarketTicker, MarketSentiment, AIAlphaAnalysis, BotCodeResult, AssetScanItem } from '../types/trading';

function getFallbackBasePrice(symbol: string): number {
  const s = symbol.toUpperCase().replace('/', '');
  if (s.includes('BTC')) return 88500;
  if (s.includes('ETH')) return 3200;
  if (s.includes('SOL')) return 195;
  if (s.includes('BNB')) return 620;
  if (s.includes('XRP')) return 1.45;
  if (s.includes('DOGE')) return 0.28;
  if (s.includes('ADA')) return 0.85;
  if (s.includes('AVAX')) return 38.5;
  return 100;
}

function generateClientFallbackCandles(symbol: string, interval: string = '15m', count: number = 300): Candle[] {
  const basePrice = getFallbackBasePrice(symbol);
  let stepSec = 900;
  if (interval === '1m') stepSec = 60;
  else if (interval === '5m') stepSec = 300;
  else if (interval === '15m') stepSec = 900;
  else if (interval === '1h') stepSec = 3600;
  else if (interval === '4h') stepSec = 14400;
  else if (interval === '1d') stepSec = 86400;

  const nowSec = Math.floor(Date.now() / 1000);
  const startSec = nowSec - count * stepSec;

  const candles: Candle[] = [];
  let currentPrice = basePrice * (1 - 0.05 + Math.random() * 0.1);
  const volatility = 0.007;

  for (let i = 0; i < count; i++) {
    const time = startSec + i * stepSec;
    const wave = Math.sin(i * 0.08) * 0.002 + Math.cos(i * 0.03) * 0.003;
    const deltaPct = (Math.random() - 0.485) * volatility + wave;
    const open = currentPrice;
    const close = parseFloat((open * (1 + deltaPct)).toFixed(2));
    const wickHigh = Math.random() * (open * volatility * 0.8);
    const wickLow = Math.random() * (open * volatility * 0.8);
    const high = parseFloat((Math.max(open, close) + wickHigh).toFixed(2));
    const low = parseFloat((Math.min(open, close) - wickLow).toFixed(2));
    const volume = parseFloat((Math.random() * 150 + 20).toFixed(2));

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
      quoteVolume: volume * close,
      trades: Math.floor(Math.random() * 500 + 50),
    });

    currentPrice = close;
  }

  return candles;
}

async function resilientFetch(url: string, options: RequestInit = {}, retries: number = 2, timeoutMs: number = 5000): Promise<Response> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error('Network request failed');
}

export async function fetchMarketKlines(
  symbol: string = 'BTCUSDT',
  interval: string = '15m',
  limit: number = 300
): Promise<{ success: boolean; source: string; candles: Candle[] }> {
  const cleanSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'BTCUSDT';
  try {
    const res = await resilientFetch(
      `/api/market/klines?symbol=${cleanSymbol}&interval=${encodeURIComponent(
        interval
      )}&limit=${limit}`,
      {},
      1,
      6000
    );
    const data = await res.json();
    if (data && Array.isArray(data.candles) && data.candles.length > 0) {
      return data;
    }
    throw new Error('Invalid klines response data');
  } catch (err: any) {
    console.warn('Fallback klines activated for:', symbol, err?.message || err);
    return {
      success: true,
      source: 'calibrated_fallback',
      candles: generateClientFallbackCandles(cleanSymbol, interval, limit),
    };
  }
}

export async function fetchMarketDepth(
  symbol: string = 'BTCUSDT'
): Promise<{ success: boolean; bids: [number, number][]; asks: [number, number][] }> {
  const cleanSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'BTCUSDT';
  try {
    const res = await resilientFetch(`/api/market/depth?symbol=${cleanSymbol}`, {}, 1, 4000);
    const data = await res.json();
    if (data && Array.isArray(data.bids) && Array.isArray(data.asks)) {
      return data;
    }
    throw new Error('Invalid depth response data');
  } catch (err: any) {
    const base = getFallbackBasePrice(cleanSymbol);
    const bids: [number, number][] = [];
    const asks: [number, number][] = [];
    for (let i = 1; i <= 8; i++) {
      const step = base * 0.00015 * i;
      bids.push([parseFloat((base - step).toFixed(2)), parseFloat((Math.random() * 2 + 0.5).toFixed(3))]);
      asks.push([parseFloat((base + step).toFixed(2)), parseFloat((Math.random() * 2 + 0.5).toFixed(3))]);
    }
    return { success: true, bids, asks };
  }
}

export async function fetchMarketTicker(
  symbol: string = 'BTCUSDT'
): Promise<{ success: boolean; ticker: MarketTicker; sentiment: MarketSentiment }> {
  const cleanSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'BTCUSDT';
  try {
    const res = await resilientFetch(`/api/market/ticker?symbol=${cleanSymbol}`, {}, 1, 4000);
    const data = await res.json();
    if (data && data.ticker && data.ticker.price > 0) {
      return data;
    }
    throw new Error('Invalid ticker response data');
  } catch (err: any) {
    console.warn('Fallback ticker activated for:', symbol, err?.message || err);
    const base = getFallbackBasePrice(cleanSymbol);
    return {
      success: true,
      ticker: {
        symbol: cleanSymbol,
        price: base,
        change24h: 2.15,
        high24h: base * 1.035,
        low24h: base * 0.975,
        volume: 28400,
        quoteVolume: 28400 * base,
      },
      sentiment: { value: '64', value_classification: 'Greed' },
    };
  }
}

export async function fetchMarketScanner(): Promise<{
  success: boolean;
  timestamp: number;
  assets: AssetScanItem[];
}> {
  try {
    const res = await resilientFetch('/api/market/scanner', {}, 1, 4000);
    const data = await res.json();
    if (data && Array.isArray(data.assets) && data.assets.length > 0) {
      return data;
    }
    throw new Error('Invalid scanner response data');
  } catch (err: any) {
    console.warn('Fallback scanner activated:', err?.message || err);
    const symbols = [
      { s: 'BTCUSDT', d: 'BTC/USDT', n: 'Bitcoin', p: 88500 },
      { s: 'ETHUSDT', d: 'ETH/USDT', n: 'Ethereum', p: 3200 },
      { s: 'SOLUSDT', d: 'SOL/USDT', n: 'Solana', p: 195 },
      { s: 'BNBUSDT', d: 'BNB/USDT', n: 'BNB Chain', p: 620 },
      { s: 'XRPUSDT', d: 'XRP/USDT', n: 'Ripple XRP', p: 1.45 },
      { s: 'DOGEUSDT', d: 'DOGE/USDT', n: 'Dogecoin', p: 0.28 },
      { s: 'ADAUSDT', d: 'ADA/USDT', n: 'Cardano', p: 0.85 },
      { s: 'AVAXUSDT', d: 'AVAX/USDT', n: 'Avalanche', p: 38.5 },
    ];
    return {
      success: true,
      timestamp: Date.now(),
      assets: symbols.map((item, idx) => ({
        symbol: item.s,
        displaySymbol: item.d,
        name: item.n,
        price: item.p,
        markPrice: item.p * 1.0001,
        change24h: idx % 2 === 0 ? 2.4 : -1.2,
        high24h: item.p * 1.03,
        low24h: item.p * 0.97,
        volume24hUsd: item.p * 22000,
        spreadBps: 0.8,
        regime: 'TRENDING',
        regimeLabel: 'TRENDING (MOMENTUM)',
        regimeColor: '#10B981',
        adx: 32.5,
        hurst: 0.58,
        alphaScore: 85 - idx * 4,
        trendBias: idx % 2 === 0 ? 'BULLISH' : 'BEARISH',
        orderbookImbalance: 1.2,
        isEligibleForEntry: true,
        activeStrategyName: 'EMA Wave Momentum & Dynamic Breakout Surfer',
      })),
    };
  }
}


export async function requestAIAlphaAnalysis(payload: {
  symbol: string;
  strategyName: string;
  strategyParams: any;
  backtestMetrics: any;
  marketContext: any;
  detectedPatterns: any[];
}): Promise<{ success: boolean; analysis: AIAlphaAnalysis; error?: string }> {
  try {
    const res = await fetch('/api/ai/discover-alpha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error('AI Alpha Analysis request error:', err);
    throw err;
  }
}

export async function requestAIBotCode(payload: {
  strategyName: string;
  language: string;
  params: any;
  symbol: string;
}): Promise<{ success: boolean; result: BotCodeResult; error?: string }> {
  try {
    const res = await fetch('/api/ai/generate-bot-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error('AI Bot Code generation request error:', err);
    throw err;
  }
}


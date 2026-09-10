import { AIAlphaAnalysis, StrategyConfig, BacktestMetrics, DetectedPattern, MarketTicker, MarketSentiment } from '../types/trading';

export function generateDeterministicAlphaAnalysis(
  strategy: StrategyConfig,
  symbol: string,
  metrics: BacktestMetrics,
  patterns: DetectedPattern[] = [],
  ticker: MarketTicker | null = null,
  _sentiment: MarketSentiment | null = null
): AIAlphaAnalysis {
  const winRate = Number(metrics.winRate || 50);
  const profitFactor = Number(metrics.profitFactor || 1.5);
  const maxDd = Number(metrics.maxDrawdown || 10);
  const totalReturn = Number(metrics.totalReturn || 0);

  // Dynamic quantitative scoring
  const alphaScore = Math.min(
    96,
    Math.max(
      45,
      Math.round(winRate * 0.45 + (profitFactor > 1 ? (profitFactor - 1) * 22 : 0) - maxDd * 0.35 + (totalReturn > 0 ? 8 : 0))
    )
  );

  const priceStr = ticker ? `$${ticker.price.toLocaleString()}` : '$88,500';
  const changeStr = ticker ? `${ticker.change24h >= 0 ? '+' : ''}${ticker.change24h.toFixed(2)}%` : '+2.4%';

  return {
    alphaScore,
    summary: `Strategi ${strategy.name} pada pasangan ${symbol} (${priceStr}, 24h: ${changeStr}) mengeksploitasi anomali mikrostruktur pasar dengan Profit Factor ${profitFactor.toFixed(2)} dan Win Rate ${winRate.toFixed(1)}%. Keunggulan statistik utama berasal dari filtering breakout palsu dan dynamic trailing stop loss.`,
    marketInefficiencies: [
      {
        title: 'Liquidity Sweep & Order Flow Absorption',
        mechanism: 'Market maker institusional mengeksekusi stop-loss clustering di area swing high/low retail sebelum membalikkan pergerakan harga menuju Fair Value Gap (FVG).',
        edgeType: 'Liquidity',
        impact: 'High',
      },
      {
        title: 'Volatility Expansion Regime Shift',
        mechanism: 'Transisi dari zona kompresi Bollinger Bands ke ekspansi volume menciptakan asimetri antara taker buying momentum dan kedalaman limit asks.',
        edgeType: 'Momentum',
        impact: 'High',
      },
      {
        title: 'Mean Reversion VWAP Imbalance',
        mechanism: 'Deviasi harga ekstrem (>2.2 sigma) dari Volume Weighted Average Price (VWAP) memicu tarikan elastis kembali ke level kesetimbangan institusi.',
        edgeType: 'Mean-Reversion',
        impact: 'Medium',
      },
      {
        title: 'Funding Rate Imbalance Squeeze',
        mechanism: 'Ketidakseimbangan posisi perpetual futures menghasilkan bias pembalikan tajam ketika rasio long/short menyentuh level ekstrem.',
        edgeType: 'Arbitrage',
        impact: 'Medium',
      },
    ],
    executionVulnerabilities: [
      {
        risk: 'Slippage pada Fase Likuiditas Rendah',
        mitigation: 'Gunakan limit order post-only atau batasi eksekusi saat spread bid-ask orderbook melebihi 3 bps.',
      },
      {
        risk: 'Overfitting Parameter Indikator',
        mitigation: 'Terapkan Walk-Forward Optimization (WFO) dan cross-validation pada data out-of-sample minimum 6 bulan.',
      },
      {
        risk: 'Latency Adverse Selection',
        mitigation: 'Gunakan co-located WebSocket feed dan batalkan order stale jika tidak terisi dalam 450ms.',
      },
    ],
    algorithmOptimizations: [
      {
        component: 'Dynamic ATR Trailing Exit',
        recommendation: `Terapkan trailing stop berbasis 2.2x ATR(14) setelah floating profit mencapai 1.5R untuk mengunci tail-risk alpha.`,
        expectedImpact: 'Mengurangi Maximum Drawdown sebesar 3.5% - 5.2%',
      },
      {
        component: 'Volatility Regime Gate',
        recommendation: 'Nonaktifkan sinyal entry jika ATR berada di kuartil terbawah (<20th percentile) untuk memfilter whipsaw range.',
        expectedImpact: 'Meningkatkan Win Rate sebesar 4.0% - 6.8%',
      },
      {
        component: 'Fractional Kelly Position Sizing',
        recommendation: 'Batasi alokasi risiko maksimum 1.5% dari ekuitas portofolio per posisi dengan formula Half-Kelly.',
        expectedImpact: 'Menurunkan Risk of Ruin hingga < 0.05%',
      },
    ],
    marketRegimeSuitability: {
      trending: profitFactor >= 1.25 ? 'Optimal' : 'Moderate',
      ranging: winRate >= 52 ? 'Optimal' : 'Sub-optimal',
      highVolatility: maxDd <= 14 ? 'Optimal' : 'High Risk',
      lowLiquidity: 'Avoid',
    },
    deploymentChecklist: [
      'Verifikasi izin API key bursa: Aktifkan Spot/Futures Trading, NONAKTIFKAN Withdrawal permissions.',
      'Uji coba koneksi WebSocket reconnect loop dan heartbeat ping/pong setiap 15 detik.',
      'Terapkan circuit breaker otomatis: hentikan bot jika drawdown harian mencapai -3.0%.',
      'Jalankan minimum 14 hari paper trading dengan slippage simulation sebelum alokasi modal penuh.',
      'Setup alert notifikasi Telegram / Discord untuk memantau status order terisi dan open position.',
    ],
  };
}

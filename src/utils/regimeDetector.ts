import { Candle, MarketRegimeState, MarketRegimeType } from '../types/trading';

/**
 * Quantitative Market Regime Detection Engine
 * Uses ADX (Trend Strength), ATR Percentile (Volatility), and Hurst Approximation (Persistence/Mean-Reversion)
 * to classify the active state and calculate automatic position risk sizing & dynamic TP/SL.
 */
export function calculateMarketRegime(
  candles: Candle[],
  accountBalance: number = 10000,
  baseRiskPct: number = 1.5
): MarketRegimeState {
  if (!candles || candles.length < 20) {
    return getDefaultRegime(accountBalance, baseRiskPct);
  }

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const currentPrice = closes[closes.length - 1];

  // 1. Calculate ATR (14) series
  const atrValues: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    atrValues.push(tr);
  }

  const period = 14;
  let currentAtr = atrValues.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (!currentAtr || currentAtr <= 0) currentAtr = currentPrice * 0.015;

  // 2. ATR Percentile Ranking across recent 100 bars
  const recentAtrs = atrValues.slice(-100);
  const sortedAtrs = [...recentAtrs].sort((a, b) => a - b);
  const rankIndex = sortedAtrs.findIndex((v) => v >= currentAtr);
  const atrPercentile = Math.round(((rankIndex === -1 ? sortedAtrs.length : rankIndex) / sortedAtrs.length) * 100);

  // 3. Approximate ADX (Average Directional Index)
  const adxValue = calculateSimpleADX(candles, 14);

  // 4. Hurst Exponent / Persistence Proxy (Variance of Log Differences)
  const hurstExponent = calculateHurstProxy(closes.slice(-60));

  // 5. Determine Regime State
  let regime: MarketRegimeType = 'RANGING';
  let label = 'RANGING (Mean-Reverting)';
  let color = '#F59E0B'; // Amber
  let confidenceScore = 78;
  let recommendedStrategy = 'Mean-Reversion, Bollinger Bands Fades, RSI Overbought/Oversold';
  let avoidStrategy = 'Breakout Scalping, Trend Surfing';
  let bestCase = 'Osilasi harga di rentang batas support & resistance yang jelas memberikan win rate >65% pada limit order.';
  let worstCase = 'Breakout palsu (Fakeout) atau sudden volume spike yang menembus level batas tanpa retracement.';
  let leverage = 2;
  let dynamicSlAtr = 1.5;
  let dynamicTpRatio = 1.5;
  let riskMultiplier = 1.0;

  if (atrPercentile >= 85 || (currentAtr / currentPrice) * 100 > 3.2) {
    // High Volatility Expansion
    regime = 'HIGH_VOLATILITY';
    label = 'HIGH VOLATILITY (Extreme Risk)';
    color = '#EF4444'; // Red
    confidenceScore = Math.min(95, 80 + Math.round(atrPercentile * 0.15));
    recommendedStrategy = 'Order Flow Absorption, Scalping FVG, Ultra-Fast Momentum';
    avoidStrategy = 'Swing Trading Tanpa Hard Stop, Martingale Grid';
    bestCase = 'Pergerakan pips besar dalam hitungan menit menghasilkan Risk-Reward > 1:3.';
    worstCase = 'Slippage ekstrem, spread orderbook melebar hingga 5x, cascading liquidation hunt.';
    leverage = 1; // De-leverage for safety
    dynamicSlAtr = 2.4; // Wider stop to avoid noise
    dynamicTpRatio = 2.5;
    riskMultiplier = 0.5; // Cut risk by 50%
  } else if (adxValue >= 25 || hurstExponent >= 0.56) {
    // Trending Strong
    regime = 'TRENDING';
    label = 'TRENDING (Strong Momentum)';
    color = '#10B981'; // Green
    confidenceScore = Math.min(96, Math.round(adxValue * 2.2 + hurstExponent * 20));
    recommendedStrategy = 'EMA Wave Cross, Trend Following Pullbacks, Breakout Volume';
    avoidStrategy = 'Counter-Trend Fades, Top/Bottom Picking';
    bestCase = 'Tren berkesinambungan menciptakan multiple extension targets dengan RRR > 1:2.5.';
    worstCase = 'Swing Failure Pattern (SFP) di level puncak lalu terjadi pembalikan berbentuk V-shape.';
    leverage = 3;
    dynamicSlAtr = 1.8;
    dynamicTpRatio = 2.2;
    riskMultiplier = 1.0;
  } else if (atrPercentile <= 18 && adxValue < 18) {
    // Low Volatility Chop
    regime = 'LOW_VOL_CHOP';
    label = 'LOW VOL (Chop / Illiquid)';
    color = '#6B7280'; // Slate Gray
    confidenceScore = 84;
    recommendedStrategy = 'STAND ASIDE (Flat Position) atau Grid Neutral Delta';
    avoidStrategy = 'Semua Directional Trading (Whipsaw Trap)';
    bestCase = 'Hemat biaya komisi dan terhindar dari churn modal saat pasar tidak memiliki volume partisipasi.';
    worstCase = 'Akun tergerus biaya transaksi berulang (over-trading) akibat sinyal palsu tanpa kelanjutan arah.';
    leverage = 1;
    dynamicSlAtr = 1.2;
    dynamicTpRatio = 1.0;
    riskMultiplier = 0.25;
  }

  // 6. Risk Auto-Tuner Math
  const effectiveRiskPct = baseRiskPct * riskMultiplier;
  const calculatedDollarRisk = (accountBalance * effectiveRiskPct) / 100;
  const dynamicSlDist = currentAtr * dynamicSlAtr;
  const dynamicTpDist = dynamicSlDist * dynamicTpRatio;

  // Position Sizing: Dollar Risk / SL Distance
  let dynamicLotSize = dynamicSlDist > 0 ? calculatedDollarRisk / dynamicSlDist : (accountBalance * 0.05) / currentPrice;
  // Safety clamp: lot cost cannot exceed account balance * leverage
  const maxLot = (accountBalance * 0.9 * leverage) / currentPrice;
  if (dynamicLotSize > maxLot) dynamicLotSize = maxLot;

  return {
    regime,
    label,
    color,
    confidenceScore,
    adxValue: Number(adxValue.toFixed(1)),
    atrPercentile,
    hurstExponent: Number(hurstExponent.toFixed(2)),
    volatilityMultiplier: Number((currentAtr / (currentPrice * 0.01)).toFixed(2)),
    recommendedStrategyType: recommendedStrategy,
    avoidStrategyType: avoidStrategy,
    worstCaseScenario: worstCase,
    bestCaseScenario: bestCase,
    riskAutoTuner: {
      accountBalance,
      riskPerTradePct: Number(effectiveRiskPct.toFixed(2)),
      dynamicLotSize: Number(dynamicLotSize.toFixed(4)),
      calculatedDollarRisk: Number(calculatedDollarRisk.toFixed(2)),
      dynamicSlAtrMultiple: dynamicSlAtr,
      dynamicSlPriceDistance: Number(dynamicSlDist.toFixed(2)),
      dynamicTpRatio: dynamicTpRatio,
      dynamicTpPriceDistance: Number(dynamicTpDist.toFixed(2)),
      circuitBreakerTrigger: regime === 'HIGH_VOLATILITY' ? 'Drawdown Harian -2.0% (Hard Stop)' : 'Drawdown Harian -3.5%',
      recommendedLeverage: leverage,
    },
  };
}

function calculateSimpleADX(candles: Candle[], period: number = 14): number {
  if (candles.length < period * 2) return 22.0;

  let plusDMs: number[] = [];
  let minusDMs: number[] = [];
  let trs: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trs.push(tr);
  }

  // Smooth Wilder series
  const trSmooth = trs.slice(-period).reduce((a, b) => a + b, 0);
  const plusDMSmooth = plusDMs.slice(-period).reduce((a, b) => a + b, 0);
  const minusDMSmooth = minusDMs.slice(-period).reduce((a, b) => a + b, 0);

  if (trSmooth === 0) return 20.0;

  const plusDI = (plusDMSmooth / trSmooth) * 100;
  const minusDI = (minusDMSmooth / trSmooth) * 100;
  const diDiff = Math.abs(plusDI - minusDI);
  const diSum = plusDI + minusDI;

  const dx = diSum === 0 ? 20 : (diDiff / diSum) * 100;
  return Math.min(95, Math.max(5, dx));
}

function calculateHurstProxy(prices: number[]): number {
  if (prices.length < 20) return 0.5;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  let cumDev = 0;
  const cumDevs = [];
  for (let r of returns) {
    cumDev += r - mean;
    cumDevs.push(cumDev);
  }

  const range = Math.max(...cumDevs) - Math.min(...cumDevs);
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0 || range === 0) return 0.5;
  const rs = range / stdDev;
  const h = Math.log(rs) / Math.log(returns.length);
  return Math.min(0.95, Math.max(0.05, h));
}

function getDefaultRegime(accountBalance: number, baseRiskPct: number): MarketRegimeState {
  return {
    regime: 'RANGING',
    label: 'RANGING (Mean-Reverting)',
    color: '#F59E0B',
    confidenceScore: 75,
    adxValue: 21.5,
    atrPercentile: 50,
    hurstExponent: 0.49,
    volatilityMultiplier: 1.0,
    recommendedStrategyType: 'Mean-Reversion, Bollinger Bands',
    avoidStrategyType: 'Breakout Scalping',
    worstCaseScenario: 'Sudden breakout tanpa retest.',
    bestCaseScenario: 'Osilasi batas support-resistance konsisten.',
    riskAutoTuner: {
      accountBalance,
      riskPerTradePct: baseRiskPct,
      dynamicLotSize: 0.15,
      calculatedDollarRisk: (accountBalance * baseRiskPct) / 100,
      dynamicSlAtrMultiple: 1.8,
      dynamicSlPriceDistance: 450,
      dynamicTpRatio: 1.8,
      dynamicTpPriceDistance: 810,
      circuitBreakerTrigger: 'Drawdown Harian -3.0%',
      recommendedLeverage: 2,
    },
  };
}

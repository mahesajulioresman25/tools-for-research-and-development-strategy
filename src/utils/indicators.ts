import { Candle, IndicatorMap, DetectedPattern } from '../types/trading';

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period - 1) {
      if (i >= period) {
        sum -= data[i - period];
      }
      result[i] = sum / period;
    }
  }
  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  const k = 2 / (period + 1);
  let initialSum = 0;

  for (let i = 0; i < period && i < data.length; i++) {
    initialSum += data[i];
  }

  if (data.length < period) return result;

  let prevEMA = initialSum / period;
  result[period - 1] = prevEMA;

  for (let i = period; i < data.length; i++) {
    const currentEMA = data[i] * k + prevEMA * (1 - k);
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }

  return result;
}

/**
 * Calculate Relative Strength Index (RSI - Wilder's Smoothing)
 */
export function calculateRSI(closes: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const currentRs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + currentRs);
    }
  }

  return result;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const middle = calculateSMA(closes, period);
  const lower: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const mid = middle[i];
    if (mid === null) continue;

    let varianceSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      varianceSum += Math.pow(closes[j] - mid, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    upper[i] = mid + stdDevMultiplier * stdDev;
    lower[i] = mid - stdDevMultiplier * stdDev;
  }

  return { upper, middle, lower };
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < 2) return result;

  const trueRanges: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  // Initial ATR as average of first 'period' TRs
  let sum = 0;
  for (let i = 0; i < period && i < trueRanges.length; i++) {
    sum += trueRanges[i];
  }

  if (trueRanges.length < period) return result;

  let currentAtr = sum / period;
  result[period - 1] = currentAtr;

  for (let i = period; i < candles.length; i++) {
    currentAtr = (currentAtr * (period - 1) + trueRanges[i]) / period;
    result[i] = currentAtr;
  }

  return result;
}

/**
 * Calculate MACD
 */
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);
  const macdLine: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine[i] = (fastEMA[i] as number) - (slowEMA[i] as number);
    }
  }

  // Calculate signal line from non-null macdLine values
  const validMacdValues: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null) {
      validMacdValues.push(macdLine[i] as number);
      validIndices.push(i);
    }
  }

  const signalLine: (number | null)[] = new Array(closes.length).fill(null);
  const histogram: (number | null)[] = new Array(closes.length).fill(null);

  if (validMacdValues.length >= signalPeriod) {
    const rawSignal = calculateEMA(validMacdValues, signalPeriod);
    for (let k = 0; k < rawSignal.length; k++) {
      const originalIdx = validIndices[k];
      signalLine[originalIdx] = rawSignal[k];
      if (macdLine[originalIdx] !== null && rawSignal[k] !== null) {
        histogram[originalIdx] = (macdLine[originalIdx] as number) - (rawSignal[k] as number);
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculate Volume Weighted Average Price (VWAP) & Standard Deviation Bands
 */
export function calculateVWAP(candles: Candle[]): {
  vwap: (number | null)[];
  upperBand: (number | null)[];
  lowerBand: (number | null)[];
} {
  const vwap: (number | null)[] = new Array(candles.length).fill(null);
  const upperBand: (number | null)[] = new Array(candles.length).fill(null);
  const lowerBand: (number | null)[] = new Array(candles.length).fill(null);

  let cumVolume = 0;
  let cumVolPrice = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume > 0 ? c.volume : 1;

    cumVolume += vol;
    cumVolPrice += typicalPrice * vol;

    const currentVwap = cumVolPrice / cumVolume;
    vwap[i] = currentVwap;

    // Rolling variance relative to VWAP
    const windowStart = Math.max(0, i - 30);
    let varSum = 0;
    let varCount = 0;
    for (let j = windowStart; j <= i; j++) {
      const tp = (candles[j].high + candles[j].low + candles[j].close) / 3;
      varSum += Math.pow(tp - currentVwap, 2);
      varCount++;
    }
    const stdDev = Math.sqrt(varSum / Math.max(1, varCount));
    upperBand[i] = currentVwap + 2.0 * stdDev;
    lowerBand[i] = currentVwap - 2.0 * stdDev;
  }

  return { vwap, upperBand, lowerBand };
}

/**
 * Calculate Supertrend (ATR Multiplier Band with Direction State)
 */
export function calculateSupertrend(
  candles: Candle[],
  period: number = 10,
  multiplier: number = 3.0
): {
  supertrend: (number | null)[];
  direction: (1 | -1 | null)[];
} {
  const supertrend: (number | null)[] = new Array(candles.length).fill(null);
  const direction: (1 | -1 | null)[] = new Array(candles.length).fill(null);

  if (candles.length < period) return { supertrend, direction };

  const atr = calculateATR(candles, period);

  const upperBand: number[] = [];
  const lowerBand: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const atrVal = atr[i] || candles[i].close * 0.015;
    upperBand[i] = hl2 + multiplier * atrVal;
    lowerBand[i] = hl2 - multiplier * atrVal;
  }

  let prevUpper = upperBand[period - 1];
  let prevLower = lowerBand[period - 1];
  let prevSupertrend = upperBand[period - 1];
  let prevDirection: 1 | -1 = 1;

  for (let i = period - 1; i < candles.length; i++) {
    const c = candles[i];
    const prevClose = i > 0 ? candles[i - 1].close : c.close;

    // Adjust lower band
    let currentLower = lowerBand[i];
    if (currentLower < prevLower || prevClose < prevLower) {
      // keep current
    } else {
      currentLower = prevLower;
    }

    // Adjust upper band
    let currentUpper = upperBand[i];
    if (currentUpper > prevUpper || prevClose > prevUpper) {
      // keep current
    } else {
      currentUpper = prevUpper;
    }

    // Direction flip
    let currentDirection: 1 | -1 = prevDirection;
    if (prevSupertrend === prevUpper) {
      currentDirection = c.close > currentUpper ? 1 : -1;
    } else {
      currentDirection = c.close < currentLower ? -1 : 1;
    }

    const currentSupertrend = currentDirection === 1 ? currentLower : currentUpper;

    supertrend[i] = currentSupertrend;
    direction[i] = currentDirection;

    prevUpper = currentUpper;
    prevLower = currentLower;
    prevSupertrend = currentSupertrend;
    prevDirection = currentDirection;
  }

  return { supertrend, direction };
}

/**
 * Calculate Stochastic RSI (%K and %D)
 */
export function calculateStochasticRSI(
  closes: number[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kSmooth: number = 3,
  dSmooth: number = 3
): {
  stochK: (number | null)[];
  stochD: (number | null)[];
} {
  const rsi = calculateRSI(closes, rsiPeriod);
  const rawStoch: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = rsiPeriod + stochPeriod - 1; i < closes.length; i++) {
    let minRsi = Infinity;
    let maxRsi = -Infinity;
    let valid = true;

    for (let j = i - stochPeriod + 1; j <= i; j++) {
      const val = rsi[j];
      if (val === null) {
        valid = false;
        break;
      }
      if (val < minRsi) minRsi = val;
      if (val > maxRsi) maxRsi = val;
    }

    if (valid && maxRsi !== minRsi && rsi[i] !== null) {
      rawStoch[i] = (((rsi[i] as number) - minRsi) / (maxRsi - minRsi)) * 100;
    } else {
      rawStoch[i] = 50;
    }
  }

  const validStochs: number[] = [];
  const validIndices: number[] = [];
  for (let i = 0; i < rawStoch.length; i++) {
    if (rawStoch[i] !== null) {
      validStochs.push(rawStoch[i] as number);
      validIndices.push(i);
    }
  }

  const smoothedK = calculateSMA(validStochs, kSmooth);
  const stochK: (number | null)[] = new Array(closes.length).fill(null);
  const validKs: number[] = [];
  const validKIndices: number[] = [];

  for (let idx = 0; idx < smoothedK.length; idx++) {
    const origIdx = validIndices[idx];
    stochK[origIdx] = smoothedK[idx];
    if (smoothedK[idx] !== null) {
      validKs.push(smoothedK[idx] as number);
      validKIndices.push(origIdx);
    }
  }

  const smoothedD = calculateSMA(validKs, dSmooth);
  const stochD: (number | null)[] = new Array(closes.length).fill(null);
  for (let idx = 0; idx < smoothedD.length; idx++) {
    const origIdx = validKIndices[idx];
    stochD[origIdx] = smoothedD[idx];
  }

  return { stochK, stochD };
}

/**
 * Calculate Donchian Channels (High/Low of N bars)
 */
export function calculateDonchianChannels(
  candles: Candle[],
  period: number = 20
): {
  upper: (number | null)[];
  lower: (number | null)[];
  middle: (number | null)[];
} {
  const upper: (number | null)[] = new Array(candles.length).fill(null);
  const lower: (number | null)[] = new Array(candles.length).fill(null);
  const middle: (number | null)[] = new Array(candles.length).fill(null);

  for (let i = period - 1; i < candles.length; i++) {
    let maxHigh = -Infinity;
    let minLow = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > maxHigh) maxHigh = candles[j].high;
      if (candles[j].low < minLow) minLow = candles[j].low;
    }
    upper[i] = maxHigh;
    lower[i] = minLow;
    middle[i] = (maxHigh + minLow) / 2;
  }

  return { upper, lower, middle };
}

/**
 * Comprehensive Indicator Pipeline
 */
export function computeAllIndicators(
  candles: Candle[],
  options: {
    fastEmaPeriod?: number;
    slowEmaPeriod?: number;
    rsiPeriod?: number;
    bbPeriod?: number;
    bbStdDev?: number;
    atrPeriod?: number;
  } = {}
): IndicatorMap {
  const closes = candles.map((c) => c.close);
  const fastPeriod = options.fastEmaPeriod || 20;
  const slowPeriod = options.slowEmaPeriod || 50;
  const rsiPeriod = options.rsiPeriod || 14;
  const bbPeriod = options.bbPeriod || 20;
  const bbStdDev = options.bbStdDev || 2;
  const atrPeriod = options.atrPeriod || 14;

  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);
  const emaTrend = calculateEMA(closes, 200);
  const rsi = calculateRSI(closes, rsiPeriod);
  const bb = calculateBollingerBands(closes, bbPeriod, bbStdDev);
  const atr = calculateATR(candles, atrPeriod);
  const macd = calculateMACD(closes);
  const vwapData = calculateVWAP(candles);
  const supertrendData = calculateSupertrend(candles, 10, 3.0);
  const stochData = calculateStochasticRSI(closes, rsiPeriod, 14, 3, 3);
  const donchianData = calculateDonchianChannels(candles, 20);

  return {
    emaFast,
    emaSlow,
    emaTrend,
    rsi,
    bbUpper: bb.upper,
    bbMiddle: bb.middle,
    bbLower: bb.lower,
    atr,
    macdLine: macd.macdLine,
    macdSignal: macd.signalLine,
    macdHist: macd.histogram,
    vwap: vwapData.vwap,
    vwapUpper: vwapData.upperBand,
    vwapLower: vwapData.lowerBand,
    supertrend: supertrendData.supertrend,
    supertrendDirection: supertrendData.direction,
    stochK: stochData.stochK,
    stochD: stochData.stochD,
    donchianUpper: donchianData.upper,
    donchianLower: donchianData.lower,
    donchianMiddle: donchianData.middle,
  };
}

/**
 * Scan for High-Alpha Technical Patterns & Inefficiencies
 */
export function detectMarketPatterns(candles: Candle[], indicators: IndicatorMap): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  if (candles.length < 5) return patterns;

  // 1. Fair Value Gaps (FVG) - 3-candle imbalance
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG: Candle 1 High is LOWER than Candle 3 Low (Gap in Candle 2)
    if (c3.low > c1.high && (c2.close > c2.open)) {
      const gapSize = c3.low - c1.high;
      if (gapSize > (c2.high - c2.low) * 0.2) {
        patterns.push({
          id: `fvg-bull-${i}`,
          type: 'FVG',
          candleIndex: i - 1,
          time: c2.time,
          price: (c3.low + c1.high) / 2,
          topPrice: c3.low,
          bottomPrice: c1.high,
          direction: 'BULLISH',
          confidence: 88,
          description: `Bullish Fair Value Gap (${c1.high.toFixed(2)} - ${c3.low.toFixed(2)}) terbentuk karena lonjakan volume agresif.`,
        });
      }
    }

    // Bearish FVG: Candle 1 Low is HIGHER than Candle 3 High
    if (c3.high < c1.low && (c2.close < c2.open)) {
      const gapSize = c1.low - c3.high;
      if (gapSize > (c2.high - c2.low) * 0.2) {
        patterns.push({
          id: `fvg-bear-${i}`,
          type: 'FVG',
          candleIndex: i - 1,
          time: c2.time,
          price: (c1.low + c3.high) / 2,
          topPrice: c1.low,
          bottomPrice: c3.high,
          direction: 'BEARISH',
          confidence: 88,
          description: `Bearish Fair Value Gap (${c3.high.toFixed(2)} - ${c1.low.toFixed(2)}) zona imbalance penawaran tinggi.`,
        });
      }
    }
  }

  // 2. Liquidity Sweeps & Stop Hunt Rejection
  for (let i = 5; i < candles.length; i++) {
    const current = candles[i];
    let priorHigh = -Infinity;
    let priorLow = Infinity;
    for (let j = i - 5; j < i; j++) {
      if (candles[j].high > priorHigh) priorHigh = candles[j].high;
      if (candles[j].low < priorLow) priorLow = candles[j].low;
    }

    const upperWick = current.high - Math.max(current.open, current.close);
    const candleBody = Math.abs(current.close - current.open);
    if (current.high > priorHigh && current.close < priorHigh && upperWick > candleBody * 1.5) {
      patterns.push({
        id: `sweep-bear-${i}`,
        type: 'LIQUIDITY_SWEEP',
        candleIndex: i,
        time: current.time,
        price: current.high,
        direction: 'BEARISH',
        confidence: 84,
        description: `Liquidity Grab / Stop Hunt di atas $${priorHigh.toFixed(2)}. Rejection wick panjang menandakan seller menyerap order buy retail.`,
      });
    }

    const lowerWick = Math.min(current.open, current.close) - current.low;
    if (current.low < priorLow && current.close > priorLow && lowerWick > candleBody * 1.5) {
      patterns.push({
        id: `sweep-bull-${i}`,
        type: 'LIQUIDITY_SWEEP',
        candleIndex: i,
        time: current.time,
        price: current.low,
        direction: 'BULLISH',
        confidence: 84,
        description: `Liquidity Sweep di bawah $${priorLow.toFixed(2)}. Smart money mengaktifkan stop loss buyer sebelum reversal naik.`,
      });
    }
  }

  // 3. Supertrend Trend Flips
  const stDir = indicators.supertrendDirection;
  if (stDir) {
    for (let i = 1; i < candles.length; i++) {
      const prevD = stDir[i - 1];
      const currD = stDir[i];
      if (prevD !== null && currD !== null && prevD !== currD) {
        patterns.push({
          id: `supertrend-flip-${i}`,
          type: 'SUPERTREND_FLIP',
          candleIndex: i,
          time: candles[i].time,
          price: candles[i].close,
          direction: currD === 1 ? 'BULLISH' : 'BEARISH',
          confidence: 85,
          description: `Supertrend Momentum Flip: Reversal arah tren ${currD === 1 ? 'BULLISH 🟢' : 'BEARISH 🔴'} dengan konfirmasi breakout ATR band.`,
        });
      }
    }
  }

  // 4. RSI Divergence
  const rsi = indicators.rsi;
  if (rsi) {
    for (let i = 10; i < candles.length; i++) {
      const rsiCurr = rsi[i];
      const rsiPrev = rsi[i - 6];
      if (rsiCurr === null || rsiPrev === null) continue;

      const priceCurr = candles[i].close;
      const pricePrev = candles[i - 6].close;

      if (priceCurr < pricePrev && rsiCurr > rsiPrev && rsiCurr < 45) {
        patterns.push({
          id: `div-bull-${i}`,
          type: 'RSI_DIVERGENCE',
          candleIndex: i,
          time: candles[i].time,
          price: priceCurr,
          direction: 'BULLISH',
          confidence: 82,
          description: `Bullish RSI Divergence: Harga melemah namun momentum penjual terkuras. Potensi reversal kuat.`,
        });
      }

      if (priceCurr > pricePrev && rsiCurr < rsiPrev && rsiCurr > 55) {
        patterns.push({
          id: `div-bear-${i}`,
          type: 'RSI_DIVERGENCE',
          candleIndex: i,
          time: candles[i].time,
          price: priceCurr,
          direction: 'BEARISH',
          confidence: 82,
          description: `Bearish RSI Divergence: Harga mencetak new high namun volume & momentum pembeli melemah.`,
        });
      }
    }
  }

  return patterns;
}

import {
  Candle,
  StrategyConfig,
  BacktestResult,
  Trade,
  EquityPoint,
  BacktestMetrics,
  MonteCarloResult,
  PositionSide,
} from '../types/trading';
import { computeAllIndicators, detectMarketPatterns } from './indicators';

export function runBacktest(
  candles: Candle[],
  strategy: StrategyConfig,
  initialCapital: number = 10000
): BacktestResult {
  const p = strategy.params;
  const indicators = computeAllIndicators(candles, {
    fastEmaPeriod: p.fastEmaPeriod,
    slowEmaPeriod: p.slowEmaPeriod,
    rsiPeriod: p.rsiPeriod,
    bbPeriod: p.bbPeriod,
    bbStdDev: p.bbStdDev,
    atrPeriod: p.atrPeriod,
  });

  const patterns = detectMarketPatterns(candles, indicators);

  let currentCapital = initialCapital;
  let peakCapital = initialCapital;
  const equityCurve: EquityPoint[] = [
    { time: candles[0]?.time || Date.now(), equity: initialCapital, drawdown: 0 },
  ];
  const closedTrades: Trade[] = [];
  let openTrade: Trade | null = null;
  let cooldownCounter = 0;

  const startIndex = Math.max(p.slowEmaPeriod, p.bbPeriod, p.atrPeriod, 25);

  for (let i = startIndex; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const prev2 = candles[i - 2];

    const atrVal = indicators.atr?.[i] || current.close * 0.015;
    const rsiVal = indicators.rsi?.[i] ?? 50;
    const fastEma = indicators.emaFast?.[i];
    const slowEma = indicators.emaSlow?.[i];
    const prevFastEma = indicators.emaFast?.[i - 1];
    const prevSlowEma = indicators.emaSlow?.[i - 1];
    const bbUp = indicators.bbUpper?.[i];
    const bbLow = indicators.bbLower?.[i];
    const bbMid = indicators.bbMiddle?.[i];
    const vwapVal = indicators.vwap?.[i];
    const vwapUpper = indicators.vwapUpper?.[i];
    const vwapLower = indicators.vwapLower?.[i];
    const stDir = indicators.supertrendDirection?.[i];
    const prevStDir = indicators.supertrendDirection?.[i - 1];
    const stochK = indicators.stochK?.[i];
    const stochD = indicators.stochD?.[i];
    const prevStochK = indicators.stochK?.[i - 1];
    const prevStochD = indicators.stochD?.[i - 1];
    const donchianUp = indicators.donchianUpper?.[i - 1];
    const donchianLow = indicators.donchianLower?.[i - 1];
    const macdHist = indicators.macdHist?.[i];
    const prevMacdHist = indicators.macdHist?.[i - 1];

    if (cooldownCounter > 0) {
      cooldownCounter--;
    }

    // 1. Manage Active Open Trade
    if (openTrade) {
      const isLong = openTrade.side === 'LONG';
      let exitPrice: number | null = null;
      let exitReason: Trade['exitReason'] | null = null;

      // Trailing stop activation check
      if (p.useTrailingStop) {
        const riskDistance = Math.abs(openTrade.entryPrice - openTrade.stopLossPrice);
        if (isLong) {
          const currentProfit = current.high - openTrade.entryPrice;
          if (currentProfit >= riskDistance * p.trailingStopActivationRR) {
            openTrade.trailingStopActive = true;
            const newSL = Math.max(openTrade.stopLossPrice, current.close - atrVal * p.trailingStopDistanceATR);
            openTrade.stopLossPrice = Math.max(openTrade.entryPrice, newSL);
          }
        } else {
          const currentProfit = openTrade.entryPrice - current.low;
          if (currentProfit >= riskDistance * p.trailingStopActivationRR) {
            openTrade.trailingStopActive = true;
            const newSL = Math.min(openTrade.stopLossPrice, current.close + atrVal * p.trailingStopDistanceATR);
            openTrade.stopLossPrice = Math.min(openTrade.entryPrice, newSL);
          }
        }
      }

      // Check Stop Loss hit
      if (isLong && current.low <= openTrade.stopLossPrice) {
        exitPrice = openTrade.stopLossPrice;
        exitReason = openTrade.trailingStopActive ? 'TRAILING_STOP' : 'STOP_LOSS';
      } else if (!isLong && current.high >= openTrade.stopLossPrice) {
        exitPrice = openTrade.stopLossPrice;
        exitReason = openTrade.trailingStopActive ? 'TRAILING_STOP' : 'STOP_LOSS';
      }
      // Check Take Profit hit
      else if (isLong && current.high >= openTrade.takeProfitPrice) {
        exitPrice = openTrade.takeProfitPrice;
        exitReason = 'TAKE_PROFIT';
      } else if (!isLong && current.low <= openTrade.takeProfitPrice) {
        exitPrice = openTrade.takeProfitPrice;
        exitReason = 'TAKE_PROFIT';
      }
      // Check Last Candle Close
      else if (i === candles.length - 1) {
        exitPrice = current.close;
        exitReason = 'END_OF_DATA';
      }

      if (exitPrice !== null && exitReason !== null) {
        const slippageMultiplier = isLong ? (1 - (p.slippageBps / 10000)) : (1 + (p.slippageBps / 10000));
        const realizedExitPrice = exitPrice * slippageMultiplier;
        const grossPnl = isLong
          ? (realizedExitPrice - openTrade.entryPrice) * openTrade.size
          : (openTrade.entryPrice - realizedExitPrice) * openTrade.size;

        const exitFee = realizedExitPrice * openTrade.size * (p.takerFeePercent / 100);
        const totalFees = openTrade.feesPaid + exitFee;
        const slippageCost = Math.abs(exitPrice - realizedExitPrice) * openTrade.size;
        const netPnl = grossPnl - exitFee;

        openTrade.exitIndex = i;
        openTrade.exitTime = current.time;
        openTrade.exitPrice = realizedExitPrice;
        openTrade.pnl = netPnl;
        openTrade.pnlPercent = (netPnl / openTrade.initialMargin) * 100;
        openTrade.exitReason = exitReason;
        openTrade.feesPaid = totalFees;
        openTrade.slippageIncurred += slippageCost;
        openTrade.durationCandles = i - openTrade.entryIndex;

        currentCapital += netPnl;
        if (currentCapital > peakCapital) peakCapital = currentCapital;

        const currentDrawdown = ((peakCapital - currentCapital) / peakCapital) * 100;

        closedTrades.push(openTrade);
        equityCurve.push({
          time: current.time,
          equity: currentCapital,
          drawdown: currentDrawdown,
          tradeIndex: closedTrades.length - 1,
          pnl: netPnl,
        });

        openTrade = null;
        cooldownCounter = p.cooldownCandles;
      }
    }

    // 2. Check Strategy Entry Conditions if No Open Position
    if (!openTrade && cooldownCounter === 0 && i < candles.length - 2) {
      let signal: { side: PositionSide; reason: string } | null = null;

      // Strategy 1: ICT / SMC (Fair Value Gap + Liquidity Sweep)
      if (strategy.category === 'ICT_SMC') {
        const recentPatterns = patterns.filter(
          (pat) => pat.candleIndex >= i - 4 && pat.candleIndex <= i
        );
        const bullFVG = recentPatterns.some((pt) => pt.type === 'FVG' && pt.direction === 'BULLISH');
        const bearFVG = recentPatterns.some((pt) => pt.type === 'FVG' && pt.direction === 'BEARISH');
        const bullSweep = recentPatterns.some((pt) => pt.type === 'LIQUIDITY_SWEEP' && pt.direction === 'BULLISH');
        const bearSweep = recentPatterns.some((pt) => pt.type === 'LIQUIDITY_SWEEP' && pt.direction === 'BEARISH');

        if ((bullFVG || bullSweep) && current.close > current.open && rsiVal > 42 && rsiVal < 68) {
          signal = { side: 'LONG', reason: 'ICT Liquidity Sweep / FVG Tap Bullish Reaction' };
        } else if ((bearFVG || bearSweep) && current.close < current.open && rsiVal < 58 && rsiVal > 32) {
          signal = { side: 'SHORT', reason: 'ICT Liquidity Sweep / FVG Tap Bearish Reaction' };
        }
      }

      // Strategy 2: Supertrend & Anchored VWAP Pullback
      else if (strategy.category === 'SUPERTREND_VWAP') {
        const isSupertrendBull = stDir === 1;
        const isSupertrendBear = stDir === -1;
        const aboveVwap = vwapVal !== null && vwapVal !== undefined && current.close > vwapVal;
        const belowVwap = vwapVal !== null && vwapVal !== undefined && current.close < vwapVal;

        if (isSupertrendBull && aboveVwap && current.low <= (fastEma || current.close) && current.close > current.open) {
          signal = { side: 'LONG', reason: 'Supertrend Bullish Flip + VWAP Support Bounce' };
        } else if (isSupertrendBear && belowVwap && current.high >= (fastEma || current.close) && current.close < current.open) {
          signal = { side: 'SHORT', reason: 'Supertrend Bearish Flip + VWAP Resistance Rejection' };
        }
      }

      // Strategy 3: Mean Reversion & Volatility Squeeze
      else if (strategy.category === 'MEAN_REVERSION') {
        if (bbLow && prev.low <= bbLow && current.close > prev.close && rsiVal < p.rsiOversold + 5) {
          signal = { side: 'LONG', reason: 'Bollinger Band Oversold Rebound + RSI Recovery' };
        } else if (bbUp && prev.high >= bbUp && current.close < prev.close && rsiVal > p.rsiOverbought - 5) {
          signal = { side: 'SHORT', reason: 'Bollinger Band Overbought Rejection + RSI Exhaustion' };
        }
      }

      // Strategy 4: High-Frequency Geometric Grid Trading
      else if (strategy.category === 'GRID_TRADING') {
        if (bbLow && current.close <= bbLow * 1.004 && rsiVal < 45) {
          signal = { side: 'LONG', reason: 'Grid Bottom Channel Limit Absorption Buy' };
        } else if (bbUp && current.close >= bbUp * 0.996 && rsiVal > 55) {
          signal = { side: 'SHORT', reason: 'Grid Top Channel Limit Distribution Sell' };
        }
      }

      // Strategy 5: Trend Surfer & EMA Momentum
      else if (strategy.category === 'TREND_MOMENTUM') {
        const isBullishCross =
          prevFastEma !== null &&
          prevSlowEma !== null &&
          fastEma !== null &&
          slowEma !== null &&
          prevFastEma <= prevSlowEma &&
          fastEma > slowEma;

        const isBearishCross =
          prevFastEma !== null &&
          prevSlowEma !== null &&
          fastEma !== null &&
          slowEma !== null &&
          prevFastEma >= prevSlowEma &&
          fastEma < slowEma;

        if (isBullishCross && current.volume > (prev.volume + prev2.volume) / 2) {
          signal = { side: 'LONG', reason: 'Fast/Slow EMA Bullish Cross with Volume Surge' };
        } else if (isBearishCross && current.volume > (prev.volume + prev2.volume) / 2) {
          signal = { side: 'SHORT', reason: 'Fast/Slow EMA Bearish Cross with Volume Surge' };
        }
      }

      // Strategy 6: DCA Martingale Safety Accumulation
      else if (strategy.category === 'DCA_MARTINGALE') {
        if (rsiVal < p.rsiOversold && current.close < (fastEma || current.close) * 0.985 && current.close > current.open) {
          signal = { side: 'LONG', reason: 'Safety Order Trigger: Oversold Dip Accumulation' };
        } else if (rsiVal > p.rsiOverbought && current.close > (fastEma || current.close) * 1.015 && current.close < current.open) {
          signal = { side: 'SHORT', reason: 'Overheated Tier Resistance Exit / Scale Distribution' };
        }
      }

      // Strategy 7: Zero-Lag MACD Momentum & Stochastic %K/%D Cross
      else if (strategy.category === 'MACD_STOCHASTIC') {
        const stochBullCross =
          prevStochK !== null &&
          prevStochD !== null &&
          stochK !== null &&
          stochD !== null &&
          prevStochK <= prevStochD &&
          stochK > stochD &&
          stochK < 45;

        const stochBearCross =
          prevStochK !== null &&
          prevStochD !== null &&
          stochK !== null &&
          stochD !== null &&
          prevStochK >= prevStochD &&
          stochK < stochD &&
          stochK > 55;

        const macdRising = macdHist !== null && prevMacdHist !== null && macdHist > prevMacdHist;
        const macdFalling = macdHist !== null && prevMacdHist !== null && macdHist < prevMacdHist;

        if (stochBullCross && macdRising) {
          signal = { side: 'LONG', reason: 'Stochastic %K Cross %D Oversold + MACD Histogram Expansion' };
        } else if (stochBearCross && macdFalling) {
          signal = { side: 'SHORT', reason: 'Stochastic %K Cross %D Overbought + MACD Histogram Contraction' };
        }
      }

      // Strategy 8: Turtle Trading Donchian Channel Breakout
      else if (strategy.category === 'VOLATILITY_BREAKOUT') {
        if (donchianUp && current.high >= donchianUp && current.close > prev.close && rsiVal > 48) {
          signal = { side: 'LONG', reason: '20-Bar Donchian High Breakout with ATR Volatility Expansion' };
        } else if (donchianLow && current.low <= donchianLow && current.close < prev.close && rsiVal < 52) {
          signal = { side: 'SHORT', reason: '20-Bar Donchian Low Breakdown with Momentum Follow-Through' };
        }
      }

      // Strategy 9: Anchored VWAP Deviation Band Reversion
      else if (strategy.category === 'VWAP_BANDS') {
        if (vwapLower && current.low <= vwapLower && current.close > prev.close && rsiVal < 38) {
          signal = { side: 'LONG', reason: 'VWAP -2 Sigma Lower Band Oversold Stretch Rebound' };
        } else if (vwapUpper && current.high >= vwapUpper && current.close < prev.close && rsiVal > 62) {
          signal = { side: 'SHORT', reason: 'VWAP +2 Sigma Upper Band Overbought Stretch Rejection' };
        }
      }

      // Strategy 10: Volume Profile POC & Value Area Bounce
      else if (strategy.category === 'VOLUME_PROFILE') {
        if (bbLow && prev.low <= bbLow && current.volume > prev.volume * 1.15 && current.close > current.open) {
          signal = { side: 'LONG', reason: 'Value Area Low (VAL) Liquidity Defense Bounce' };
        } else if (bbUp && prev.high >= bbUp && current.volume > prev.volume * 1.15 && current.close < current.open) {
          signal = { side: 'SHORT', reason: 'Value Area High (VAH) Distribution Wall Rejection' };
        }
      }

      // Strategy 11: Microstructure Scalper
      else if (strategy.category === 'MICROSTRUCTURE') {
        const body = Math.abs(current.close - current.open);
        const lowerWick = Math.min(current.open, current.close) - current.low;
        const upperWick = current.high - Math.max(current.open, current.close);

        if (lowerWick > body * 2 && current.close > current.open && current.volume > prev.volume * 1.2) {
          signal = { side: 'LONG', reason: 'Absorption Pin-Bar with High Buy Volume' };
        } else if (upperWick > body * 2 && current.close < current.open && current.volume > prev.volume * 1.2) {
          signal = { side: 'SHORT', reason: 'Supply Wall Rejection Pin-Bar with High Sell Volume' };
        }
      }

      // Strategy 12: Funding Rate & Basis Arbitrage Mean Reversion
      else if (strategy.category === 'FUNDING_RATE') {
        if (rsiVal < 32 && current.close > prev.close && (bbMid ? current.close < bbMid : true)) {
          signal = { side: 'LONG', reason: 'High Negative Funding Exhaustion & Squeeze Setup' };
        } else if (rsiVal > 68 && current.close < prev.close && (bbMid ? current.close > bbMid : true)) {
          signal = { side: 'SHORT', reason: 'High Positive Funding Overheating Long Washout Setup' };
        }
      }

      // Execute Entry
      if (signal) {
        const isLong = signal.side === 'LONG';
        const entryPrice = current.close * (isLong ? (1 + (p.slippageBps / 10000)) : (1 - (p.slippageBps / 10000)));
        const stopDistance = Math.max(atrVal * p.atrMultiplierSL, entryPrice * 0.005);
        const stopLossPrice = isLong ? entryPrice - stopDistance : entryPrice + stopDistance;
        const takeProfitPrice = isLong
          ? entryPrice + stopDistance * p.riskRewardRatio
          : entryPrice - stopDistance * p.riskRewardRatio;

        // Position sizing based on capital at risk %
        const riskAmount = currentCapital * (p.riskPerTradePercent / 100);
        const unitRisk = Math.abs(entryPrice - stopLossPrice);
        let size = riskAmount / unitRisk;
        // Cap max position size by leverage
        const maxNotional = currentCapital * p.leverage;
        if (size * entryPrice > maxNotional) {
          size = maxNotional / entryPrice;
        }

        const initialMargin = (size * entryPrice) / p.leverage;
        const entryFee = entryPrice * size * (p.takerFeePercent / 100);
        const slippageIncurred = Math.abs(entryPrice - current.close) * size;

        openTrade = {
          id: `trade-${i}-${signal.side.toLowerCase()}`,
          entryIndex: i,
          entryTime: current.time,
          entryPrice,
          takeProfitPrice,
          stopLossPrice,
          side: signal.side,
          size,
          initialMargin,
          feesPaid: entryFee,
          slippageIncurred,
          trailingStopActive: false,
        };
      }
    }
  }

  // Compile Comprehensive Metrics
  const metrics = calculateMetrics(initialCapital, currentCapital, closedTrades, equityCurve);
  const monteCarlo = runMonteCarloSimulation(closedTrades, initialCapital, 500);

  return {
    strategyName: strategy.name,
    symbol: 'BTCUSDT',
    interval: '15m',
    metrics,
    trades: closedTrades,
    equityCurve,
    patterns,
    monteCarlo,
  };
}

function calculateMetrics(
  initialCapital: number,
  finalCapital: number,
  trades: Trade[],
  equityCurve: EquityPoint[]
): BacktestMetrics {
  const netProfit = finalCapital - initialCapital;
  const totalReturn = (netProfit / initialCapital) * 100;
  const totalTrades = trades.length;

  const winTrades = trades.filter((t) => (t.pnl || 0) > 0);
  const lossTrades = trades.filter((t) => (t.pnl || 0) <= 0);

  const totalWinAmount = winTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
  const totalLossAmount = Math.abs(lossTrades.reduce((acc, t) => acc + (t.pnl || 0), 0));

  const winRate = totalTrades > 0 ? (winTrades.length / totalTrades) * 100 : 0;
  const avgWin = winTrades.length > 0 ? totalWinAmount / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? totalLossAmount / lossTrades.length : 0;
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 99 : 0;
  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  const expectancy = totalTrades > 0 ? netProfit / totalTrades : 0;

  // Max Drawdown Calculation
  let peak = initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownAmount = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const ddAmount = peak - point.equity;
    const ddPercent = peak > 0 ? (ddAmount / peak) * 100 : 0;
    if (ddPercent > maxDrawdown) maxDrawdown = ddPercent;
    if (ddAmount > maxDrawdownAmount) maxDrawdownAmount = ddAmount;
  }

  // Consecutive Wins & Losses
  let maxConsecWins = 0;
  let maxConsecLosses = 0;
  let currWins = 0;
  let currLosses = 0;

  for (const t of trades) {
    if ((t.pnl || 0) > 0) {
      currWins++;
      currLosses = 0;
      if (currWins > maxConsecWins) maxConsecWins = currWins;
    } else {
      currLosses++;
      currWins = 0;
      if (currLosses > maxConsecLosses) maxConsecLosses = currLosses;
    }
  }

  // Sharpe & Sortino (Standardized Daily/Period Returns)
  const returns = trades.map((t) => (t.pnl || 0) / initialCapital);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance =
    returns.length > 1
      ? returns.reduce((acc, r) => acc + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
      : 0;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

  const downReturns = returns.filter((r) => r < 0);
  const downVariance =
    downReturns.length > 0
      ? downReturns.reduce((acc, r) => acc + Math.pow(r, 2), 0) / downReturns.length
      : 0;
  const downStdDev = Math.sqrt(downVariance);
  const sortinoRatio = downStdDev > 0 ? (avgReturn / downStdDev) * Math.sqrt(252) : 0;

  const calmarRatio = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;

  const totalFeesPaid = trades.reduce((acc, t) => acc + t.feesPaid, 0);
  const totalSlippagePaid = trades.reduce((acc, t) => acc + t.slippageIncurred, 0);
  const avgTradeDurationCandles =
    trades.length > 0
      ? Math.round(trades.reduce((acc, t) => acc + (t.durationCandles || 1), 0) / trades.length)
      : 0;

  return {
    initialCapital,
    finalCapital,
    netProfit: parseFloat(netProfit.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    totalTrades,
    winTrades: winTrades.length,
    lossTrades: lossTrades.length,
    winRate: parseFloat(winRate.toFixed(1)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    maxDrawdownAmount: parseFloat(maxDrawdownAmount.toFixed(2)),
    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
    sortinoRatio: parseFloat(sortinoRatio.toFixed(2)),
    calmarRatio: parseFloat(calmarRatio.toFixed(2)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    payoffRatio: parseFloat(payoffRatio.toFixed(2)),
    expectancy: parseFloat(expectancy.toFixed(2)),
    maxConsecutiveWins: maxConsecWins,
    maxConsecutiveLosses: maxConsecLosses,
    totalFeesPaid: parseFloat(totalFeesPaid.toFixed(2)),
    totalSlippagePaid: parseFloat(totalSlippagePaid.toFixed(2)),
    avgTradeDurationCandles,
  };
}

export function runMonteCarloSimulation(
  trades: Trade[],
  initialCapital: number,
  simulationsCount: number = 500
): MonteCarloResult {
  if (trades.length === 0) {
    return {
      simulationsCount: 0,
      medianReturn: 0,
      p5Return: 0,
      p95Return: 0,
      medianMaxDrawdown: 0,
      worstCaseDrawdown: 0,
      riskOfRuinPercent: 0,
      confidenceInterval95: [0, 0],
      equityRuns: [],
    };
  }

  const tradePnls = trades.map((t) => t.pnl || 0);
  const finalReturns: number[] = [];
  const maxDrawdowns: number[] = [];
  let ruinCount = 0;
  const sampleRuns: number[][] = [];

  for (let s = 0; s < simulationsCount; s++) {
    let currentEquity = initialCapital;
    let peak = initialCapital;
    let maxDD = 0;
    const runCurve: number[] = [initialCapital];

    // Bootstrap resampling of trades
    for (let t = 0; t < tradePnls.length; t++) {
      const randomIndex = Math.floor(Math.random() * tradePnls.length);
      const pnl = tradePnls[randomIndex];
      currentEquity += pnl;

      if (currentEquity > peak) peak = currentEquity;
      const dd = peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0;
      if (dd > maxDD) maxDD = dd;

      if (s < 8) {
        runCurve.push(Math.max(0, currentEquity));
      }

      if (currentEquity <= initialCapital * 0.3) {
        ruinCount++;
        break;
      }
    }

    if (s < 8) {
      sampleRuns.push(runCurve);
    }

    const ret = ((currentEquity - initialCapital) / initialCapital) * 100;
    finalReturns.push(ret);
    maxDrawdowns.push(maxDD);
  }

  finalReturns.sort((a, b) => a - b);
  maxDrawdowns.sort((a, b) => a - b);

  const medianReturn = finalReturns[Math.floor(finalReturns.length * 0.5)] || 0;
  const p5Return = finalReturns[Math.floor(finalReturns.length * 0.05)] || 0;
  const p95Return = finalReturns[Math.floor(finalReturns.length * 0.95)] || 0;
  const medianMaxDrawdown = maxDrawdowns[Math.floor(maxDrawdowns.length * 0.5)] || 0;
  const worstCaseDrawdown = maxDrawdowns[Math.floor(maxDrawdowns.length * 0.95)] || 0;
  const riskOfRuinPercent = (ruinCount / simulationsCount) * 100;

  return {
    simulationsCount,
    medianReturn: parseFloat(medianReturn.toFixed(2)),
    p5Return: parseFloat(p5Return.toFixed(2)),
    p95Return: parseFloat(p95Return.toFixed(2)),
    medianMaxDrawdown: parseFloat(medianMaxDrawdown.toFixed(2)),
    worstCaseDrawdown: parseFloat(worstCaseDrawdown.toFixed(2)),
    riskOfRuinPercent: parseFloat(riskOfRuinPercent.toFixed(1)),
    confidenceInterval95: [parseFloat(p5Return.toFixed(1)), parseFloat(p95Return.toFixed(1))],
    equityRuns: sampleRuns,
  };
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  trades?: number;
}

export interface IndicatorMap {
  emaFast?: (number | null)[];
  emaSlow?: (number | null)[];
  emaTrend?: (number | null)[];
  rsi?: (number | null)[];
  macdLine?: (number | null)[];
  macdSignal?: (number | null)[];
  macdHist?: (number | null)[];
  bbUpper?: (number | null)[];
  bbMiddle?: (number | null)[];
  bbLower?: (number | null)[];
  atr?: (number | null)[];
  stochK?: (number | null)[];
  stochD?: (number | null)[];
  vwap?: (number | null)[];
  vwapUpper?: (number | null)[];
  vwapLower?: (number | null)[];
  supertrend?: (number | null)[];
  supertrendDirection?: (1 | -1 | null)[];
  donchianUpper?: (number | null)[];
  donchianLower?: (number | null)[];
  donchianMiddle?: (number | null)[];
}

export interface DetectedPattern {
  id: string;
  type:
    | 'FVG'
    | 'LIQUIDITY_SWEEP'
    | 'ORDER_BLOCK'
    | 'RSI_DIVERGENCE'
    | 'VOLATILITY_SQUEEZE'
    | 'BREAKOUT'
    | 'SUPERTREND_FLIP'
    | 'VWAP_CROSS'
    | 'DONCHIAN_BREAKOUT';
  candleIndex: number;
  time: number;
  price: number;
  direction: 'BULLISH' | 'BEARISH';
  confidence: number;
  description: string;
  topPrice?: number;
  bottomPrice?: number;
}

export type OrderSide = 'BUY' | 'SELL';
export type PositionSide = 'LONG' | 'SHORT';

export interface ActiveExecutionPosition {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  currentPrice: number;
  size: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  openTime: number;
  trailingPeak?: number;
  regimeAtEntry?: string;
  riskDollars?: number;
  strategyAssigned?: string;
}

export interface Trade {
  id: string;
  entryIndex: number;
  entryTime: number;
  entryPrice: number;
  exitIndex?: number;
  exitTime?: number;
  exitPrice?: number;
  side: PositionSide;
  size: number;
  initialMargin: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  trailingStopActive?: boolean;
  pnl?: number;
  pnlPercent?: number;
  exitReason?: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'SIGNAL_REVERSAL' | 'END_OF_DATA' | 'MANUAL';
  feesPaid: number;
  slippageIncurred: number;
  durationCandles?: number;
}

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  category:
    | 'ICT_SMC'
    | 'MEAN_REVERSION'
    | 'TREND_MOMENTUM'
    | 'MICROSTRUCTURE'
    | 'FUNDING_RATE'
    | 'SUPERTREND_VWAP'
    | 'GRID_TRADING'
    | 'DCA_MARTINGALE'
    | 'MACD_STOCHASTIC'
    | 'VOLATILITY_BREAKOUT'
    | 'VWAP_BANDS'
    | 'VOLUME_PROFILE';
  params: {
    // Technical parameters
    fastEmaPeriod: number;
    slowEmaPeriod: number;
    rsiPeriod: number;
    rsiOverbought: number;
    rsiOversold: number;
    bbPeriod: number;
    bbStdDev: number;
    atrPeriod: number;
    atrMultiplierSL: number;
    riskRewardRatio: number;
    // Execution parameters
    riskPerTradePercent: number; // e.g. 2%
    leverage: number; // e.g. 1x, 5x, 10x
    makerFeePercent: number; // e.g. 0.02%
    takerFeePercent: number; // e.g. 0.05%
    slippageBps: number; // Basis points (1 bps = 0.01%)
    useTrailingStop: boolean;
    trailingStopActivationRR: number; // Trigger after 1.5R profit
    trailingStopDistanceATR: number;
    useVolatilityFilter: boolean;
    useSentimentFilter: boolean;
    maxDailyLossPercent: number;
    cooldownCandles: number;
  };
}

export interface BacktestMetrics {
  initialCapital: number;
  finalCapital: number;
  netProfit: number;
  totalReturn: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownAmount: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  avgWin: number;
  avgLoss: number;
  payoffRatio: number;
  expectancy: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  totalFeesPaid: number;
  totalSlippagePaid: number;
  avgTradeDurationCandles: number;
}

export interface EquityPoint {
  time: number;
  equity: number;
  drawdown: number;
  tradeIndex?: number;
  pnl?: number;
}

export interface BacktestResult {
  strategyName: string;
  symbol: string;
  interval: string;
  metrics: BacktestMetrics;
  trades: Trade[];
  equityCurve: EquityPoint[];
  patterns: DetectedPattern[];
  monteCarlo: MonteCarloResult;
}

export interface MonteCarloResult {
  simulationsCount: number;
  medianReturn: number;
  p5Return: number; // 5th percentile (worst case)
  p95Return: number; // 95th percentile (best case)
  medianMaxDrawdown: number;
  worstCaseDrawdown: number;
  riskOfRuinPercent: number;
  confidenceInterval95: [number, number];
  equityRuns: number[][]; // Sample runs for plotting
}

export interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: number;
  quoteVolume: number;
}

export interface MarketSentiment {
  value: string;
  value_classification: string;
  fundingRate?: number;
  openInterestChange?: number;
}

export interface AIAlphaAnalysis {
  alphaScore: number;
  summary: string;
  marketInefficiencies: {
    title: string;
    mechanism: string;
    edgeType: string;
    impact: 'High' | 'Medium' | 'Low';
  }[];
  executionVulnerabilities: {
    risk: string;
    mitigation: string;
  }[];
  algorithmOptimizations: {
    component: string;
    recommendation: string;
    expectedImpact: string;
  }[];
  marketRegimeSuitability: {
    trending: string;
    ranging: string;
    highVolatility: string;
    lowLiquidity: string;
  };
  deploymentChecklist: string[];
}

export interface BotCodeResult {
  language: string;
  filename: string;
  code: string;
  installationGuide: string[];
  keyFeatures: string[];
}

export type MarketRegimeType = 'TRENDING' | 'RANGING' | 'HIGH_VOLATILITY' | 'LOW_VOL_CHOP';

export interface MarketRegimeState {
  regime: MarketRegimeType;
  label: string;
  color: string;
  confidenceScore: number;
  adxValue: number;
  atrPercentile: number;
  hurstExponent: number;
  volatilityMultiplier: number;
  recommendedStrategyType: string;
  avoidStrategyType: string;
  worstCaseScenario: string;
  bestCaseScenario: string;
  riskAutoTuner: {
    accountBalance: number;
    riskPerTradePct: number;
    dynamicLotSize: number;
    calculatedDollarRisk: number;
    dynamicSlAtrMultiple: number;
    dynamicSlPriceDistance: number;
    dynamicTpRatio: number;
    dynamicTpPriceDistance: number;
    circuitBreakerTrigger: string;
    recommendedLeverage: number;
  };
}

export interface AssetScanItem {
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number;
  markPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24hUsd: number;
  spreadBps: number;
  regime: MarketRegimeType;
  regimeLabel: string;
  regimeColor: string;
  adx: number;
  hurst: number;
  alphaScore: number; // 0-100 opportunity score
  trendBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  orderbookImbalance: number; // e.g. 1.25 (Bid heavy) or 0.8 (Ask heavy)
  isEligibleForEntry: boolean;
  activeStrategyName: string;
}

export interface StatisticalEdgeMetrics {
  sampleCount: number;
  targetSampleSize: number;
  winRate: number;
  profitFactor: number;
  totalPnl: number;
  totalPnlPercent: number;
  maxDrawdownPct: number;
  avgWinDollars: number;
  avgLossDollars: number;
  payoffRatio: number;
  sharpeRatio: number;
  edgeConfidencePct: number; // Statistical significance / Confidence level (0-100%)
  isStatisticallySignificant: boolean;
  verdict: 'INSUFFICIENT_DATA' | 'CONFIRMED_PROFITABLE_EDGE' | 'NEGATIVE_EXPECTANCY' | 'MARGINAL_EDGE';
}

export type RootCauseDiagnosis =
  | 'NETWORK_SLIPPAGE'
  | 'CALCULATION_JITTER'
  | 'FLAWED_LOGIC'
  | 'NATURAL_VOLATILITY'
  | 'PROFIT_TARGET_HIT';

export interface LatencyMilestones {
  signalTime: number; // T0 (epoch ms)
  orderConstructedTime: number; // T1 (epoch ms)
  networkVerifiedTime: number; // T2 (epoch ms)
  executionConfirmedTime: number; // T3 (epoch ms)
  // Derived Deltas
  computeJitterMs: number; // T1 - T0 (Pre-trade calculation time)
  networkRoundtripMs: number; // T2 - T1 (Binance API network transit)
  fillConfirmationMs: number; // T3 - T2 (State & execution registry)
  totalLatencyMs: number; // T3 - T0 (Total end-to-end delta)
}

export interface TradeLatencyAudit {
  tradeId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  timestamp: string;
  signalPrice: number;
  executionPrice: number;
  exitPrice: number;
  slippageDollars: number;
  slippageBps: number;
  milestones: LatencyMilestones;
  holdingDurationSeconds: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE';
  pnl: number;
  pnlPercent: number;
  regime: string;
  strategyName: string;
  dynamicSlDistance: number;
  dynamicSlPct: number;
  rootCause: RootCauseDiagnosis;
  rootCauseExplanation: string;
  confidenceScore: number; // 0-100% confidence in diagnosis
}

export interface LatencyTelemetrySummary {
  avgTotalLatencyMs: number;
  avgComputeJitterMs: number;
  avgNetworkRoundtripMs: number;
  avgFillConfirmationMs: number;
  avgSlippageBps: number;
  rapidStopLossCount: number; // trades closed in <15s
  rapidStopLossRate: number; // % of total closed trades
  totalAuditedTrades: number;
  rootCauseDistribution: {
    networkSlippageCount: number;
    calculationJitterCount: number;
    flawedLogicCount: number;
    naturalVolatilityCount: number;
    profitTargetCount: number;
  };
  primaryBottleneck: 'NETWORK_SLIPPAGE' | 'CALCULATION_JITTER' | 'FLAWED_LOGIC' | 'NORMAL_VOLATILITY' | 'OPTIMAL';
  healthScore: number; // 0-100
}

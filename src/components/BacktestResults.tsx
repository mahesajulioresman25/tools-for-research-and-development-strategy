import React, { useState } from 'react';
import { BacktestResult, Trade } from '../types/trading';
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Award,
  BarChart3,
  Dices,
  ListOrdered,
  DollarSign,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface BacktestResultsProps {
  result: BacktestResult;
  onSelectTrade?: (trade: Trade) => void;
}

export const BacktestResults: React.FC<BacktestResultsProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'monte_carlo'>('overview');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  const { metrics, equityCurve, trades, monteCarlo } = result;

  const isNetProfitPositive = metrics.netProfit >= 0;

  // Filter trades
  const filteredTrades = trades.filter((t) => {
    if (tradeFilter === 'WIN') return (t.pnl || 0) > 0;
    if (tradeFilter === 'LOSS') return (t.pnl || 0) <= 0;
    return true;
  });

  // Calculate Equity Chart Dimensions
  const maxEquity = Math.max(...equityCurve.map((e) => e.equity), metrics.initialCapital * 1.05);
  const minEquity = Math.min(...equityCurve.map((e) => e.equity), metrics.initialCapital * 0.95);
  const maxDD = Math.max(...equityCurve.map((e) => e.drawdown), 5);

  const getEquityY = (eq: number, height: number = 200) => {
    if (maxEquity === minEquity) return height / 2;
    return height - ((eq - minEquity) / (maxEquity - minEquity)) * (height - 30) - 15;
  };

  const getDDY = (dd: number, height: number = 200) => {
    return (dd / maxDD) * (height - 30) + 15;
  };

  return (
    <div
      id="backtest-results-panel"
      className="bg-[#0D1117] border border-[#2D333B] rounded-lg p-4 shadow-sm flex flex-col gap-4 font-sans"
    >
      {/* Top Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D333B] pb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded border ${
              isNetProfitPositive
                ? 'bg-[#10B98115] text-[#10B981] border-[#10B98150]'
                : 'bg-[#EF444415] text-[#EF4444] border-[#EF444450]'
            }`}
          >
            {isNetProfitPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                QUANTITATIVE PERFORMANCE ANALYTICS
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#161B22] text-[#9CA3AF] border border-[#2D333B] font-mono">
                {result.strategyName}
              </span>
            </div>
            <p className="text-[10px] text-[#6B7280] font-mono">
              Simulated with slippage model ({result.metrics.totalSlippagePaid ? `$${result.metrics.totalSlippagePaid}` : '$0.00'}) & maker/taker fee structures
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-[#161B22] border border-[#2D333B] rounded p-0.5 text-xs font-mono">
          <button
            id="tab-overview-btn"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all ${
              activeTab === 'overview'
                ? 'bg-[#2563EB] text-white shadow-sm font-bold'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Equity Trajectory</span>
          </button>

          <button
            id="tab-monte-carlo-btn"
            onClick={() => setActiveTab('monte_carlo')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all ${
              activeTab === 'monte_carlo'
                ? 'bg-[#2563EB] text-white shadow-sm font-bold'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Monte Carlo (500 Runs)</span>
          </button>

          <button
            id="tab-trades-btn"
            onClick={() => setActiveTab('trades')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all ${
              activeTab === 'trades'
                ? 'bg-[#2563EB] text-white shadow-sm font-bold'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Order Logs ({trades.length})</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Net Profit */}
        <div className="bg-[#161B22] p-3 rounded border border-[#2D333B] text-center">
          <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1 font-mono">Net Return</div>
          <div
            className={`text-base font-bold font-mono ${
              metrics.netProfit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            {metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
            {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn}% Total
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-[#161B22] p-3 rounded border border-[#2D333B] text-center">
          <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1 font-mono">Win Rate</div>
          <div className="text-base font-bold font-mono text-[#3B82F6]">{metrics.winRate}%</div>
          <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
            {metrics.winTrades}W / {metrics.lossTrades}L ({metrics.totalTrades} T)
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-[#161B22] p-3 rounded border border-[#2D333B] text-center">
          <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1 font-mono">Profit Factor</div>
          <div
            className={`text-base font-bold font-mono ${
              metrics.profitFactor >= 1.5 ? 'text-[#10B981]' : metrics.profitFactor >= 1.0 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
            }`}
          >
            {metrics.profitFactor}
          </div>
          <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
            Payoff: {metrics.payoffRatio}R
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-[#161B22] p-3 rounded border border-[#2D333B] text-center">
          <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1 font-mono">Max Drawdown</div>
          <div className="text-base font-bold font-mono text-[#EF4444]">
            -{metrics.maxDrawdown}%
          </div>
          <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
            -${metrics.maxDrawdownAmount.toLocaleString()}
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-[#161B22] p-3 rounded border border-[#2D333B] text-center">
          <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1 font-mono">Sharpe Ratio</div>
          <div className="text-base font-bold font-mono text-[#8B5CF6]">
            {metrics.sharpeRatio}
          </div>
          <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
            Sortino: {metrics.sortinoRatio}
          </div>
        </div>

        {/* Expectancy */}
        <div className="bg-[#161B22] p-3 rounded border border-[#2D333B] text-center">
          <div className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1 font-mono">Expectancy / Trade</div>
          <div
            className={`text-base font-bold font-mono ${
              metrics.expectancy >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            {metrics.expectancy >= 0 ? '+' : ''}${metrics.expectancy}
          </div>
          <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
            Fee Avg: ${(metrics.totalFeesPaid / (metrics.totalTrades || 1)).toFixed(2)}
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW (Equity Trajectory & Drawdown Waterfall) */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="bg-[#0A0B0E] p-3.5 rounded border border-[#2D333B]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-white font-mono uppercase tracking-wide">
                PORTFOLIO EQUITY & DRAWDOWN TRAJECTORY
              </span>
              <div className="flex items-center space-x-3 text-[10px] font-mono">
                <span className="flex items-center space-x-1 text-[#10B981]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  <span>Portfolio Balance</span>
                </span>
                <span className="flex items-center space-x-1 text-[#EF4444]">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                  <span>Drawdown Waterfall</span>
                </span>
              </div>
            </div>

            {/* SVG Equity Chart */}
            <div className="relative w-full h-[200px]">
              <svg viewBox="0 0 1000 200" className="w-full h-full block" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="45" x2="1000" y2="45" stroke="#21262D" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="1000" y2="100" stroke="#21262D" strokeDasharray="3 3" />
                <line x1="0" y1="155" x2="1000" y2="155" stroke="#21262D" strokeDasharray="3 3" />

                {/* Baseline Initial Capital Line */}
                <line
                  x1="0"
                  y1={getEquityY(metrics.initialCapital, 200)}
                  x2="1000"
                  y2={getEquityY(metrics.initialCapital, 200)}
                  stroke="#484F58"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />

                {/* Equity Area Fill */}
                <path
                  d={`M 0 200 ${equityCurve
                    .map((pt, i) => {
                      const x = (i / (equityCurve.length - 1 || 1)) * 1000;
                      const y = getEquityY(pt.equity, 200);
                      return `L ${x} ${y}`;
                    })
                    .join(' ')} L 1000 200 Z`}
                  fill="url(#equityFill)"
                />

                {/* Equity Line */}
                <path
                  d={equityCurve
                    .map((pt, i) => {
                      const x = (i / (equityCurve.length - 1 || 1)) * 1000;
                      const y = getEquityY(pt.equity, 200);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.8"
                />

                {/* Drawdown Line (Plotted in Crimson) */}
                <path
                  d={equityCurve
                    .map((pt, i) => {
                      const x = (i / (equityCurve.length - 1 || 1)) * 1000;
                      const y = 200 - (pt.drawdown / maxDD) * 55;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                />
              </svg>
            </div>

            <div className="flex justify-between items-center text-[10px] text-[#6B7280] mt-2 font-mono border-t border-[#2D333B] pt-2">
              <span>INITIAL BALANCE: ${metrics.initialCapital.toLocaleString()}</span>
              <span>
                FINAL BALANCE: ${metrics.finalCapital.toLocaleString()} (
                {metrics.totalReturn >= 0 ? '+' : ''}
                {metrics.totalReturn}%)
              </span>
            </div>
          </div>

          {/* Secondary Stats Table */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs bg-[#161B22] p-3 rounded border border-[#2D333B] font-mono">
            <div>
              <span className="text-[#6B7280] block text-[10px] uppercase">Avg Profit (Win):</span>
              <span className="text-[#10B981] font-bold">+${metrics.avgWin}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[10px] uppercase">Avg Loss:</span>
              <span className="text-[#EF4444] font-bold">-${metrics.avgLoss}</span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[10px] uppercase">Consecutive W/L:</span>
              <span className="text-white font-bold">
                {metrics.maxConsecutiveWins}W / {metrics.maxConsecutiveLosses}L
              </span>
            </div>
            <div>
              <span className="text-[#6B7280] block text-[10px] uppercase">Total Exchange Fees:</span>
              <span className="text-[#F59E0B] font-bold">${metrics.totalFeesPaid}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTE CARLO SIMULATION */}
      {activeTab === 'monte_carlo' && (
        <div className="space-y-3">
          <div className="bg-[#0A0B0E] p-3.5 rounded border border-[#2D333B]">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h4 className="text-[11px] font-bold text-white flex items-center space-x-1.5 font-mono uppercase tracking-wide">
                  <Dices className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>MONTE CARLO PROBABILISTIC RESAMPLING (500 ITERATIONS)</span>
                </h4>
                <p className="text-[10px] text-[#6B7280] font-mono">
                  Random trade sequence shuffling to stress-test ruin probability and black-swan drawdowns
                </p>
              </div>
            </div>

            {/* Monte Carlo Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs font-mono">
              <div className="bg-[#161B22] p-2.5 rounded border border-[#2D333B] text-center">
                <span className="text-[#6B7280] text-[10px] uppercase block">Median Expected Return:</span>
                <span className="text-[#10B981] font-bold text-sm">+{monteCarlo.medianReturn}%</span>
              </div>
              <div className="bg-[#161B22] p-2.5 rounded border border-[#2D333B] text-center">
                <span className="text-[#6B7280] text-[10px] uppercase block">Worst 5th Percentile:</span>
                <span className="text-[#F59E0B] font-bold text-sm">{monteCarlo.p5Return}%</span>
              </div>
              <div className="bg-[#161B22] p-2.5 rounded border border-[#2D333B] text-center">
                <span className="text-[#6B7280] text-[10px] uppercase block">Worst Case Drawdown:</span>
                <span className="text-[#EF4444] font-bold text-sm">-{monteCarlo.worstCaseDrawdown}%</span>
              </div>
              <div className="bg-[#161B22] p-2.5 rounded border border-[#2D333B] text-center">
                <span className="text-[#6B7280] text-[10px] uppercase block">Risk of Ruin:</span>
                <span className="text-[#3B82F6] font-bold text-sm">{monteCarlo.riskOfRuinPercent}%</span>
              </div>
            </div>

            {/* Multi-Run Path SVG */}
            <div className="relative w-full h-[160px] bg-[#161B22] rounded p-2 border border-[#2D333B]">
              <svg viewBox="0 0 1000 160" className="w-full h-full block" preserveAspectRatio="none">
                {monteCarlo.equityRuns.map((run, runIdx) => {
                  const colors = ['#10b981', '#38bdf8', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#6366f1'];
                  const color = colors[runIdx % colors.length];

                  return (
                    <path
                      key={`run-${runIdx}`}
                      d={run
                        .map((val, i) => {
                          const x = (i / (run.length - 1 || 1)) * 1000;
                          const y = 160 - ((val - minEquity) / (maxEquity - minEquity || 1)) * 130 - 15;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.2"
                      strokeOpacity="0.75"
                    />
                  );
                })}
              </svg>
            </div>
            <p className="text-[10px] text-[#6B7280] font-mono mt-2">
              *Displays 8 synthetic trajectory walks across 500 boot-strapped iterations.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: TRADES LOG TABLE */}
      {activeTab === 'trades' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider">Filter:</span>
              {(['ALL', 'WIN', 'LOSS'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTradeFilter(f)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    tradeFilter === f
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#161B22] text-[#9CA3AF] hover:text-white border border-[#2D333B]'
                  }`}
                >
                  {f === 'ALL' ? 'ALL' : f === 'WIN' ? 'PROFIT ONLY' : 'LOSS ONLY'}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-[#6B7280] font-mono">{filteredTrades.length} RECORDED TRADES</span>
          </div>

          <div className="overflow-x-auto rounded border border-[#2D333B]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#14171C] text-[#6B7280] border-b border-[#2D333B]">
                <tr>
                  <th className="p-2.5 text-[10px] uppercase">ID / Time</th>
                  <th className="p-2.5 text-[10px] uppercase">Side</th>
                  <th className="p-2.5 text-[10px] uppercase">Entry</th>
                  <th className="p-2.5 text-[10px] uppercase">Exit</th>
                  <th className="p-2.5 text-[10px] uppercase">PnL ($)</th>
                  <th className="p-2.5 text-[10px] uppercase">Return %</th>
                  <th className="p-2.5 text-[10px] uppercase">Exit Trigger</th>
                  <th className="p-2.5 text-[10px] uppercase">Fee + Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D333B] bg-[#161B22]">
                {filteredTrades.map((t) => {
                  const isWin = (t.pnl || 0) > 0;
                  return (
                    <tr key={t.id} className="hover:bg-[#0D1117] transition-colors">
                      <td className="p-2.5 text-[#D1D5DB]">
                        <div className="text-white font-bold">{t.id}</div>
                        <div className="text-[9px] text-[#6B7280]">
                          {new Date(t.entryTime * 1000).toLocaleDateString('id-ID', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="p-2.5 font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            t.side === 'LONG'
                              ? 'bg-[#10B98115] text-[#10B981] border border-[#10B98140]'
                              : 'bg-[#EF444415] text-[#EF4444] border border-[#EF444440]'
                          }`}
                        >
                          {t.side}
                        </span>
                      </td>
                      <td className="p-2.5 text-white">${t.entryPrice.toFixed(2)}</td>
                      <td className="p-2.5 text-white">
                        {t.exitPrice ? `$${t.exitPrice.toFixed(2)}` : '-'}
                      </td>
                      <td
                        className={`p-2.5 font-bold ${
                          isWin ? 'text-[#10B981]' : 'text-[#EF4444]'
                        }`}
                      >
                        {isWin ? '+' : ''}${t.pnl?.toFixed(2)}
                      </td>
                      <td
                        className={`p-2.5 font-bold ${
                          isWin ? 'text-[#10B981]' : 'text-[#EF4444]'
                        }`}
                      >
                        {isWin ? '+' : ''}{t.pnlPercent?.toFixed(2)}%
                      </td>
                      <td className="p-2.5">
                        <span className="text-[10px] text-[#D1D5DB] bg-[#0D1117] border border-[#2D333B] px-1.5 py-0.5 rounded">
                          {t.exitReason === 'TAKE_PROFIT'
                            ? '🎯 TP'
                            : t.exitReason === 'TRAILING_STOP'
                            ? '🚀 Trail'
                            : t.exitReason === 'STOP_LOSS'
                            ? '🛑 SL'
                            : t.exitReason}
                        </span>
                      </td>
                      <td className="p-2.5 text-[#6B7280] text-[10px]">
                        ${(t.feesPaid + t.slippageIncurred).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

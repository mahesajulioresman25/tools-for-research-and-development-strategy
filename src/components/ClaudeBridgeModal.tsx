import React, { useState } from 'react';
import {
  Bot,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Cpu,
  Shield,
  Zap,
  Globe,
  RefreshCw,
  Play,
  X,
  Code2,
} from 'lucide-react';

interface ClaudeBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemUrl?: string;
}

export const ClaudeBridgeModal: React.FC<ClaudeBridgeModalProps> = ({
  isOpen,
  onClose,
  systemUrl,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DESKTOP_MCP' | 'CLAUDE_WEB' | 'REST_OPENAPI' | 'LIVE_TEST'>('DESKTOP_MCP');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : (systemUrl || 'https://ais-dev-gvh6t645h5tqg2vbp5ngd7-668283931978.asia-southeast1.run.app');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const claudeDesktopConfig = `{
  "mcpServers": {
    "quantum-trade": {
      "command": "node",
      "args": ["${typeof window !== 'undefined' ? window.location.origin : ''}/mcp-bridge.cjs"],
      "env": {
        "SYSTEM_URL": "${currentOrigin}"
      }
    }
  }
}`;

  const claudeWebPrompt = `Halo Claude! Saya menghubungkan Anda dengan sistem Quant Trading & Market Execution saya yang sedang berjalan di:
${currentOrigin}

Sistem ini memiliki antarmuka REST API dan OpenAPI 3.0 spec di:
${currentOrigin}/api/openapi.json

Silakan periksa kondisi sistem saat ini melalui endpoint ringkas:
GET ${currentOrigin}/api/claude/overview

Seluruh 15 MCP Tools kini dapat Anda panggil kapan saja:
1. get_system_overview (Status bot, balance, posisi, audit)
2. scan_crypto_markets (Scanner 8 aset kripto, alpha score, regime)
3. get_market_orderbook (Kedalaman bids & asks depth, spread bps)
4. get_market_ticker (Harga real-time 24h & Crypto Fear/Greed Index)
5. get_market_klines (OHLCV candlestick bars berbagai timeframe)
6. run_backtest_simulation (Simulasi backtest dengan metrik lengkap)
7. discover_market_alpha (Analisa celah inefisiensi pasar & mikrostruktur)
8. generate_bot_script (Ekspor script bot Python CCXT, TS, PineScript, MQL5)
9. list_available_strategies (Daftar strategi quant bawaan & parameternya)
10. switch_strategy (Mengganti strategi bot yang aktif)
11. tune_risk_engine (Menyetel parameter ATR SL, RRR, slippage)
12. toggle_bot_state (Menjalankan atau menjeda bot)
13. execute_paper_trade (Mengeksekusi order simulasi LONG/SHORT)
14. close_positions (Menutup posisi spesifik atau semua posisi)
15. get_latency_diagnostics (Audit latensi T0-T3 & diagnosa SL)`;

  const handleRunMcpTest = async (toolName: string) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: {},
          },
        }),
      });
      const data = await res.json();
      setTestResult(JSON.stringify(data?.result?.content?.[0]?.text || data, null, 2));
    } catch (err: any) {
      setTestResult(`Error calling tool: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#10141C] border border-[#2D333B] rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D333B] bg-[#161B22]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D97706] to-[#B45309] flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white tracking-wide">CLAUDE AI ACCESS BRIDGE</h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#10B98120] text-[#10B981] border border-[#10B98140]">
                  ZERO CODE EXPORT • ZERO API COST
                </span>
              </div>
              <p className="text-xs text-[#8B949E] font-sans">
                Akses penuh Claude ke sistem live tanpa perlu ekspor codebase atau membayar API token Anthropic.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B949E] hover:text-white hover:bg-[#21262D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2D333B] bg-[#0D1117] px-6 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('DESKTOP_MCP')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'DESKTOP_MCP'
                ? 'border-[#D97706] text-[#F59E0B]'
                : 'border-transparent text-[#8B949E] hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>1. Claude Desktop (MCP Protocol)</span>
          </button>

          <button
            onClick={() => setActiveTab('CLAUDE_WEB')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'CLAUDE_WEB'
                ? 'border-[#D97706] text-[#F59E0B]'
                : 'border-transparent text-[#8B949E] hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>2. Claude Web (claude.ai)</span>
          </button>

          <button
            onClick={() => setActiveTab('REST_OPENAPI')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'REST_OPENAPI'
                ? 'border-[#D97706] text-[#F59E0B]'
                : 'border-transparent text-[#8B949E] hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>3. OpenAPI Endpoints</span>
          </button>

          <button
            onClick={() => setActiveTab('LIVE_TEST')}
            className={`pb-2.5 px-3 font-semibold transition-all border-b-2 flex items-center space-x-2 cursor-pointer ${
              activeTab === 'LIVE_TEST'
                ? 'border-[#D97706] text-[#F59E0B]'
                : 'border-transparent text-[#8B949E] hover:text-white'
            }`}
          >
            <Play className="w-4 h-4 text-[#10B981]" />
            <span>4. Uji Coba Alat Claude</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* TAB 1: CLAUDE DESKTOP MCP */}
          {activeTab === 'DESKTOP_MCP' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#161B22] border border-[#2D333B] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-[#F59E0B]" />
                    <span>Model Context Protocol (MCP) — Standar Resmi Anthropic</span>
                  </h3>
                  <span className="text-[10px] text-[#8B949E]">File: claude_desktop_config.json</span>
                </div>
                <p className="text-xs text-[#8B949E] font-sans leading-relaxed">
                  Dengan MCP, aplikasi <strong>Claude Desktop</strong> di komputer Anda langsung mendeteksi semua alat
                  sistem ini sebagai *native tools* (membaca orderbook, memindai pasar, mengubah parameter SL/TP,
                  dan memantau latensi) tanpa Anda perlu mengunggah kode sumber ataupun membeli kuota API Anthropic.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[#8B949E]">
                  <span>Salin konfigurasi ini ke file config Claude Desktop Anda:</span>
                  <button
                    onClick={() => copyToClipboard(claudeDesktopConfig, 'desktop_config')}
                    className="flex items-center space-x-1 px-2 py-1 rounded bg-[#21262D] hover:bg-[#30363D] text-white transition-colors cursor-pointer"
                  >
                    {copiedKey === 'desktop_config' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                        <span className="text-[#10B981]">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Konfigurasi</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-[#0A0D12] border border-[#2D333B] text-[#58A6FF] overflow-x-auto text-[11px] leading-tight">
                  {claudeDesktopConfig}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded bg-[#161B22] border border-[#2D333B] space-y-1.5">
                  <div className="text-[11px] font-bold text-white flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Lokasi File di macOS:</span>
                  </div>
                  <code className="text-[10px] text-[#A5D6FF] block bg-[#0D1117] p-1.5 rounded break-all">
                    ~/Library/Application Support/Claude/claude_desktop_config.json
                  </code>
                </div>

                <div className="p-3 rounded bg-[#161B22] border border-[#2D333B] space-y-1.5">
                  <div className="text-[11px] font-bold text-white flex items-center space-x-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Lokasi File di Windows:</span>
                  </div>
                  <code className="text-[10px] text-[#A5D6FF] block bg-[#0D1117] p-1.5 rounded break-all">
                    %APPDATA%\Claude\claude_desktop_config.json
                  </code>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#161B22] border border-[#2D333B] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">15 Alat Lengkap (MCP Tools) yang Disediakan untuk Claude:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#10B98120] text-[#10B981] font-bold">100% TERHUBUNG</span>
                </div>

                {/* Category 1: Market & Data */}
                <div>
                  <div className="text-[10px] text-[#58A6FF] font-semibold mb-1 uppercase tracking-wider">A. Market Feed & Telemetri Real-Time</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">get_system_overview</span>
                      <span className="text-[10px] text-[#8B949E]">(Status, balance, open pos)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">scan_crypto_markets</span>
                      <span className="text-[10px] text-[#8B949E]">(Scan 8 pairs, alpha, regime)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">get_market_orderbook</span>
                      <span className="text-[10px] text-[#8B949E]">(Bids/asks depth & spread)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">get_market_ticker</span>
                      <span className="text-[10px] text-[#8B949E]">(24h stats & Fear/Greed)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">get_market_klines</span>
                      <span className="text-[10px] text-[#8B949E]">(Candlestick OHLCV multi-TF)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">get_latency_diagnostics</span>
                      <span className="text-[10px] text-[#8B949E]">(T0-T3 waterfall & audit)</span>
                    </div>
                  </div>
                </div>

                {/* Category 2: Research & Code */}
                <div>
                  <div className="text-[10px] text-[#F59E0B] font-semibold mb-1 uppercase tracking-wider">B. Riset Alpha, Backtest & Code Generator</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">run_backtest_simulation</span>
                      <span className="text-[10px] text-[#8B949E]">(Simulasi metrik lengkap)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">discover_market_alpha</span>
                      <span className="text-[10px] text-[#8B949E]">(Inefisiensi pasar & mikrostruktur)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">generate_bot_script</span>
                      <span className="text-[10px] text-[#8B949E]">(Python, TS, PineScript, MQL5)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">list_available_strategies</span>
                      <span className="text-[10px] text-[#8B949E]">(Daftar strategi preset quant)</span>
                    </div>
                  </div>
                </div>

                {/* Category 3: Execution & Control */}
                <div>
                  <div className="text-[10px] text-[#EC4899] font-semibold mb-1 uppercase tracking-wider">C. Eksekusi Order & Kontrol Risiko</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">tune_risk_engine</span>
                      <span className="text-[10px] text-[#8B949E]">(Setel ATR SL, RRR, slippage)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">switch_strategy</span>
                      <span className="text-[10px] text-[#8B949E]">(Ganti strategi bot aktif)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">toggle_bot_state</span>
                      <span className="text-[10px] text-[#8B949E]">(Jalankan / Jeda bot)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">execute_paper_trade</span>
                      <span className="text-[10px] text-[#8B949E]">(Eksekusi simulasi order)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#7EE787]">
                      <span>✓</span>
                      <span className="text-white font-mono">close_positions</span>
                      <span className="text-[10px] text-[#8B949E]">(Tutup posisi spesifik/semua)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLAUDE WEB */}
          {activeTab === 'CLAUDE_WEB' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#161B22] border border-[#2D333B] space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-[#3B82F6]" />
                  <span>Gunakan Langsung di Browser (claude.ai) Tanpa Instalasi</span>
                </h3>
                <p className="text-xs text-[#8B949E] font-sans leading-relaxed">
                  Jika Anda menggunakan website <strong>claude.ai</strong>, Anda tidak perlu mengunggah file kode apa pun.
                  Cukup salin teks instruksi ringkas di bawah ini ke chat Claude. Claude akan langsung membaca API
                  dan mengontrol sistem trading Anda secara real-time.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[#8B949E]">
                  <span>Salin prompt ini dan kirimkan ke chat Claude Anda:</span>
                  <button
                    onClick={() => copyToClipboard(claudeWebPrompt, 'web_prompt')}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer"
                  >
                    {copiedKey === 'web_prompt' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Prompt untuk Claude Web</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={claudeWebPrompt}
                  className="w-full p-3 rounded-lg bg-[#0A0D12] border border-[#2D333B] text-[#E6EDF3] text-xs font-mono leading-relaxed resize-none focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#161B22] border border-[#2D333B] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Live Endpoint Ringkasan Sistem</div>
                  <div className="text-[11px] text-[#8B949E]">{currentOrigin}/api/claude/overview</div>
                </div>
                <a
                  href={`${currentOrigin}/api/claude/overview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] text-[#58A6FF] transition-colors"
                >
                  <span>Buka JSON</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: REST & OPENAPI */}
          {activeTab === 'REST_OPENAPI' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#161B22] border border-[#2D333B] space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-[#10B981]" />
                  <span>Spesifikasi OpenAPI 3.0 Lengkap</span>
                </h3>
                <p className="text-xs text-[#8B949E] font-sans leading-relaxed">
                  Endpoint ini dapat diberikan langsung kepada Claude Projects, custom GPTs, atau curl script
                  untuk interaksi terprogram.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded bg-[#0A0D12] border border-[#2D333B] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B98120] text-[#10B981] mr-2">GET</span>
                    <span className="text-xs font-bold text-white">/api/claude/overview</span>
                    <p className="text-[11px] text-[#8B949E] mt-0.5">Snapshot saldo, posisi terbuka, dan status bot (di bawah 2KB)</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${currentOrigin}/api/claude/overview`, 'url_overview')}
                    className="p-1.5 rounded hover:bg-[#21262D] text-[#8B949E] hover:text-white"
                  >
                    {copiedKey === 'url_overview' ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-3 rounded bg-[#0A0D12] border border-[#2D333B] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3B82F620] text-[#3B82F6] mr-2">POST</span>
                    <span className="text-xs font-bold text-white">/api/claude/command</span>
                    <p className="text-[11px] text-[#8B949E] mt-0.5">Kirim aksi remote: TUNE_RISK, TOGGLE_BOT, EXECUTE_TRADE, CLOSE_ALL_POSITIONS</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(`${currentOrigin}/api/claude/command`, 'url_command')}
                    className="p-1.5 rounded hover:bg-[#21262D] text-[#8B949E] hover:text-white"
                  >
                    {copiedKey === 'url_command' ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="p-3 rounded bg-[#0A0D12] border border-[#2D333B] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B20] text-[#F59E0B] mr-2">GET</span>
                    <span className="text-xs font-bold text-white">/api/openapi.json</span>
                    <p className="text-[11px] text-[#8B949E] mt-0.5">Schema OpenAPI 3.0 standar industri</p>
                  </div>
                  <a
                    href={`${currentOrigin}/api/openapi.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-[#21262D] text-[#58A6FF]"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE TEST */}
          {activeTab === 'LIVE_TEST' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#161B22] border border-[#2D333B] space-y-2">
                <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                  <Play className="w-4 h-4 text-[#10B981]" />
                  <span>Uji Coba Respon yang Dilihat oleh Claude (Live MCP Dispatcher)</span>
                </h3>
                <p className="text-xs text-[#8B949E] font-sans">
                  Klik salah satu tombol alat di bawah ini untuk melihat data persis yang dikembalikan sistem kepada Claude secara real-time.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleRunMcpTest('get_system_overview')}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#2D333B] text-white text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Cpu className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Test get_system_overview</span>
                </button>

                <button
                  onClick={() => handleRunMcpTest('scan_crypto_markets')}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#2D333B] text-white text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Test scan_crypto_markets</span>
                </button>

                <button
                  onClick={() => handleRunMcpTest('run_backtest_simulation')}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#2D333B] text-white text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Code2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Test run_backtest_simulation</span>
                </button>

                <button
                  onClick={() => handleRunMcpTest('list_available_strategies')}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#2D333B] text-white text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Bot className="w-3.5 h-3.5 text-[#EC4899]" />
                  <span>Test list_available_strategies</span>
                </button>

                <button
                  onClick={() => handleRunMcpTest('discover_market_alpha')}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#2D333B] text-white text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Test discover_market_alpha</span>
                </button>

                <button
                  onClick={() => handleRunMcpTest('get_latency_diagnostics')}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] border border-[#2D333B] text-white text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Test get_latency_diagnostics</span>
                </button>
              </div>

              {isTesting && (
                <div className="p-6 text-center text-[#8B949E] flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#3B82F6]" />
                  <span>Mengeksekusi MCP Tool Dispatcher...</span>
                </div>
              )}

              {testResult && !isTesting && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#8B949E]">
                    <span>Output Hasil yang Diterima Claude:</span>
                    <button
                      onClick={() => copyToClipboard(testResult, 'test_output')}
                      className="text-[#58A6FF] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Salin Output</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-lg bg-[#0A0D12] border border-[#2D333B] text-[#7EE787] text-[11px] overflow-x-auto max-h-60 leading-tight">
                    {testResult}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2D333B] bg-[#161B22] flex items-center justify-between">
          <div className="text-[11px] text-[#8B949E] flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block animate-pulse"></span>
            <span>MCP Server Status: <strong>LIVE & READY</strong> di /api/mcp</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#21262D] hover:bg-[#30363D] text-white text-xs transition-colors cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};

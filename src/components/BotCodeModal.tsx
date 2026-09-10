import React, { useState } from 'react';
import { StrategyConfig, BotCodeResult } from '../types/trading';
import { requestAIBotCode } from '../services/api';
import { generateInstantBotCode } from '../utils/botTemplates';
import {
  X,
  Copy,
  Check,
  Download,
  Code2,
  Cpu,
  Terminal,
  FileCode,
  Sparkles,
  AlertCircle,
  RotateCw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BotCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: StrategyConfig;
  symbol: string;
}

export const BotCodeModal: React.FC<BotCodeModalProps> = ({
  isOpen,
  onClose,
  strategy,
  symbol,
}) => {
  const [selectedLang, setSelectedLang] = useState<'python_ccxt' | 'pinescript_v5' | 'nodejs_typescript' | 'mql5'>('python_ccxt');
  const [botResult, setBotResult] = useState<BotCodeResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instantly generate production script upon modal open or language switch
  React.useEffect(() => {
    if (isOpen) {
      const instantCode = generateInstantBotCode(strategy, selectedLang, symbol);
      setBotResult(instantCode);
    }
  }, [isOpen, selectedLang, strategy, symbol]);

  if (!isOpen) return null;

  const handleLanguageChange = (lang: typeof selectedLang) => {
    setSelectedLang(lang);
    setError(null);
    const instantCode = generateInstantBotCode(strategy, lang, symbol);
    setBotResult(instantCode);
  };

  // Optional AI Deep Optimization
  const handleAiRefine = async () => {
    setIsAiLoading(true);
    setError(null);

    try {
      const res = await requestAIBotCode({
        strategyName: strategy.name,
        language: selectedLang,
        params: strategy.params,
        symbol,
      });

      if (res.success && res.result) {
        setBotResult(res.result);
        try {
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
        } catch (_) {}
      } else {
        setError(res.error || 'Gagal menyempurnakan kode dengan AI');
      }
    } catch (err: any) {
      console.warn('AI refinement fallback to instant compiler:', err?.message || err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopy = () => {
    if (!botResult?.code) return;
    navigator.clipboard.writeText(botResult.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!botResult?.code) return;
    const extMap: Record<string, string> = {
      python_ccxt: 'py',
      pinescript_v5: 'pine',
      nodejs_typescript: 'ts',
      mql5: 'mq5',
    };
    const ext = extMap[selectedLang] || 'txt';
    const filename = `${strategy.id}_bot.${ext}`;
    const blob = new Blob([botResult.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in font-sans">
      <div
        id="bot-code-modal"
        className="bg-[#0D1117] border border-[#2D333B] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#2D333B] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-[#161B22] text-[#3B82F6] border border-[#2D333B]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                EXPORT AUTOMATION BOT SCRIPT
              </h3>
              <p className="text-[10px] text-[#6B7280] font-mono">
                Generate production-ready algorithmic trading execution code with active risk management
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#9CA3AF] hover:text-white hover:bg-[#161B22] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Tabs & Generate Trigger */}
        <div className="p-3 bg-[#0A0B0E] border-b border-[#2D333B] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-1 bg-[#161B22] p-1 rounded border border-[#2D333B] text-xs font-mono">
            <button
              onClick={() => handleLanguageChange('python_ccxt')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                selectedLang === 'python_ccxt'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Python (CCXT)</span>
            </button>

            <button
              onClick={() => handleLanguageChange('pinescript_v5')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                selectedLang === 'pinescript_v5'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <FileCode className="w-3 h-3" />
              <span>Pine Script v5</span>
            </button>

            <button
              onClick={() => handleLanguageChange('nodejs_typescript')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                selectedLang === 'nodejs_typescript'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>TypeScript</span>
            </button>

            <button
              onClick={() => handleLanguageChange('mql5')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                selectedLang === 'mql5'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <span>MQL5 (MT5)</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 font-mono">
            <button
              id="ai-refine-btn"
              onClick={handleAiRefine}
              disabled={isAiLoading}
              title="Enhance script with deep Gemini AI optimization"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#161B22] hover:bg-[#21262D] text-[#3B82F6] border border-[#2D333B] text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isAiLoading ? (
                <RotateCw className="w-3 h-3 animate-spin text-[#3B82F6]" />
              ) : (
                <Sparkles className="w-3 h-3 text-[#3B82F6]" />
              )}
              <span>{isAiLoading ? 'OPTIMIZING...' : 'AI ENHANCE'}</span>
            </button>

            {botResult && (
              <>
                <button
                  id="copy-code-btn"
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#161B22] hover:bg-[#21262D] text-white border border-[#2D333B] text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>

                <button
                  id="download-code-btn"
                  onClick={handleDownload}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#2563EB] hover:bg-[#3B82F6] text-white text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>DOWNLOAD</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 font-mono">
          {error && (
            <div className="p-3 rounded bg-[#EF444415] border border-[#EF444450] text-[#EF4444] text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
              <span>{error}</span>
            </div>
          )}

          {botResult && (
            <div className="space-y-3">
              {/* Key Features & Install Steps */}
              {botResult.keyFeatures && botResult.keyFeatures.length > 0 && (
                <div className="bg-[#0A0B0E] p-3 rounded border border-[#2D333B] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white block text-[10px] uppercase tracking-wide">
                      EXECUTION PROTOCOLS & SAFETY CHECKS:
                    </span>
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#10B98115] text-[#10B981] border border-[#10B98140] text-[9px] font-bold">
                      <Zap className="w-2.5 h-2.5" />
                      <span>INSTANT READY</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] text-[#9CA3AF]">
                    {botResult.keyFeatures.map((f, i) => (
                      <div key={i} className="flex items-center space-x-1.5">
                        <span className="text-[#3B82F6]">⚡</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Viewer */}
              <div className="relative rounded border border-[#2D333B] bg-[#0A0B0E] overflow-hidden">
                <div className="px-3 py-1.5 bg-[#161B22] border-b border-[#2D333B] flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
                  <span className="text-[#D1D5DB] font-bold">{botResult.filename || `${selectedLang}_bot`}</span>
                  <span>UTF-8 • PRODUCTION GRADE</span>
                </div>
                <pre className="p-3 text-[11px] font-mono text-[#10B981] overflow-x-auto leading-relaxed max-h-[340px] bg-[#0A0B0E]">
                  <code>{botResult.code}</code>
                </pre>
              </div>

              {/* Installation Guide */}
              {botResult.installationGuide && botResult.installationGuide.length > 0 && (
                <div className="bg-[#0A0B0E] p-3 rounded border border-[#2D333B] text-xs space-y-1.5">
                  <span className="font-bold text-white block text-[10px] uppercase">
                    DEPLOYMENT INSTRUCTIONS (VPS / SERVER):
                  </span>
                  <ol className="list-decimal list-inside space-y-0.5 text-[#6B7280] text-[10px]">
                    {botResult.installationGuide.map((step, idx) => (
                      <li key={idx} className="text-[#9CA3AF]">{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

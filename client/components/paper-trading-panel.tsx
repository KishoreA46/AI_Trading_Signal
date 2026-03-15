
import { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import TradesList from './trades-list';
import { tradingAPI, performanceAPI, marketAPI } from '@/lib/api';

export default function PaperTradingPanel({ initialSymbol }: { initialSymbol?: string | null }) {
  const [showNewTrade, setShowNewTrade] = useState(false);
  const [trades, setTrades] = useState<any[]>([]);
  const [marketCoins, setMarketCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProfit: 0,
    winRate: 0,
    totalTrades: 0,
    openPositions: 0,
    cashBalance: 0
  });
  const [availableAllocation, setAvailableAllocation] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    symbol: 'BTC/USDT',
    side: 'LONG' as 'LONG' | 'SHORT',
    entryPrice: '',
    quantity: '',
    leverage: 10,
    stopLoss: '',
    takeProfit: '',
    takeProfit2: '',
    takeProfit3: '',
    trailingStop: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tradesData, statsData, marketData] = await Promise.all([
        tradingAPI.getTrades(),
        performanceAPI.getSummary(),
        marketAPI.getTopCoins()
      ]);
      setTrades(tradesData as any[]);
      setStats(statsData as any);
      setMarketCoins(marketData);
    } catch (error) {
      console.error('Failed to fetch trading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSymbol) {
      setFormData(prev => ({ ...prev, symbol: initialSymbol }));
      setShowNewTrade(true);
    }
  }, [initialSymbol]);

  useEffect(() => {
    if (marketCoins.length > 0 && formData.symbol && !formData.entryPrice) {
      const coin = marketCoins.find(c => c.symbol === formData.symbol);
      if (coin) {
        setFormData(prev => ({ ...prev, entryPrice: coin.price.toString() }));
      }
    }
  }, [marketCoins, formData.symbol]);

  const updateAvailableAllocation = async (symbol: string) => {
    try {
      const [summary, settings] = await Promise.all([
        performanceAPI.getSummary(),
        performanceAPI.getSettings()
      ]);

      const masterCash = summary.cashBalance || 0;
      const symbolsAllocations = settings.allocations || {};

      // If symbol has a specific bucket, that's what we show as available for it
      // Otherwise we show the master cash balance
      if (symbolsAllocations[symbol]) {
        setAvailableAllocation(symbolsAllocations[symbol]);
      } else {
        setAvailableAllocation(masterCash);
      }
    } catch (e) {
      console.error('Failed to update margin info:', e);
    }
  };

  useEffect(() => {
    updateAvailableAllocation(formData.symbol);
  }, [formData.symbol, trades]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTrade = async () => {
    if (!formData.entryPrice || !formData.quantity) return;
    setError(null);

    try {
      await tradingAPI.createTrade({
        symbol: formData.symbol,
        side: formData.side,
        entryPrice: parseFloat(formData.entryPrice),
        quantity: parseFloat(formData.quantity),
        leverage: formData.leverage,
        stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
        takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
        takeProfit2: formData.takeProfit2 ? parseFloat(formData.takeProfit2) : null,
        takeProfit3: formData.takeProfit3 ? parseFloat(formData.takeProfit3) : null,
        trailingStop: formData.trailingStop,
        market_type: 'FUTURES'
      });

      setShowNewTrade(false);
      setFormData({
        symbol: 'BTC/USDT',
        side: 'LONG',
        entryPrice: '',
        quantity: '',
        leverage: 10,
        stopLoss: '',
        takeProfit: '',
        takeProfit2: '',
        takeProfit3: '',
        trailingStop: false,
      });
      fetchData();
    } catch (err: any) {
      console.error('Failed to create trade:', err);
      setError(err.message || 'Failed to create trade');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-foreground">Paper Trading</h2>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowNewTrade(!showNewTrade)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              New Trade
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-secondary/10 border border-border/50 rounded-xl px-4 py-4 backdrop-blur-md">
            <div className="text-[10px] text-muted-foreground font-bold mb-1">Total P&L</div>
            <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-secondary/10 border border-border/50 rounded-xl px-4 py-4 backdrop-blur-md">
            <div className="text-[10px] text-muted-foreground font-bold mb-1">Open Positions</div>
            <div className="text-2xl font-bold text-foreground">{stats.openPositions}</div>
          </div>
          <div className="bg-secondary/10 border border-border/50 rounded-xl px-4 py-4 backdrop-blur-md">
            <div className="text-[10px] text-muted-foreground font-bold mb-1">Closed Trades</div>
            <div className="text-2xl font-bold text-foreground">{stats.totalTrades}</div>
          </div>
          <div className="bg-secondary/10 border border-border/50 rounded-xl px-4 py-4 backdrop-blur-md">
            <div className="text-[10px] text-muted-foreground font-bold mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-primary">
              {stats.winRate}%
            </div>
          </div>
        </div>
      </div>

      {/* New Trade Form */}
      {showNewTrade && (
        <div className="border-b border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground">New Trade</h3>
            <button onClick={() => setShowNewTrade(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Side Selection (Top) */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFormData({ ...formData, side: 'LONG' })}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${formData.side === 'LONG'
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/50'
                }`}
            >
              <TrendingUp className="w-5 h-5" />
              LONG
            </button>
            <button
              onClick={() => setFormData({ ...formData, side: 'SHORT' })}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${formData.side === 'SHORT'
                ? 'bg-red-500 border-red-500 text-white'
                : 'bg-secondary/30 border-border text-muted-foreground hover:bg-secondary/50'
                }`}
            >
              <TrendingDown className="w-5 h-5" />
              SHORT
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-2 font-bold">Symbol</label>
              <select
                value={formData.symbol}
                onChange={(e) => {
                  const sym = e.target.value;
                  const coin = marketCoins.find(c => c.symbol === sym);
                  setFormData({
                    ...formData,
                    symbol: sym,
                    entryPrice: coin ? coin.price.toString() : formData.entryPrice
                  });
                }}
                className="w-full bg-secondary text-foreground px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none"
              >
                {marketCoins.map(c => (
                  <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Entry Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2 font-bold">Leverage</label>
              <div className="flex bg-secondary rounded-lg p-1 gap-1">
                {[1, 5, 10, 20, 50].map(l => (
                  <button
                    key={l}
                    onClick={() => setFormData({ ...formData, leverage: l })}
                    className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${formData.leverage === l
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary/20 text-muted-foreground'
                      }`}
                  >
                    {l}x
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-muted-foreground block">Size (Contracts)</label>
                <div className="flex gap-1">
                  {[25, 50, 100].map(pct => (
                    <button
                      key={pct}
                      onClick={() => {
                        if (availableAllocation && formData.entryPrice) {
                          // Max position size = Available Margin * Leverage
                          const maxPos = availableAllocation * formData.leverage;
                          const amount = maxPos * (pct / 100);
                          const qty = amount / parseFloat(formData.entryPrice);
                          setFormData({ ...formData, quantity: qty.toFixed(6) });
                        }
                      }}
                      className="px-2 py-0.5 bg-secondary hover:bg-primary hover:text-white rounded text-[10px] font-bold transition-colors border border-border"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full bg-secondary/50 text-foreground px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Stop Loss</label>
              <input
                type="number"
                step="0.01"
                value={formData.stopLoss}
                onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2 font-bold">Take Profit 1 (50%)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Target 1"
                value={formData.takeProfit}
                onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
                className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2 font-bold">Take Profit 2 (25%)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Target 2"
                value={formData.takeProfit2}
                onChange={(e) => setFormData({ ...formData, takeProfit2: e.target.value })}
                className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2 font-bold">Take Profit 3 (Final)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Final Target"
                value={formData.takeProfit3}
                onChange={(e) => setFormData({ ...formData, takeProfit3: e.target.value })}
                className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-border"
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="trailingStop"
                checked={formData.trailingStop}
                onChange={(e) => setFormData({ ...formData, trailingStop: e.target.checked })}
                className="w-4 h-4 rounded border-border bg-secondary text-primary"
              />
              <label htmlFor="trailingStop" className="text-sm font-medium text-foreground cursor-pointer">
                Trailing Stop Loss (1.5%)
              </label>
            </div>
            {availableAllocation !== null && (
              <div className="col-span-2 text-[10px] text-muted-foreground flex justify-between items-center px-1">
                <span>Available Margin (USDT):</span>
                <span className="font-mono font-bold text-foreground">${availableAllocation.toLocaleString()}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleAddTrade}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90"
          >
            Create Trade
          </button>
        </div>
      )}

      {/* Trades List */}
      <div className="flex-1 overflow-auto p-6">
        <TradesList trades={trades} onTradeAction={fetchData} />
      </div>
    </div>
  );
}

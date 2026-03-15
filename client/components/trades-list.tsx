
import { TrendingUp, TrendingDown, X, Clock, Shield, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { tradingAPI } from '@/lib/api';
import { Search } from 'lucide-react';
import CoinIcon from './coin-icon';

interface Trade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  entryTime: string;
  exitPrice: number | null;
  exitTime: string | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  takeProfit2?: number | null;
  takeProfit3?: number | null;
  trailingStop?: boolean;
  status: 'OPEN' | 'CLOSED';
  pnl: number | null;
  unrealized_pnl?: number;
  current_price?: number;
  leverage?: number;
  margin_used?: number;
  position_size?: number;
  close_reason?: string;
  targets_hit?: string[];
  liquidity?: number;
}

interface TradesListProps {
  trades: Trade[];
  onTradeAction?: () => void;
  compact?: boolean;
}

export default function TradesList({ trades, onTradeAction, compact }: TradesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sideFilter, setSideFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');

  const handleCloseTrade = async (e: React.MouseEvent, trade: Trade, quantity?: number) => {
    e.stopPropagation();
    const isPartial = !!quantity && quantity < trade.quantity;
    if (!confirm(`Are you sure you want to ${isPartial ? `close ${quantity}` : 'close this position'}?`)) return;

    try {
      setClosing(trade.id);
      const exitPrice = trade.current_price || trade.entryPrice;
      await tradingAPI.closeTrade(trade.id, exitPrice, quantity);
      onTradeAction?.();
    } catch (error) {
      console.error('Failed to close trade:', error);
      alert('Failed to close trade. Please try again.');
    } finally {
      setClosing(null);
    }
  };



  const filteredTrades = trades.filter(t => {
    const matchesSearch = t.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSide = sideFilter === 'ALL' || t.side === sideFilter;
    return matchesSearch && matchesSide;
  });

  const openTrades = filteredTrades.filter((t) => t.status === 'OPEN');
  const closedTrades = filteredTrades.filter((t) => t.status === 'CLOSED');

  const renderTrades = (tradeList: Trade[], section: 'OPEN' | 'CLOSED') => {
    if (tradeList.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No {section.toLowerCase()} trades
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tradeList.map((trade) => (
          <div
            key={trade.id}
            onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
            className={`flex flex-col bg-secondary/20 border border-border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/50 relative group ${expandedId === trade.id ? 'ring-2 ring-primary/20 border-primary/50 bg-secondary/30' : ''
              }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`p-2 rounded-xl ${trade.side === 'LONG' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {trade.side === 'LONG' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <CoinIcon
                    symbol={trade.symbol}
                    size={16}
                    className="absolute -bottom-1 -right-1 border-2 border-background shadow-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground tracking-tight">
                      {trade.symbol.split('/')[0]}
                    </h4>
                    {trade.leverage && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-lg font-semibold">
                        {trade.leverage}x
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold tracking-wider flex items-center gap-1">
                    {trade.side} • {trade.quantity.toFixed(4)} Qty
                    {trade.trailingStop && (
                      <span className="flex items-center gap-0.5 text-primary ml-1">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" /> [TS]
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {trade.status === 'OPEN' && (
                <button
                  onClick={(e) => handleCloseTrade(e, trade)}
                  disabled={closing === trade.id}
                  className="p-2 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/10"
                >
                  {closing === trade.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold mb-1">Entry Price</p>
                <p className="font-mono font-bold text-sm text-foreground">${trade.entryPrice.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground font-bold mb-1">
                  {trade.status === 'OPEN' ? 'Current Price' : 'Exit Price'}
                </p>
                <p className={`font-mono font-bold text-sm ${trade.status === 'CLOSED' ? 'text-primary' : 'text-foreground'}`}>
                  ${(trade.status === 'OPEN' ? trade.current_price : trade.exitPrice)?.toLocaleString() || '---'}
                </p>
              </div>
            </div>

            {trade.status === 'CLOSED' && trade.close_reason && (
              <div className="mb-4 text-[10px] bg-secondary/50 p-2 rounded-lg border border-border/50 text-muted-foreground font-bold tracking-tight">
                Reason: <span className="text-foreground">{trade.close_reason}</span>
              </div>
            )}

            <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold mb-0.5">Profit/Loss</p>
                {trade.status === 'OPEN' ? (
                  <div className={`text-lg font-semibold tracking-tight ${trade.unrealized_pnl && trade.unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.unrealized_pnl !== undefined ? (
                      `${trade.unrealized_pnl >= 0 ? '+' : ''}${trade.unrealized_pnl.toFixed(2)}`
                    ) : '---'}
                  </div>
                ) : (
                  <div className={`text-lg font-semibold tracking-tight ${trade.pnl && trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trade.pnl !== null ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '---'}
                  </div>
                )}
                <p className="text-[9px] text-muted-foreground font-bold mt-1">Margin: ${trade.margin_used?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground font-bold mb-0.5">Liquidity (24h)</p>
                <div className="flex flex-col items-end">
                  <p className="font-bold text-sm text-foreground">
                    {trade.liquidity ? `$${(trade.liquidity / 1000000).toFixed(1)}M` : '---'}
                  </p>
                  {trade.liquidity && (
                    <div className="w-12 bg-secondary/50 h-1 rounded-full mt-0.5">
                      <div
                        className="bg-primary h-1 rounded-full"
                        style={{ width: `${Math.min(100, (trade.liquidity / 500000000) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedId === trade.id && (
              <div className="mt-4 pt-4 border-t border-dashed border-border flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="w-3 h-3" /> Stop Loss
                  </div>
                  <span className="font-bold text-red-500/80">${trade.stopLoss?.toFixed(2) || 'None'}</span>
                </div>

                {/* Targets Grid */}
                <div className="grid grid-cols-3 gap-2 py-2">
                  {[
                    { id: 'TP1', val: trade.takeProfit, label: 'TP1' },
                    { id: 'TP2', val: trade.takeProfit2, label: 'TP2' },
                    { id: 'TP3', val: trade.takeProfit3, label: 'TP3' }
                  ].map(target => (
                    target.val && (
                      <div key={target.id} className={`p-1.5 rounded-lg border flex flex-col items-center gap-0.5 ${trade.targets_hit?.includes(target.id) ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-secondary/50 border-border opacity-50'}`}>
                        <span className="text-[8px] font-semibold">{target.label}</span>
                        <span className="text-[10px] font-mono font-bold">${target.val.toLocaleString()}</span>
                      </div>
                    )
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3 h-3" /> {trade.status === 'OPEN' ? 'Opened' : 'Duration'}
                  </div>
                  <span className="text-muted-foreground font-medium text-[10px]">
                    {new Date(trade.entryTime).toLocaleDateString()} {new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {trade.status === 'OPEN' && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCloseTrade(e, trade, trade.quantity * 0.5); }}
                      className="flex-1 py-1.5 bg-secondary hover:bg-secondary/80 text-[10px] font-semibold rounded-lg transition-colors border border-border"
                    >
                      CLOSE 50%
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCloseTrade(e, trade); }}
                      className="flex-1 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white text-[10px] font-semibold text-red-500 rounded-lg transition-colors border border-red-500/20"
                    >
                      CLOSE ALL
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={compact ? "" : "space-y-6"}>
      {/* Filters */}
      {!compact && (
        <div className="flex flex-col sm:flex-row gap-4 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="flex bg-secondary/30 p-1 rounded-xl border border-border">
            {(['ALL', 'LONG', 'SHORT'] as const).map(side => (
              <button
                key={side}
                onClick={() => setSideFilter(side)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sideFilter === side
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {side}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        {!compact && <h3 className="font-bold text-foreground mb-3 text-lg">Open Positions ({openTrades.length})</h3>}
        {renderTrades(openTrades, 'OPEN')}
      </div>

      {closedTrades.length > 0 && !compact && (
        <div>
          <h3 className="font-bold text-foreground mb-3 text-lg">Closed Trades ({closedTrades.length})</h3>
          {renderTrades(closedTrades, 'CLOSED')}
        </div>
      )}
    </div>
  );
}

import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { Signal } from '@/lib/api';
import CoinIcon from './coin-icon';

interface SignalCardProps {
  signal: Signal;
  onSelect?: (symbol: string) => void;
}

export default function SignalCard({ signal, onSelect }: SignalCardProps) {
  const isBuy = signal.type === 'BUY';
  const bgColor = isBuy ? 'bg-green-500/10' : 'bg-red-500/10';
  const borderColor = isBuy ? 'border-green-500/30' : 'border-red-500/30';
  const textColor = isBuy ? 'text-green-500' : 'text-red-500';

  const getTimeSince = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-5 hover:border-primary/50 transition-all group flex flex-col h-full premium-shadow`}>
      {/* Header: Coin Name, Logo, Signal */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`p-2.5 rounded-xl ${isBuy ? 'bg-green-500/20' : 'bg-red-500/20'} shadow-inner`}>
              {isBuy ? (
                <TrendingUp className={`w-5 h-5 ${textColor}`} />
              ) : (
                <TrendingDown className={`w-5 h-5 ${textColor}`} />
              )}
            </div>
            <CoinIcon
              symbol={signal.symbol}
              size={20}
              className="absolute -bottom-1.5 -right-1.5 border-2 border-background rounded-full shadow-sm"
            />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground tracking-tight">{signal.symbol}</h3>
            <p className="text-[10px] font-bold text-muted-foreground/60 tracking-widest">{getTimeSince(signal.timestamp)}</p>
          </div>
        </div>
        <div className={`text-xs font-black px-3 py-1 rounded-lg ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'} ${textColor} border ${borderColor} shadow-sm`}>
          {signal.type}
        </div>
      </div>

      {/* Trading Levels: Entry, Targets, SL */}
      <div className="space-y-3 mb-6">
        {/* Entry Price */}
        <div className="flex items-center justify-between py-2 border-b border-border/30">
          <span className="text-xs font-bold text-muted-foreground tracking-wider">Entry Price</span>
          <span className="text-sm font-black text-foreground">${signal.entry ? signal.entry.toLocaleString(undefined, { maximumFractionDigits: signal.entry < 1 ? 6 : 2 }) : '---'}</span>
        </div>

        {/* Targets */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-background/40 rounded-xl p-2.5 border border-border/50 text-center">
            <span className="block text-[9px] font-black text-muted-foreground mb-1">Target 1</span>
            <span className="text-xs font-bold text-green-500">${signal.take_profit ? signal.take_profit.toLocaleString(undefined, { maximumFractionDigits: signal.take_profit < 1 ? 6 : 2 }) : '---'}</span>
          </div>
          <div className="bg-background/40 rounded-xl p-2.5 border border-border/50 text-center">
            <span className="block text-[9px] font-black text-muted-foreground mb-1">Target 2</span>
            <span className="text-xs font-bold text-green-500">${signal.take_profit2 ? signal.take_profit2.toLocaleString(undefined, { maximumFractionDigits: signal.take_profit2 < 1 ? 6 : 2 }) : '---'}</span>
          </div>
          <div className="bg-background/40 rounded-xl p-2.5 border border-border/50 text-center">
            <span className="block text-[9px] font-black text-muted-foreground mb-1">Target 3</span>
            <span className="text-xs font-bold text-green-500">${signal.take_profit3 ? signal.take_profit3.toLocaleString(undefined, { maximumFractionDigits: signal.take_profit3 < 1 ? 6 : 2 }) : '---'}</span>
          </div>
        </div>

        {/* Stop Loss */}
        <div className="flex items-center justify-between py-2 bg-red-500/5 rounded-lg px-3 border border-red-500/10">
          <span className="text-xs font-bold text-red-500/70 tracking-wider">Stop Loss</span>
          <span className="text-sm font-black text-red-500">${signal.stop_loss ? signal.stop_loss.toLocaleString(undefined, { maximumFractionDigits: signal.stop_loss < 1 ? 6 : 2 }) : '---'}</span>
        </div>
      </div>

      {/* Accuracy & Confidence */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10 flex flex-col items-center">
          <span className="text-[9px] font-black text-blue-500/70 mb-1">Accuracy</span>
          <span className="text-lg font-black text-blue-500">{signal.accuracy}%</span>
        </div>
        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 flex flex-col items-center">
          <span className="text-[9px] font-black text-primary/70 mb-1">Confidence</span>
          <span className="text-lg font-black text-primary">{signal.confidence}%</span>
        </div>
      </div>

      <div className="flex justify-end mt-auto pt-2 border-t border-border/30">
        <button
          onClick={() => onSelect?.(signal.symbol)}
          className="p-3 bg-secondary/80 text-foreground rounded-xl hover:bg-secondary transition-all hover:scale-[1.05] active:scale-[0.95] border border-border/50 group/btn"
        >
          <Zap className="w-5 h-5 group-hover/btn:text-primary transition-colors" />
        </button>
      </div>
    </div>
  );
}

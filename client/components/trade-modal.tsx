import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { tradingAPI, performanceAPI } from '@/lib/api';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    symbol: string;
    currentPrice: number;
}

export default function TradeModal({ isOpen, onClose, symbol, currentPrice }: TradeModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableAllocation, setAvailableAllocation] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        side: 'LONG' as 'LONG' | 'SHORT',
        entryPrice: currentPrice.toString(),
        quantity: '',
        leverage: 10,
        stopLoss: '',
        takeProfit: '',
        takeProfit2: '',
        takeProfit3: '',
        trailingStop: false,
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, entryPrice: currentPrice.toString() }));
            updateAvailableAllocation();
        }
    }, [isOpen, currentPrice]);

    const updateAvailableAllocation = async () => {
        try {
            const [summary, settings] = await Promise.all([
                performanceAPI.getSummary(),
                performanceAPI.getSettings()
            ]);

            const masterCash = summary.cashBalance || 0;
            const symbolsAllocations = settings.allocations || {};

            if (symbolsAllocations[symbol]) {
                setAvailableAllocation(symbolsAllocations[symbol]);
            } else {
                setAvailableAllocation(masterCash);
            }
        } catch (e) {
            console.error('Failed to update margin info:', e);
        }
    };

    const handleAddTrade = async () => {
        if (!formData.entryPrice || !formData.quantity) return;
        setError(null);
        setLoading(true);

        try {
            await tradingAPI.createTrade({
                symbol: symbol,
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

            onClose();
        } catch (err: any) {
            console.error('Failed to create trade:', err);
            setError(err.message || 'Failed to create trade');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-xl border border-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                    <h3 className="font-bold text-xl text-foreground">Trade {symbol}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto w-full">
                    {/* Side Selection */}
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
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-2 font-bold animate-in slide-in-from-top-2">
                            Error: {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs text-muted-foreground block mb-2 font-bold">Entry Price</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.entryPrice}
                                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                                className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs text-muted-foreground block mb-2 font-bold">Leverage</label>
                            <div className="flex bg-secondary rounded-xl p-1 gap-1 h-[46px]">
                                {[1, 5, 10, 20, 50].map(l => (
                                    <button
                                        key={l}
                                        onClick={() => setFormData({ ...formData, leverage: l })}
                                        className={`flex-1 rounded-lg text-xs font-bold transition-all ${formData.leverage === l
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'hover:bg-primary/20 text-muted-foreground'
                                            }`}
                                    >
                                        {l}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs text-muted-foreground block font-bold">Size (Contracts)</label>
                                <div className="flex gap-1">
                                    {[25, 50, 100].map(pct => (
                                        <button
                                            key={pct}
                                            onClick={() => {
                                                if (availableAllocation && formData.entryPrice) {
                                                    const maxPos = availableAllocation * formData.leverage;
                                                    const amount = maxPos * (pct / 100);
                                                    const qty = amount / parseFloat(formData.entryPrice);
                                                    setFormData({ ...formData, quantity: qty.toFixed(6) });
                                                }
                                            }}
                                            className="px-3 py-1 bg-secondary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-colors border border-border"
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
                                className="w-full bg-secondary/50 text-foreground px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-lg font-mono"
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs text-muted-foreground block mb-2 font-bold">Stop Loss</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Optional"
                                value={formData.stopLoss}
                                onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                                className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs text-muted-foreground block mb-2 font-bold">Take Profit 1 (50%)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Target 1"
                                value={formData.takeProfit}
                                onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
                                className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs text-muted-foreground block mb-2 font-bold">Take Profit 2 (25%)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Target 2"
                                value={formData.takeProfit2}
                                onChange={(e) => setFormData({ ...formData, takeProfit2: e.target.value })}
                                className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="text-xs text-muted-foreground block mb-2 font-bold">Take Profit 3 (Final)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Final Target"
                                value={formData.takeProfit3}
                                onChange={(e) => setFormData({ ...formData, takeProfit3: e.target.value })}
                                className="w-full bg-secondary text-foreground px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="col-span-2 flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="trailingStop"
                                    checked={formData.trailingStop}
                                    onChange={(e) => setFormData({ ...formData, trailingStop: e.target.checked })}
                                    className="w-5 h-5 rounded border-border bg-secondary text-primary focus:ring-primary"
                                />
                                <label htmlFor="trailingStop" className="text-sm font-bold text-foreground cursor-pointer select-none">
                                    Trailing Stop Loss (1.5%)
                                </label>
                            </div>

                            {availableAllocation !== null && (
                                <div className="text-xs text-muted-foreground flex flex-col items-end">
                                    <span className=" font-bold mb-1">Available Margin</span>
                                    <span className="font-mono font-bold text-foreground text-sm">${availableAllocation.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border shrink-0 bg-secondary/10">
                    <button
                        onClick={handleAddTrade}
                        disabled={loading || !formData.quantity || !formData.entryPrice}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${loading || !formData.quantity || !formData.entryPrice
                            ? 'bg-primary/50 text-white/50 cursor-not-allowed'
                            : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 hover:shadow-primary/40 -translate-y-0.5'
                            }`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : null}
                        {loading ? 'Submitting...' : 'Confirm Trade'}
                    </button>
                </div>
            </div>
        </div>
    );
}

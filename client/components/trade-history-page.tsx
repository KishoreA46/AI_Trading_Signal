import { useState, useEffect } from 'react';
import TradesList from './trades-list';
import { tradingAPI } from '@/lib/api';

export default function TradeHistoryPage() {
    const [trades, setTrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const tradesData = await tradingAPI.getTrades('CLOSED');
            setTrades(tradesData as any[]);
        } catch (error) {
            console.error('Failed to fetch trade history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <div className="bg-card px-6 py-5 border-b border-border sticky top-0 z-10">
                <div className="w-full flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                        Trade History
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-24 bg-secondary/30 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : trades.length > 0 ? (
                        <TradesList trades={trades} onTradeAction={fetchData} />
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            <p className="text-lg font-bold">No Closed Trades Found</p>
                            <p className="text-sm">When you close a position, it will appear here.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

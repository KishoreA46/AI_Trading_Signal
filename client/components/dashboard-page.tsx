import { useState, useEffect } from 'react';
import { performanceAPI, marketAPI } from '@/lib/api';
import CoinIcon from './coin-icon';
import { Newspaper, Clock, ChevronRight } from 'lucide-react';

interface DashboardPageProps {
    onSelectCoin?: (symbol: string) => void;
}

export default function DashboardPage({ onSelectCoin }: DashboardPageProps) {
    const cachedCoins = marketAPI.getCachedTopCoins();

    const [cashBalance, setCashBalance] = useState<number>(0);
    const [topGainers, setTopGainers] = useState<any[]>(() => {
        if (!cachedCoins) return [];
        return [...cachedCoins].sort((a, b) => (b.change24h || 0) - (a.change24h || 0)).slice(0, 5);
    });
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(!cachedCoins);
    const [loadingNews, setLoadingNews] = useState(true);
    const [firstLoad, setFirstLoad] = useState(!cachedCoins);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!cachedCoins) setLoading(true);
                // Get portfolio balance and market data
                const [summary, marketCoins, newsData] = await Promise.all([
                    performanceAPI.getSummary(),
                    marketAPI.getTopCoins(),
                    marketAPI.getGeneralNews().catch(() => [])
                ]);

                if (summary) setCashBalance(summary.cashBalance || 0);

                // Sort market coins by change24h to find top gainers
                if (marketCoins && marketCoins.length > 0) {
                    const sorted = [...marketCoins].sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
                    setTopGainers(sorted.slice(0, 5));
                }

                setNews(newsData.slice(0, 6));

            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
                setLoadingNews(false);
                setFirstLoad(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="px-6 pt-6 pb-2 md:shrink-0 bg-transparent flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Dashboard</h2>

                {/* Small Portfolio Overview Box */}
                <div className="bg-card border border-border rounded-xl px-5 py-3 shadow-md min-w-[180px] premium-shadow">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Portfolio Amount</h3>
                    {loading && firstLoad ? (
                        <div className="h-7 w-32 bg-secondary/50 rounded animate-pulse" />
                    ) : (
                        <div className="text-xl font-black text-foreground">
                            ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-[11px] text-gray-400 dark:text-muted-foreground font-medium ml-1.5">USDT</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Gainers */}
                    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col premium-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-foreground tracking-tight">Top Gainers (24hrs)</h3>
                        </div>

                        <div className="flex-1 space-y-3">
                            {loading && firstLoad ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-16 bg-secondary/30 rounded-xl animate-pulse" />
                                ))
                            ) : topGainers.length === 0 ? (
                                <div className="text-muted-foreground text-center py-8">No market data available</div>
                            ) : (
                                topGainers.map((coin, index) => (
                                    <div
                                        key={coin.symbol}
                                        onClick={() => onSelectCoin?.(coin.symbol)}
                                        className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/50 hover:bg-secondary/40 hover:border-primary/30 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="font-bold text-muted-foreground w-4 text-center group-hover:text-primary transition-colors">{index + 1}</div>
                                            <CoinIcon symbol={coin.symbol} size={32} className="shadow-sm group-hover:scale-110 transition-transform" />
                                            <div>
                                                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{coin.symbol.split('/')[0]}</h4>
                                                <span className="text-xs text-muted-foreground">${coin.price.toLocaleString(undefined, { maximumFractionDigits: coin.price < 1 ? 4 : 2 })}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-lg inline-block">
                                                +{coin.change24h?.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* News Section */}
                    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col premium-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-foreground tracking-tight">
                                Market News
                            </h3>
                        </div>

                        <div className="flex-1 space-y-4">
                            {loadingNews && firstLoad ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="space-y-2 animate-pulse">
                                        <div className="h-4 bg-secondary/30 rounded w-3/4" />
                                        <div className="h-3 bg-secondary/20 rounded w-full" />
                                    </div>
                                ))
                            ) : news.length === 0 ? (
                                <div className="text-muted-foreground text-center py-8">No news available</div>
                            ) : (
                                news.map((item, idx) => (
                                    <div key={idx} className="group relative">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-black tracking-widest text-primary/70">{item.source}</span>
                                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                {item.timestamp.split(' ').slice(0, 3).join(' ')}
                                            </span>
                                        </div>
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block group-hover:text-primary transition-colors pr-6"
                                        >
                                            <h4 className="text-sm font-bold line-clamp-2 leading-snug">{item.title}</h4>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-primary">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </a>
                                        <div className="mt-1.5 flex flex-wrap gap-2">
                                            {item.category !== 'Market' && (
                                                <button
                                                    onClick={() => onSelectCoin?.(item.category.replace('/', '-'))}
                                                    className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded hover:bg-primary/20 transition-all border border-primary/10"
                                                >
                                                    {item.category}
                                                </button>
                                            )}
                                        </div>
                                        {idx < news.length - 1 && <div className="border-b border-border/40 mt-4" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

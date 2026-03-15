
import { useState, useEffect, useRef } from 'react';
import { marketAPI, watchlistAPI, tradingAPI } from '@/lib/api';
import type { MarketCoin } from '@/lib/api';
import { TrendingUp, TrendingDown, Search, Star, Filter, Check, ChevronDown } from 'lucide-react';
import CoinIcon from './coin-icon';

interface MarketPageProps {
    onSelectCoin?: (symbol: string) => void;
}

export default function MarketPage({ onSelectCoin }: MarketPageProps) {
    const cachedCoins = marketAPI.getCachedTopCoins();
    const [coins, setCoins] = useState<MarketCoin[]>(cachedCoins || []);
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [openTrades, setOpenTrades] = useState<any[]>([]);
    const [loading, setLoading] = useState(!cachedCoins);
    const [firstLoad, setFirstLoad] = useState(!cachedCoins);
    const [searchTerm, setSearchTerm] = useState('');

    const [sortBy, setSortBy] = useState<'RANK' | 'ALPHA' | 'VOL_DESC' | 'VOL_ASC' | 'GAIN' | 'LOSS'>('RANK');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'Futures Markets' | 'Trade'>('Futures Markets');

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchData = async () => {
        if (firstLoad) setLoading(true);
        try {
            // Fetch concurrently but update state as each finishes
            marketAPI.getTopCoins().then(data => {
                setCoins(data);
                setLoading(false);
                setFirstLoad(false);
            }).catch(e => console.error(e));

            watchlistAPI.getAll().then(data => setWatchlist(data)).catch(e => console.error(e));
            tradingAPI.getTrades('OPEN').then(data => setOpenTrades(data as any[])).catch(e => console.error(e));
        } catch (error) {
            console.error('Failed to initiate fetch:', error);
            setLoading(false);
            setFirstLoad(false);
        }
    };

    const toggleWatchlist = async (symbol: string) => {
        try {
            if (watchlist.includes(symbol)) {
                await watchlistAPI.remove(symbol);
                setWatchlist(prev => prev.filter(s => s !== symbol));
            } else {
                await watchlistAPI.add(symbol);
                setWatchlist(prev => [...prev, symbol]);
            }
        } catch (error) {
            console.error('Failed to toggle watchlist:', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Reverted back to 30 second API polling
        return () => clearInterval(interval);
    }, []);

    const sortedCoins = [...coins].sort((a, b) => {
        switch (sortBy) {
            case 'ALPHA': return a.symbol.localeCompare(b.symbol);
            case 'VOL_DESC': return b.quoteVolume - a.quoteVolume;
            case 'VOL_ASC': return a.quoteVolume - b.quoteVolume;
            case 'GAIN': return b.change24h - a.change24h;
            case 'LOSS': return a.change24h - b.change24h;
            default: return 0; // Maintain original ranking from backend
        }
    });

    const filteredCoins = sortedCoins.filter(coin =>
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const FilterOption = ({ id, label, icon: Icon }: { id: typeof sortBy, label: string, icon: any }) => {
        const isActive = sortBy === id || (id === 'VOL_DESC' && sortBy === 'VOL_ASC');
        return (
            <button
                onClick={() => {
                    setSortBy(id === sortBy && id.startsWith('VOL') ? (id === 'VOL_DESC' ? 'VOL_ASC' : 'VOL_DESC') : id);
                    setIsFilterOpen(false);
                }}
                className={`
                    w-full flex items-center justify-between px-4 py-2 text-sm transition-colors
                    ${isActive ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-secondary/50'}
                `}
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {label}
                </div>
                {isActive && <Check className="w-4 h-4 text-primary" />}
            </button>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            {/* Header */}
            <div className="border-b border-border bg-card px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Sliding Toggle */}
                        <div className="bg-transparent dark:bg-transparent rounded-xl w-fit flex items-center">
                            <div className="relative flex bg-[#f1f4f9] dark:bg-card border border-border/40 rounded-lg p-1 w-fit">
                                <div
                                    className="absolute h-[calc(100%-8px)] rounded-md bg-primary transition-all duration-300 ease-in-out shadow-sm"
                                    style={{
                                        width: '160px',
                                        left: activeTab === 'Futures Markets' ? '4px' : '164px'
                                    }}
                                />
                                <button
                                    onClick={() => setActiveTab('Futures Markets')}
                                    className={`relative z-10 w-[160px] px-4 py-2 text-sm font-bold transition-colors duration-300 flex items-center justify-center ${activeTab === 'Futures Markets' ? 'text-white' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900'
                                        }`}
                                >
                                    Futures Markets
                                </button>
                                <button
                                    onClick={() => setActiveTab('Trade')}
                                    className={`relative z-10 w-[160px] px-4 py-2 text-sm font-bold transition-colors duration-300 flex items-center justify-center ${activeTab === 'Trade' ? 'text-white' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900'
                                        }`}
                                >
                                    Trade
                                </button>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'Futures Markets' ? (
                        <>
                            <div className="flex flex-row gap-2 items-center w-full md:w-auto md:flex-1 justify-end max-w-2xl">
                                {/* Search */}
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#001f3f]" />
                                    <input
                                        type="text"
                                        placeholder="Search symbol…"
                                        className="w-full bg-card border-[1.5px] border-[#001f3f] rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#001f3f]/40 transition-all placeholder:text-muted-foreground/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* Dropdown Filter */}
                                <div className="relative" ref={filterRef}>
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={`
                                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border border-[#001f3f]
                                        bg-[#001f3f] text-white shadow-[0_2px_10px_rgba(0,31,63,0.3)] hover:bg-[#001f3f]/90 
                                    `}
                                    >
                                        <Filter className="w-4 h-4" />
                                        <span className="hidden sm:inline">Filters</span>
                                        {sortBy !== 'RANK' && (
                                            <span className="flex items-center justify-center w-5 h-5 ml-1 text-[10px] bg-white text-[#001f3f] rounded-full">
                                                1
                                            </span>
                                        )}
                                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isFilterOpen && (
                                        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-2 border-b border-border/50 bg-secondary/20">
                                                <span className="text-xs font-semibold text-muted-foreground tracking-wider ml-2">Sort By</span>
                                            </div>
                                            <div className="flex flex-col py-1">
                                                <FilterOption id="ALPHA" label="A-Z" icon={Search} />
                                                <FilterOption id="VOL_DESC" label="Volume" icon={TrendingUp} />
                                                <FilterOption id="GAIN" label="Top Gainers" icon={TrendingUp} />
                                                <FilterOption id="LOSS" label="Top Losers" icon={TrendingDown} />
                                            </div>
                                            {sortBy !== 'RANK' && (
                                                <div className="p-2 border-t border-border/50 bg-secondary/20">
                                                    <button
                                                        onClick={() => {
                                                            setSortBy('RANK');
                                                            setIsFilterOpen(false);
                                                        }}
                                                        className="w-full py-1.5 text-xs font-bold text-muted-foreground hover:text-[#001f3f] transition-colors hover:bg-[#001f3f]/10 rounded-md"
                                                    >
                                                        Clear Filters
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 p-6 flex flex-col min-h-0">
                {activeTab === 'Futures Markets' ? (
                    <>
                        {loading && coins.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 border-4 border-[#001f3f] border-t-transparent rounded-full animate-spin"></div>
                                    <div className="text-muted-foreground">Fetching market data...</div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-xl flex-1 flex flex-col min-h-0 overflow-hidden relative premium-shadow">
                                <div className="overflow-auto flex-1">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#001f3f] sticky top-0 z-10 text-xs text-white shadow-sm">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">Asset</th>
                                                <th className="px-6 py-4 font-semibold text-right">Price</th>
                                                <th className="px-6 py-4 font-semibold text-right">24h Change</th>
                                                <th className="px-6 py-4 font-semibold text-right hidden md:table-cell">24h High</th>
                                                <th className="px-6 py-4 font-semibold text-right hidden md:table-cell">24h Low</th>
                                                <th className="px-6 py-4 font-semibold text-right text-green-400">Open PnL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredCoins.map((coin) => (
                                                <tr key={coin.symbol} className="hover:bg-secondary/10 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleWatchlist(coin.symbol);
                                                                }}
                                                                className={`p-1 rounded-full hover:bg-secondary transition-colors ${watchlist.includes(coin.symbol) ? 'text-yellow-500' : 'text-muted-foreground'
                                                                    }`}
                                                            >
                                                                <Star className={`w-4 h-4 ${watchlist.includes(coin.symbol) ? 'fill-current' : ''}`} />
                                                            </button>
                                                            <CoinIcon symbol={coin.symbol} size={36} />
                                                            <div>
                                                                <button
                                                                    onClick={() => onSelectCoin?.(coin.symbol)}
                                                                    className="font-bold text-foreground hover:text-primary transition-colors"
                                                                >
                                                                    {coin.symbol}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium">
                                                        ${coin.price > 1 ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.price.toFixed(6)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className={`flex items-center justify-end gap-1 font-bold ${coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {coin.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                            {coin.change24h > 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-muted-foreground hidden md:table-cell">
                                                        ${coin.high24h.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-muted-foreground hidden md:table-cell">
                                                        ${coin.low24h.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {(() => {
                                                            const trade = openTrades.find(t => t.symbol === coin.symbol);
                                                            if (!trade) return <span className="text-muted-foreground/30 text-xs">-</span>;
                                                            const pnl = trade.unrealized_pnl || 0;
                                                            return (
                                                                <div className={`font-black text-sm ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredCoins.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                                        No coins found matching "{searchTerm}"
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl premium-shadow">
                        <div className="flex flex-col items-center gap-4 text-center max-w-md">
                            <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center text-muted-foreground/40">
                                <TrendingUp className="w-8 h-8 opacity-20" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-2">No Active Trades</h3>
                                <p className="text-muted-foreground text-sm">
                                    You don't have any open positions currently. Go to Futures Markets to start trading.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

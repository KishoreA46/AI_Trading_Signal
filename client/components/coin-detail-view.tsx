import { useState, useEffect } from 'react';
import { ArrowLeft, Zap, Info, TrendingUp, TrendingDown, Bell, Plus, X, Trash2, Newspaper, Clock, ExternalLink, Search } from 'lucide-react';
import { marketAPI, tradingAPI, signalsAPI, alertsAPI, type MarketCoin, type Signal, type MarketStats } from '@/lib/api';
import CoinIcon from './coin-icon';
import PriceChart from './price-chart';
import { useMarketData } from '@/hooks/useMarketData';
import TradeModal from './trade-modal';
import TradesList from './trades-list';
import SignalCard from './signal-card';
import { Switch } from '@/components/ui/switch';

interface CoinDetailViewProps {
    symbol: string;
    onClose: () => void;
}

export default function CoinDetailView({ symbol, onClose }: CoinDetailViewProps) {
    const formattedSymbol = symbol.replace('-', '/');
    const [coin, setCoin] = useState<MarketCoin | null>(null);
    const [stats, setStats] = useState<MarketStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [activeTrades, setActiveTrades] = useState<any[]>([]);

    // Signal State
    const [isScanning, setIsScanning] = useState(false);
    const [signal, setSignal] = useState<Signal | null>(null);
    const [loadingSignal, setLoadingSignal] = useState(true);

    // Alerts State
    const [alerts, setAlerts] = useState<any[]>([]);
    const [showAlertPanel, setShowAlertPanel] = useState(false);
    const [showNewAlertForm, setShowNewAlertForm] = useState(false);
    const [alertFormData, setAlertFormData] = useState({
        targetPrice: 0,
        condition: 'ABOVE',
    });

    // Chart State
    const [timeframe, setTimeframe] = useState('1h');
    const [indicators, setIndicators] = useState({
        ema20: false,
        ema50: false,
        ema200: false,
    });

    // News State
    const [coinNews, setCoinNews] = useState<any[]>([]);
    const [loadingNews, setLoadingNews] = useState(false);
    const { klines, latestTick, loading: loadingKlines } = useMarketData(formattedSymbol, timeframe);

    const fetchAlerts = async () => {
        try {
            const data = await alertsAPI.getAll();
            // Filter only for this symbol
            setAlerts((data as any[]).filter(a => a.symbol === formattedSymbol));
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        }
    };

    const fetchCoinNews = async () => {
        try {
            setLoadingNews(true);
            const data = await marketAPI.getNews(formattedSymbol);
            setCoinNews(data);
        } catch (error) {
            console.error('Failed to fetch coin news:', error);
        } finally {
            setLoadingNews(false);
        }
    };

    const fetchData = async () => {
        // 1. Fetch essential ticker data first to unblock UI
        marketAPI.getTicker(formattedSymbol)
            .then(data => {
                setCoin(data);
                setLoading(false); // Unblock UI as soon as price is known
            })
            .catch(error => {
                console.error('Failed to fetch ticker:', error);
                setLoading(false);
            });

        // 2. Fetch all other data in background without blocking
        tradingAPI.getTrades('OPEN').then(tradesData => {
            const formattedTrades = (tradesData as any[]) || [];
            setActiveTrades(formattedTrades.filter(t => t.symbol === formattedSymbol));
        }).catch(e => console.error(e));

        marketAPI.getStats(formattedSymbol).then(statsData => {
            setStats(statsData);
        }).catch(e => console.error(e));

        setLoadingSignal(false);

        fetchAlerts();
        fetchCoinNews();
    };

    const handleAddAlert = async () => {
        if (alertFormData.targetPrice <= 0) return;
        try {
            await alertsAPI.create({
                symbol: formattedSymbol,
                targetPrice: alertFormData.targetPrice,
                condition: alertFormData.condition
            });
            fetchAlerts();
            setShowNewAlertForm(false);
            setAlertFormData({ targetPrice: 0, condition: 'ABOVE' });
        } catch (error) {
            console.error('Failed to create alert:', error);
        }
    };

    const handleDeleteAlert = async (id: string) => {
        try {
            await alertsAPI.delete(id);
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (error) {
            console.error('Failed to delete alert:', error);
        }
    };

    const handleToggleAlert = async (id: string, currentStatus: string) => {
        const nextActive = currentStatus !== 'ACTIVE';
        try {
            await alertsAPI.toggle(id, nextActive);
            setAlerts(alerts.map(a =>
                a.id === id ? { ...a, status: nextActive ? 'ACTIVE' : 'INACTIVE' } : a
            ));
        } catch (error) {
            console.error('Failed to toggle alert:', error);
        }
    };

    const handleScanSignal = async () => {
        setIsScanning(true);
        try {
            const data = await signalsAPI.getBySymbol(formattedSymbol);
            setSignal(data as Signal);
        } catch (error) {
            console.error('Failed to fetch signal:', error);
        } finally {
            setIsScanning(false);
        }
    };
    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchData();
        }, 30000);
        return () => clearInterval(interval);
    }, [symbol]); // Only re-fetch metadata on symbol change

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!coin) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
                <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold mb-4">Coin Not Found</h2>
                    <p className="text-muted-foreground mb-6">The coin {formattedSymbol} could not be located.</p>
                    <button onClick={onClose} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg">Close</button>
                </div>
            </div>
        );
    }


    return (
        <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div className="flex items-center gap-3">
                        <CoinIcon symbol={coin.symbol} size={40} />
                        <div>
                            <h1 className="text-xl font-bold text-foreground">{coin.symbol}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">${coin.price.toLocaleString()}</span>
                                <span className={`text-xs font-bold ${coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                {coin && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAlertPanel(true)}
                            className="p-3 bg-secondary/50 hover:bg-secondary rounded-xl text-muted-foreground hover:text-primary transition-all relative border border-border"
                            title="Price Alerts"
                        >
                            <Bell className="w-5 h-5" />
                            {alerts.filter(a => a.status === 'ACTIVE').length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-card" />
                            )}
                        </button>
                        <button
                            onClick={() => setShowTradeModal(true)}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold border border-primary/20 transition-all hover:bg-primary/90"
                        >
                            Trade
                        </button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content Area (Chart) */}
                    <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-4 flex flex-col h-[600px] premium-shadow">
                        {/* Chart Controls */}
                        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                            <div className="flex bg-secondary/30 p-1 rounded-xl border border-border/50">
                                {['1m', '15m', '30m', '1h', '4h', '1d'].map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === tf
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                {(Object.keys(indicators) as Array<keyof typeof indicators>).map((ind) => (
                                    <button
                                        key={ind}
                                        onClick={() => setIndicators(prev => ({ ...prev, [ind]: !prev[ind] }))}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${indicators[ind]
                                            ? 'bg-primary/20 border-primary/50 text-foreground'
                                            : 'bg-secondary/30 border-border/50 text-muted-foreground hover:border-primary/30'
                                            }`}
                                    >
                                        {ind.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chart Component */}
                        <div className="flex-1 w-full relative min-h-0 bg-secondary/10 rounded-xl overflow-hidden">
                            {loadingKlines ? (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col gap-3">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm">Loading market data...</span>
                                </div>
                            ) : klines.length > 0 ? (
                                <PriceChart
                                    data={klines}
                                    latestTick={latestTick}
                                    theme="dark"
                                    indicators={indicators}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col gap-2">
                                    <span className="text-lg font-bold">No Chart Data</span>
                                    <span className="text-sm">Could not load historical data for this asset.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Market Stats & Signal Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {/* Market Stats - Left (2/3) */}
                    <div className="lg:col-span-2">
                        <div className="mb-4">
                            <h4 className="text-sm font-bold text-foreground">Market Statistics</h4>
                        </div>
                        {stats && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Market Cap */}
                                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center relative group hover:border-primary/30 transition-all premium-shadow">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                                        <span className="text-sm font-bold tracking-wider">Market Cap</span>
                                        <Info className="w-3.5 h-3.5 opacity-50" />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-black text-foreground">
                                            ${(stats.market_cap / 1000000000).toFixed(2)}B
                                        </span>
                                        <div className={`flex items-center gap-1 text-sm font-bold mt-1 ${stats.market_cap_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {stats.market_cap_change_24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                            {Math.abs(stats.market_cap_change_24h).toFixed(2)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Volume (24h) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-primary/30 transition-all premium-shadow">
                                        <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                                            <span className="text-[10px] font-bold tracking-wider">Volume (24h)</span>
                                            <Info className="w-3 h-3 opacity-50" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-black text-foreground">${(stats.volume_24h / 1000000000).toFixed(2)}B</span>
                                            <div className={`flex items-center gap-0.5 text-xs font-bold ${stats.volume_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {stats.volume_change_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                {Math.abs(stats.volume_change_24h).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-primary/30 transition-all premium-shadow">
                                        <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                                            <span className="text-[10px] font-bold tracking-wider">Vol/Mkt Cap (24h)</span>
                                            <Info className="w-3 h-3 opacity-50" />
                                        </div>
                                        <span className="text-lg font-black text-foreground">
                                            {((stats.volume_24h / stats.market_cap) * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>

                                {/* FDV */}
                                <div className="col-span-1 md:col-span-2 bg-card border border-border rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:border-primary/30 transition-all relative premium-shadow">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                        <span className="text-[10px] font-bold tracking-wider">FDV</span>
                                        <Info className="w-3 h-3 opacity-50" />
                                    </div>
                                    <span className="text-xl font-black text-foreground">${(stats.fdv / 1000000000).toFixed(2)}B</span>
                                </div>

                                {/* Supply Info */}
                                <div className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-primary/30 transition-all premium-shadow">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                                        <span className="text-[10px] font-bold tracking-wider">Total Supply</span>
                                        <Info className="w-3 h-3 opacity-50" />
                                    </div>
                                    <span className="text-lg font-black text-foreground">
                                        {(stats.total_supply / 1000000000).toFixed(2)}B {coin.symbol.split('/')[0]}
                                    </span>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                                        <span className="text-[10px] font-bold tracking-wider">Max Supply</span>
                                        <Info className="w-3 h-3 opacity-50" />
                                    </div>
                                    <span className="text-lg font-black text-foreground">
                                        {stats.max_supply ? `${(stats.max_supply / 1000000000).toFixed(0)}B` : '∞'} {coin.symbol.split('/')[0]}
                                    </span>
                                </div>

                                {/* Circulating Supply */}
                                <div className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-primary/30 transition-all premium-shadow">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                                        <span className="text-[10px] font-bold tracking-wider">Circulating Supply</span>
                                        <Info className="w-3 h-3 opacity-50" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black text-foreground">
                                            {(stats.circulating_supply / 1000000000).toFixed(2)}B {coin.symbol.split('/')[0]}
                                        </span>
                                        <div className="w-full bg-secondary/50 h-1 rounded-full mt-2">
                                            <div
                                                className="bg-primary h-1 rounded-full"
                                                style={{ width: `${(stats.circulating_supply / (stats.total_supply || stats.circulating_supply)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                                        <span className="text-[10px] font-bold tracking-wider">Holders</span>
                                        <Info className="w-3 h-3 opacity-50" />
                                    </div>
                                    <span className="text-lg font-black text-foreground">512.41K</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Signal Details - Right (1/3) */}
                    <div className="lg:col-span-1">
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-foreground">AI Signal Analysis</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleScanSignal}
                                    disabled={isScanning}
                                    className="p-1.5 bg-secondary/30 hover:bg-secondary/50 border border-border/50 rounded-lg transition-all"
                                    title="Manual Re-scan"
                                >
                                    <Zap className={`w-3.5 h-3.5 text-primary ${isScanning ? 'animate-pulse' : ''}`} />
                                </button>
                            </div>
                        </div>
                        {signal && !isScanning ? (
                            <div className="bg-card border border-border rounded-2xl p-1 overflow-hidden h-full min-h-[400px] premium-shadow">
                                <SignalCard signal={signal} />
                            </div>
                        ) : isScanning || loadingSignal ? (
                            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[400px] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                                <div className="animate-flip mb-6">
                                    <CoinIcon symbol={coin.symbol} size={80} className="shadow-2xl rounded-full" />
                                </div>
                                <div className="space-y-2 relative z-10">
                                    <p className="text-foreground text-base font-black tracking-widest animate-pulse">Analyzing {coin.symbol}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] opacity-70">AI Signal Engine Running...</p>
                                </div>

                                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center h-[400px]">
                                <Zap className="w-8 h-8 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground text-sm font-medium">No active signal found for {coin.symbol}</p>
                                <button
                                    onClick={handleScanSignal}
                                    className="mt-4 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary/20 transition-all"
                                >
                                    Scan for Signal
                                </button>
                            </div>
                        )}
                    </div>
                </div>


                {/* Active Trades */}
                {activeTrades.length > 0 && (
                    <div className="bg-card border border-border rounded-xl flex flex-col mt-6 overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h4 className="text-sm font-bold text-foreground">Active Positions</h4>
                        </div>
                        <div className="p-6">
                            <TradesList trades={activeTrades} compact onTradeAction={() => {
                                fetchData();
                            }} />
                        </div>
                    </div>
                )}

                {/* Market News Section */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden mt-6 mb-8 premium-shadow">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Newspaper className="w-5 h-5 text-primary" />
                            <h4 className="text-lg font-bold text-foreground">Latest {coin?.symbol} News</h4>
                        </div>
                    </div>
                    <div className="p-6">
                        {loadingNews ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : coinNews.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {coinNews.map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-4 bg-secondary/20 hover:bg-secondary/40 border border-border rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black tracking-widest text-primary/70">{item.source}</span>
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                                                <Clock className="w-3 h-3" />
                                                {item.timestamp.split(' ').slice(0, 4).join(' ')}
                                            </div>
                                        </div>
                                        <h5 className="font-bold text-sm text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">{item.title}</h5>
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">{item.description}</p>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-primary">
                                            Read More <ExternalLink className="w-2.5 h-2.5 ml-1" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground italic flex flex-col items-center gap-2">
                                <Search className="w-8 h-8 opacity-20" />
                                <p className="text-sm">No specific news found for {coin?.symbol} at the moment.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Alerts Management Modal */}
            {showAlertPanel && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Bell className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-foreground">Price Alerts</h3>
                                    <p className="text-xs text-muted-foreground">{formattedSymbol}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAlertPanel(false);
                                    setShowNewAlertForm(false);
                                }}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* New Alert Form */}
                            {showNewAlertForm ? (
                                <div className="bg-secondary/30 border border-border rounded-xl p-4 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold tracking-wider text-muted-foreground">New Price Alert</h4>
                                        <button onClick={() => setShowNewAlertForm(false)} className="text-muted-foreground hover:text-foreground">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">Condition</label>
                                            <select
                                                value={alertFormData.condition}
                                                onChange={(e) => setAlertFormData({ ...alertFormData, condition: e.target.value as any })}
                                                className="w-full bg-background text-foreground px-3 py-2 rounded-lg border border-border text-xs font-bold focus:border-primary outline-none"
                                            >
                                                <option value="ABOVE">Price Above</option>
                                                <option value="BELOW">Price Below</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">Target Price</label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={alertFormData.targetPrice || ''}
                                                onChange={(e) => setAlertFormData({ ...alertFormData, targetPrice: parseFloat(e.target.value) || 0 })}
                                                placeholder={coin?.price.toString()}
                                                className="w-full bg-background text-foreground px-3 py-2 rounded-lg border border-border text-xs font-bold focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddAlert}
                                        disabled={!alertFormData.targetPrice}
                                        className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Create Alert
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowNewAlertForm(true)}
                                    className="w-full py-4 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all group"
                                >
                                    <Plus className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold">Add New Alert</span>
                                    <span className="text-[10px] opacity-60">Notify me when price reaches target</span>
                                </button>
                            )}

                            {/* Active Alerts List */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold tracking-wider text-muted-foreground mb-1 flex items-center gap-2">
                                    Active Alerts
                                    <span className="px-1.5 py-0.5 bg-secondary rounded text-foreground">{alerts.length}</span>
                                </h4>
                                {alerts.length > 0 ? (
                                    alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className="bg-secondary/20 border border-border rounded-xl p-4 flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${alert.status === 'ACTIVE' ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                                                    <Bell className={`w-4 h-4 ${alert.status === 'ACTIVE' ? 'text-amber-500' : 'text-emerald-500'}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold">${alert.targetPrice.toLocaleString()}</span>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${alert.status === 'ACTIVE' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                            {alert.condition}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                                                        {alert.status === 'TRIGGERED' ? `Triggered ${new Date(alert.triggeredAt).toLocaleString()}` : 'Waiting for target...'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Switch
                                                    checked={alert.status === 'ACTIVE'}
                                                    disabled={alert.status === 'TRIGGERED'}
                                                    onCheckedChange={() => handleToggleAlert(alert.id, alert.status)}
                                                />
                                                <button
                                                    onClick={() => handleDeleteAlert(alert.id)}
                                                    className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                                        <p className="text-xs italic">No alerts set for this coin yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-secondary/10 border-t border-border flex items-center justify-center">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                <Info className="w-3 h-3" />
                                Alerts are processed in the background 24/7
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {coin && (
                <TradeModal
                    isOpen={showTradeModal}
                    onClose={() => setShowTradeModal(false)}
                    symbol={coin.symbol}
                    currentPrice={coin.price}
                />
            )}

        </div>
    );
}

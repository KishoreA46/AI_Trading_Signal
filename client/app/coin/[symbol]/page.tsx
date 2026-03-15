// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { marketAPI, signalsAPI, MarketCoin, Signal } from '@/lib/api';
import { TrendingUp, TrendingDown, ArrowLeft, Activity, Target, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function CoinDetailPage() {
    const params = useParams();
    const symbol = (params.symbol as string).replace('-', '/');
    const [coin, setCoin] = useState<MarketCoin | null>(null);
    const [signal, setSignal] = useState<Signal | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshingSignal, setRefreshingSignal] = useState(false);

    const [historyData, setHistoryData] = useState<any[]>([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [marketData, klines] = await Promise.all([
                marketAPI.getTopCoins(),
                marketAPI.getKlines(symbol, '1h', 1000)
            ]);

            const foundCoin = marketData.find(c => c.symbol === symbol);
            setCoin(foundCoin || null);

            if (klines && klines.length > 0) {
                setHistoryData(klines.map((k: any) => ({
                    time: new Date(k.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    price: k.close
                })));
            }
        } catch (error) {
            console.error('Failed to fetch coin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshSignal = async () => {
        try {
            setRefreshingSignal(true);
            const freshSignal = await signalsAPI.getBySymbol(symbol, true);
            setSignal(freshSignal);
        } catch (error) {
            console.error('Failed to refresh signal:', error);
        } finally {
            setRefreshingSignal(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [symbol]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-lg">Loading coin data...</div>
            </div>
        );
    }

    if (!coin) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-lg">Coin not found.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                            {coin?.symbol.split('/')[0].charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{coin?.symbol}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-semibold">${coin?.price.toLocaleString()}</span>
                                <span className={`flex items-center font-bold ${coin && coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {coin && coin.change24h >= 0 ? '+' : ''}{coin?.change24h.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart Section */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Price Action (24h)
                            </h3>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historyData}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                        <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false}
                                            domain={['auto', 'auto']}
                                            tickFormatter={(val) => `$${val.toLocaleString()}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                                            formatter={(val: any) => [`$${val.toLocaleString()}`, 'Price']}
                                        />
                                        <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h4 className="font-bold text-muted-foreground text-xs mb-4 tracking-wider">Market Stats</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">24h High</span>
                                        <span className="font-bold">${coin.high24h.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">24h Low</span>
                                        <span className="font-bold">${coin.low24h.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Volume (USDT)</span>
                                        <span className="font-bold">${(coin.quoteVolume / 1000000).toFixed(2)}M</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h4 className="font-bold text-muted-foreground text-xs mb-4 tracking-wider">Indicators</h4>
                                <div className="flex flex-wrap gap-2">
                                    {signal?.indicators?.map((ind: string) => (
                                        <span key={ind} className="px-3 py-1 bg-secondary rounded-full text-xs font-medium">
                                            {ind}
                                        </span>
                                    )) || <p className="text-sm text-muted-foreground italic">No active indicators</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Signal Info */}
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                Current Signal
                            </h3>

                            <button
                                onClick={handleRefreshSignal}
                                disabled={refreshingSignal}
                                className="mb-4 w-full flex items-center justify-center gap-2 py-2 px-4 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                <Zap className={`w-4 h-4 ${refreshingSignal ? 'animate-spin' : ''}`} />
                                {refreshingSignal ? 'Analyzing Market...' : 'Refresh AI Signal'}
                            </button>

                            {signal ? (
                                <div className="space-y-6">
                                    <div className={`p-4 rounded-xl flex items-center justify-between ${signal.type === 'BUY' ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            {signal.type === 'BUY' ? <TrendingUp className="text-green-500 w-8 h-8" /> : <TrendingDown className="text-red-500 w-8 h-8" />}
                                            <div>
                                                <div className={`font-bold text-xl ${signal.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>{signal.type}</div>
                                                <div className="text-xs text-muted-foreground">Strength: {signal.strength}/10</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">{signal.confidence}%</div>
                                            <div className="text-xs text-muted-foreground">Confidence</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="p-3 bg-secondary/30 rounded-lg flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Target className="w-4 h-4" /> Entry
                                            </div>
                                            <span className="font-bold">${signal.entry.toLocaleString()}</span>
                                        </div>
                                        <div className="p-3 bg-secondary/30 rounded-lg flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Shield className="w-4 h-4" /> Stop Loss
                                            </div>
                                            <span className="font-bold text-red-500">${signal.stop_loss.toLocaleString()}</span>
                                        </div>
                                        <div className="p-3 bg-secondary/30 rounded-lg flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <TrendingUp className="w-4 h-4" /> Take Profit
                                            </div>
                                            <span className="font-bold text-green-500">${signal.take_profit.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all">
                                        Execute Paper Trade
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground italic">No active signal for this pair</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                            <h4 className="font-bold mb-2">Claude's Insight</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {coin.symbol} is currently showing {coin.change24h > 0 ? 'bullish' : 'bearish'} momentum.
                                The volume of ${(coin.quoteVolume / 1000000).toFixed(1)}M indicates {coin.quoteVolume > 50000000 ? 'high' : 'moderate'} liquidity.
                                {signal ? ` The indicators suggest a potential ${signal.type} opportunity.` : ' We recommend waiting for a clearer signal before entering.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

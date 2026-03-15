
import { useState, useEffect } from 'react';
import { marketAPI, MarketCoin, watchlistAPI } from '@/lib/api';
import { TrendingUp, TrendingDown, Search, Star, AlertCircle } from 'lucide-react';
import CoinIcon from './coin-icon';

interface WatchlistPageProps {
    onSelectCoin?: (symbol: string) => void;
}

export default function WatchlistPage({ onSelectCoin }: WatchlistPageProps) {
    const [coins, setCoins] = useState<MarketCoin[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [marketData, watchlistData] = await Promise.all([
                marketAPI.getTopCoins(),
                watchlistAPI.getAll()
            ]);
            // Filter only watchlist coins
            setCoins(marketData.filter(c => watchlistData.includes(c.symbol)));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const removefromWatchlist = async (symbol: string) => {
        try {
            await watchlistAPI.remove(symbol);
            setCoins(prev => prev.filter(c => c.symbol !== symbol));
        } catch (error) {
            console.error('Failed to remove from watchlist:', error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredCoins = coins.filter(coin =>
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            <div className="border-b-0 md:border-b border-border bg-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground">Your Watchlist</h2>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search your watchlist..."
                        className="w-full bg-secondary/50 border border-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {loading && coins.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredCoins.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCoins.map((coin) => (
                            <div key={coin.symbol} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <CoinIcon symbol={coin.symbol} size={40} />
                                        <div>
                                            <button onClick={() => onSelectCoin?.(coin.symbol)}>
                                                <h3 className="font-bold text-lg hover:text-primary transition-colors cursor-pointer text-left">
                                                    {coin.symbol}
                                                </h3>
                                            </button>
                                            <p className="text-2xl font-bold text-left">${coin.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => removefromWatchlist(coin.symbol)} className="text-yellow-500 hover:text-muted-foreground transition-colors">
                                        <Star className="w-6 h-6 fill-current" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                    <div>
                                        <p className="text-xs text-muted-foreground">24h Change</p>
                                        <div className={`flex items-center gap-1 font-bold ${coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {coin.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            {coin.change24h > 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Volume</p>
                                        <p className="font-bold">${(coin.quoteVolume / 1000000).toFixed(1)}M</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
                        <p>No coins in your watchlist yet</p>
                        <p className="text-sm opacity-50">Star coins in the Market tab to see them here</p>
                    </div>
                )}
            </div>
        </div>
    );
}

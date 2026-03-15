
import { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Briefcase, TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, Activity, X } from 'lucide-react';
import { performanceAPI } from '@/lib/api';
import CoinIcon from './coin-icon';

const COLORS = ['#3b82f6', '#10b981', '#E50914', '#ef4444', '#8b5cf6', '#ec4899'];

export default function PortfolioPage() {
    const [loading, setLoading] = useState(true);
    const [portfolioData, setPortfolioData] = useState({
        balance: 10000.00,
        cashBalance: 10000.00,
        dailyPnL: 0,
        dailyChange: 0,
        totalTrades: 0,
        winRate: 0,
        allocations: [] as { name: string, value: number, color: string }[],
        equityCurve: [] as any[]
    });
    const [showCapitalInput, setShowCapitalInput] = useState(false);
    const [showAllocateInput, setShowAllocateInput] = useState(false);
    const [newCapital, setNewCapital] = useState('');
    const [allocateSymbol, setAllocateSymbol] = useState('');
    const [allocateAmount, setAllocateAmount] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 200);
        return () => clearTimeout(timer);
    }, []);

    const fetchPortfolio = useCallback(async () => {
        try {
            setLoading(true);
            const [summary, history, settings] = await Promise.all([
                performanceAPI.getSummary(),
                performanceAPI.getPnLHistory(),
                performanceAPI.getSettings()
            ]);

            const exposuresRaw = settings?.exposures || settings?.allocations || {};
            const cash = summary?.cashBalance || settings?.cashBalance || 0;

            const chartAllocations = [
                { name: 'USDT (Free)', value: cash, color: '#10b981' },
                ...Object.entries(exposuresRaw).map(([symbol, amount], idx) => ({
                    name: symbol.split('/')[0],
                    value: amount as number,
                    color: COLORS[idx % COLORS.length]
                }))
            ].filter(item => item.value > 0);

            setPortfolioData({
                balance: summary?.equity || cash,
                cashBalance: cash,
                dailyPnL: summary?.dailyPnL || 0,
                dailyChange: summary?.dailyChange || 0,
                totalTrades: summary?.totalTrades || 0,
                winRate: summary?.winRate || 0,
                allocations: chartAllocations,
                equityCurve: (history || [])
            });
        } catch (error) {
            console.error('Failed to fetch portfolio data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPortfolio();
    }, [fetchPortfolio]);

    const handleSetCapital = async () => {
        const capital = parseFloat(newCapital);
        if (isNaN(capital)) return;

        try {
            await performanceAPI.updateSettings({ initialCapital: capital });
            setShowCapitalInput(false);
            setNewCapital('');
            fetchPortfolio();
        } catch (error) {
            console.error('Failed to update capital:', error);
        }
    };

    const handleAllocate = async () => {
        let symbol = allocateSymbol.trim().toUpperCase();
        if (!symbol) return;

        // Standardize format: BTC -> BTC/USDT
        if (!symbol.includes('/')) {
            symbol = `${symbol}/USDT`;
        }

        const amount = parseFloat(allocateAmount);
        if (isNaN(amount)) return;
        setError(null);

        try {
            await performanceAPI.allocateCapital(symbol, amount);
            setShowAllocateInput(false);
            setAllocateSymbol('');
            setAllocateAmount('');
            fetchPortfolio();
        } catch (error: any) {
            console.error('Failed to allocate capital:', error);
            setError(error.message || 'Failed to allocate capital. Check your unallocated USDT balance.');
        }
    };

    const handleRemoveAllocation = async (symbol: string) => {
        try {
            await performanceAPI.allocateCapital(symbol, 0);
            fetchPortfolio();
        } catch (error) {
            console.error('Failed to remove allocation:', error);
        }
    };

    if (loading && !portfolioData.equityCurve.length) {
        return (
            <div className="flex items-center justify-center h-full bg-background min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background overflow-auto">
            {/* Header */}
            <div className="border-b border-border bg-card p-6 sticky top-0 z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground">Portfolio</h2>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-secondary/10 p-2 px-3 rounded-xl border border-border flex items-center gap-3">
                            <div>
                                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-wider leading-none mb-1">USDT Balance</p>
                                <p className="text-lg font-bold text-foreground leading-none">${portfolioData.cashBalance.toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => setShowCapitalInput(!showCapitalInput)}
                                className="p-1.5 hover:bg-primary/20 rounded-lg text-primary transition-colors flex items-center justify-center border border-primary/10"
                                title="Add Capital"
                            >
                                <DollarSign className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center justify-between group animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <span className="font-bold">Notice:</span> {error}
                        </div>
                        <button onClick={() => setError(null)} className="hover:text-red-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {(showCapitalInput || showAllocateInput) && (
                    <div className="p-6 bg-card border border-border rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
                        {showCapitalInput && (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/20 p-3 rounded-xl text-primary">
                                        <Briefcase className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Add Simulator Capital</h4>
                                        <p className="text-sm text-muted-foreground">This increases your total simulation budget</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <input
                                        type="number"
                                        placeholder="Amount (USD)"
                                        value={newCapital}
                                        onChange={(e) => setNewCapital(e.target.value)}
                                        className="bg-card border border-border px-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none flex-1 md:w-48"
                                    />
                                    <button
                                        onClick={handleSetCapital}
                                        className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity"
                                    >
                                        Update Capital
                                    </button>
                                </div>
                            </div>
                        )}

                        {showCapitalInput && showAllocateInput && <div className="border-t border-border" />}

                        {showAllocateInput && (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-500/20 p-3 rounded-xl text-blue-500">
                                        <PieChartIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">Split Capital to Symbol</h4>
                                        <p className="text-sm text-muted-foreground">Allocate a portion of USDT to a specific trading bucket</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                    <input
                                        type="text"
                                        placeholder="BTC/USDT"
                                        value={allocateSymbol}
                                        onChange={(e) => setAllocateSymbol(e.target.value)}
                                        className="bg-card border border-border px-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none w-full md:w-32"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        value={allocateAmount}
                                        onChange={(e) => setAllocateAmount(e.target.value)}
                                        className="bg-card border border-border px-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none flex-1 md:w-32"
                                    />
                                    <button
                                        onClick={handleAllocate}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        Allocate
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Balance', value: `$${portfolioData.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-500' },
                        { label: 'Daily PnL', value: `${portfolioData.dailyPnL >= 0 ? '+' : ''}$${portfolioData.dailyPnL.toLocaleString()}`, icon: Activity, color: portfolioData.dailyPnL >= 0 ? 'text-green-500' : 'text-red-500' },
                        { label: 'Win Rate', value: `${portfolioData.winRate}%`, icon: TrendingUp, color: 'text-blue-500' },
                        { label: 'Total Trades', value: portfolioData.totalTrades, icon: Briefcase, color: 'text-purple-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-bold leading-none mb-1">{stat.label}</p>
                                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Performance Overview */}
                    <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Equity Curve
                            </h3>
                            <div className="flex gap-2">
                                {['1W', '1M', '3M', 'ALL'].map(t => (
                                    <button key={t} className={`px-3 py-1 rounded-lg text-xs font-bold ${t === 'ALL' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-muted-foreground transition-colors'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 w-full relative min-h-[300px]">
                            <div className="absolute inset-0">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={portfolioData.equityCurve}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                            <XAxis dataKey="date" hide />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                                stroke="var(--muted-foreground)"
                                                fontSize={10}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px' }}
                                                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Portfolio Value']}
                                            />
                                            <Area type="monotone" dataKey="pnl" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Allocation Breakdown */}
                    <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-primary" />
                                Allocation
                            </h3>
                            <button
                                onClick={() => setShowAllocateInput(!showAllocateInput)}
                                className="text-xs font-bold text-primary hover:underline bg-primary/10 px-2 py-1 rounded"
                            >
                                + New
                            </button>
                        </div>

                        <div className="h-[200px] w-full relative mb-4">
                            <div className="absolute inset-0">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={portfolioData.allocations}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {portfolioData.allocations.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', fontSize: '12px' }}
                                                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Amount']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                            {portfolioData.allocations.map((item, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        {item.name !== 'USDT (Free)' && (
                                            <CoinIcon symbol={item.name} size={16} />
                                        )}
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-foreground font-bold">${item.value.toLocaleString()}</span>
                                        {item.name !== 'USDT (Free)' && (
                                            <button
                                                onClick={() => handleRemoveAllocation(item.name)}
                                                className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Insights / Tips */}
                <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-4">Portfolio Insights</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-secondary/30 rounded-xl border border-border">
                                <p className="text-sm font-medium text-foreground mb-1">Diversification Check</p>
                                <p className="text-xs text-muted-foreground tracking-wide">You have {portfolioData.allocations.length - 1} symbol specific allocations. Most of your capital is in liquid USDT.</p>
                            </div>
                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                                <p className="text-sm font-medium text-primary mb-1">Risk Alert</p>
                                <p className="text-xs text-muted-foreground tracking-wide">Current win rate is {portfolioData.winRate}%. Consider adjusting leverage on higher risk symbols.</p>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-12 -bottom-12 p-12 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                </div>
            </div>
        </div>
    );
}

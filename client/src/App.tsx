import { useState, useEffect } from 'react';

import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Bell, Bot, PanelLeftOpen, PanelLeft, Trash2, CheckCircle, Circle } from 'lucide-react';
import DashboardNav from '@/components/dashboard-nav';
import DashboardPage from '@/components/dashboard-page';
import MarketPage from '@/components/market-page';
import PortfolioPage from '@/components/portfolio-page';
import TradeHistoryPage from '@/components/trade-history-page';
import SettingsPanel from '@/components/settings-panel';
import WatchlistPage from '@/components/watchlist-page';
import CoinDetailView from '@/components/coin-detail-view';
import NewsPage from '@/components/news-page';
import LandingPage from '@/components/landing-page';
import LoginPage from '@/components/login-page';
import SignupPage from '@/components/signup-page';
import { notificationsAPI } from '@/lib/api';

export default function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab = location.pathname.substring(1) || 'dashboard';


    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(() => {
        return localStorage.getItem('selectedSymbol');
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const fetchNotifications = async () => {
        const data = await notificationsAPI.getAll();
        // Since we don't have a backend 'read' state yet, we merge with local 'read' states if needed
        // For now, let's just use the fresh data
        setNotifications(data);
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const toggleRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
    };

    const deleteNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const [appearance, setAppearance] = useState(() => {
        const saved = localStorage.getItem('appearance');
        return saved ? JSON.parse(saved) : {
            theme: 'dark',
            density: 'comfortable',
            colorAccent: '#E50914',
        };
    });

    // Clear selected symbol when navigating to a different page
    useEffect(() => {
        setSelectedSymbol(null);
    }, [location.pathname]);

    useEffect(() => {
        if (selectedSymbol) {
            localStorage.setItem('selectedSymbol', selectedSymbol);
        } else {
            localStorage.removeItem('selectedSymbol');
        }
    }, [selectedSymbol]);

    useEffect(() => {
        localStorage.setItem('appearance', JSON.stringify(appearance));
    }, [appearance]);

    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            // Check for the specific browser media play cancellation error
            if (event.reason?.name === 'AbortError' && event.reason?.message?.includes('play()')) {
                event.preventDefault(); // Silence the "uncaught" console error
                console.debug('Suppressed video/audio play() interruption error');
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }, []);

    // Close notifications on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isNotificationsOpen && !(e.target as HTMLElement).closest('.notifications-container')) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotificationsOpen]);

    useEffect(() => {
        if (location.pathname === '/') {
            document.title = 'CryptoAI | Next-Gen Trading Intelligence';
            return;
        }

        if (selectedSymbol) {
            document.title = `${selectedSymbol.replace('-', '/')} | CryptoAI`;
        } else {
            const tabName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
            document.title = `${tabName} | CryptoAI Intelligence`;
        }
    }, [selectedSymbol, activeTab, location.pathname]);

    if (location.pathname === '/') {
        return <LandingPage onStart={() => navigate('/signup')} />;
    }

    if (location.pathname === '/login') {
        return <LoginPage onLogin={() => navigate('/dashboard')} onSignupClick={() => navigate('/signup')} />;
    }

    if (location.pathname === '/signup') {
        return <SignupPage onSignup={() => navigate('/dashboard')} onLoginClick={() => navigate('/login')} />;
    }

    return (
        <div
            className={`flex flex-col h-screen h-[100dvh] bg-background text-foreground ${appearance.theme === 'dark' ? 'dark' : ''} ${appearance.density === 'compact' ? 'density-compact' : ''}`}
            style={{
                '--primary': appearance.colorAccent,
                '--sidebar-primary': appearance.colorAccent,
                '--accent': appearance.colorAccent,
                '--ring': appearance.colorAccent
            } as any}
        >
            <TopLoadingBar />
            {/* Global Header */}
            <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-[#111] bg-black z-20">
                <div
                    className={`flex items-center h-full border-r border-[#111] px-4 pr-3 justify-between transition-all duration-300 ${isSidebarOpen ? 'md:w-60' : 'md:w-[68px]'} bg-black`}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="shrink-0 w-6 h-6 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-white leading-none whitespace-nowrap">
                            CryptoAI
                        </h1>
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#222] text-gray-400 hover:text-white transition-colors duration-200 shrink-0"
                        title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        {isSidebarOpen ? (
                            <PanelLeftOpen className="w-5 h-5" />
                        ) : (
                            <PanelLeft className="w-5 h-5" />
                        )}
                    </button>
                </div>



                {/* Right Profile */}
                <div className="flex items-center gap-3 relative notifications-container">
                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative focus:outline-none p-2 rounded-full hover:bg-white/5 transition-colors">
                        <Bell className={`w-5 h-5 transition-colors ${isNotificationsOpen ? 'text-white' : 'text-gray-300 hover:text-white'}`} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1a1a1a]"></span>
                        )}
                    </button>

                    {isNotificationsOpen && (
                        <div className="absolute right-4 top-[calc(100%+8px)] w-80 bg-white dark:bg-[#1e1e1e] border border-border dark:border-[#2b2b2b] rounded-xl shadow-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-border dark:border-[#2b2b2b] flex items-center justify-between bg-slate-50 dark:bg-[#252525]">
                                <h3 className="text-sm font-bold text-foreground dark:text-white">Notifications</h3>
                                {unreadCount > 0 && <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{unreadCount} UNREAD</span>}
                            </div>
                            <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.map((n) => (
                                        <div key={n.id} className={`px-4 py-3 border-b border-border dark:border-[#2b2b2b] transition-all relative group ${n.read ? 'opacity-50' : 'bg-primary/5'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    {!n.read && <div className="w-1.5 h-1.5 bg-primary rounded-full" />}
                                                    <span className={`text-[11px] font-black uppercase tracking-tight ${n.read ? 'text-muted-foreground' : 'text-primary'}`}>{n.title}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">{formatTimeAgo(n.time)}</span>
                                            </div>
                                            <p className={`text-xs leading-normal transition-colors ${n.read ? 'text-muted-foreground line-through decoration-muted-foreground/50' : 'text-foreground/80 dark:text-gray-300'}`}>{n.message}</p>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleRead(n.id); }}
                                                    className="p-1 px-2 rounded bg-slate-100 dark:bg-[#2a2a2a] hover:bg-slate-200 dark:hover:bg-[#333] text-[9px] font-bold text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white flex items-center gap-1 transition-colors"
                                                    title={n.read ? "Mark as unread" : "Mark as read"}
                                                >
                                                    {n.read ? <Circle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3 text-primary" />}
                                                    {n.read ? 'Unread' : 'Read'}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                    className="p-1 px-2 rounded bg-slate-100 dark:bg-[#2a2a2a] hover:bg-red-500/10 dark:hover:bg-red-500/20 text-[9px] font-bold text-muted-foreground hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500 flex items-center gap-1 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-12 text-center bg-white dark:bg-[#1e1e1e]">
                                        <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Bell className="w-6 h-6 text-muted-foreground opacity-30" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">All caught up!</p>
                                    </div>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <div className="px-4 py-2 border-t border-border dark:border-[#2b2b2b] bg-slate-50 dark:bg-[#252525] text-center">
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                                    >
                                        Mark all as read
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 pl-1.5 pr-3 py-1.5 rounded-full transition-colors group">
                        <div className="w-7 h-7 rounded-sm overflow-hidden object-cover border border-[#2b2b2b] flex items-center justify-center bg-[#2a2a2a]">
                            <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=trader" alt="Profile" />
                        </div>
                        <span className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors">Ayush AI</span>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative">
                {/* Sidebar Navigation */}
                <DashboardNav isSidebarOpen={isSidebarOpen} />

                {/* Main Content */}
                <main className="flex-1 overflow-auto relative transition-all duration-300 pb-24 md:pb-0">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage onSelectCoin={(sym) => navigate(`/coin/${sym.replace('/', '-')}`)} />} />
                        <Route path="/market" element={<MarketPage onSelectCoin={(sym) => navigate(`/coin/${sym.replace('/', '-')}`)} />} />
                        <Route path="/portfolio" element={<PortfolioPage />} />
                        <Route path="/history" element={<TradeHistoryPage />} />
                        <Route path="/news" element={<NewsPage />} />
                        <Route path="/watchlist" element={<WatchlistPage onSelectCoin={(sym) => navigate(`/coin/${sym.replace('/', '-')}`)} />} />
                        <Route path="/settings" element={<SettingsPanel appearance={appearance} setAppearance={setAppearance} />} />
                        <Route path="/coin/:symbol" element={<CoinRouteWrapper />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

function CoinRouteWrapper() {
    const { symbol } = useParams();
    const navigate = useNavigate();
    if (!symbol) return null;
    return (
        <CoinDetailView
            symbol={symbol.replace('-', '/')}
            onClose={() => navigate(-1)}
        />
    );
}

function TopLoadingBar() {
    const location = useLocation();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);
        setProgress(30);

        const timer1 = setTimeout(() => setProgress(70), 200);
        const timer2 = setTimeout(() => {
            setProgress(100);
            setTimeout(() => {
                setVisible(false);
                setTimeout(() => setProgress(0), 300);
            }, 300);
        }, 500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [location.pathname]);

    return (
        <div
            className="fixed top-0 left-0 h-[3px] bg-white z-[100] transition-all ease-out"
            style={{
                width: `${progress}%`,
                opacity: visible ? 1 : 0,
                transitionDuration: visible ? '300ms' : '0ms'
            }}
        />
    );
}

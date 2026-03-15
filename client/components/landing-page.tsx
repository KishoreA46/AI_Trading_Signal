import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Search, Globe, Users, User, Rocket, ChevronDown, Activity, Eye, BarChart2, Shield, Zap, ArrowRight } from "lucide-react";

interface LandingPageProps {
    onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const mockedCoins = [
        { symbol: "BTC", price: 68422.50, change: 2.4 },
        { symbol: "ETH", price: 3455.12, change: -1.2 },
        { symbol: "SOL", price: 145.88, change: 5.6 },
        { symbol: "BNB", price: 612.45, change: 0.8 },
        { symbol: "XRP", price: 0.58, change: -0.5 },
        { symbol: "ADA", price: 0.45, change: 1.2 },
        { symbol: "DOGE", price: 0.16, change: -2.3 },
        { symbol: "DOT", price: 7.22, change: 0.4 },
        { symbol: "AVAX", price: 38.45, change: 4.2 },
        { symbol: "SHIB", price: 0.000028, change: -3.1 },
    ];

    return (
        <div className="min-h-screen bg-[#000000] text-[#d1d4dc] selection:bg-[#2962ff]/30 selection:text-white font-sans overflow-x-hidden">

            {/* Ticker Tape */}
            <div className="bg-[#131722] border-b border-[#2a2e39] h-[38px] flex items-center overflow-hidden whitespace-nowrap fixed top-0 w-full z-[60]">
                <div className="flex animate-marquee-slow hover:pause-animation">
                    {[...mockedCoins, ...mockedCoins, ...mockedCoins].map((coin, i) => (
                        <div key={i} className="inline-flex items-center gap-2 px-6 border-r border-[#2a2e39]">
                            <span className="text-xs font-bold text-white tracking-wide">{coin.symbol}USDT</span>
                            <span className="text-xs font-medium tabular-nums text-[#d1d4dc]">
                                ${coin.price < 1 ? coin.price.toFixed(6) : coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`text-[11px] font-black tracking-wide \${coin.change >= 0 ? "text-[#089981]" : "text-[#f23645]"}`}>
                                {coin.change > 0 ? "+" : ""}{coin.change}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Professional Navigation */}
            <nav className={`fixed top-[38px] left-0 right-0 w-full z-50 transition-all duration-300 border-b \${isScrolled ? 'bg-[#000000]/95 backdrop-blur-xl border-[#2a2e39] shadow-lg py-0' : 'bg-gradient-to-b from-[#000000]/80 to-transparent border-transparent py-2'}`}>
                <div className="w-full px-4 md:px-8">
                    <div className="flex items-center justify-between h-[64px]">
                        <div className="flex items-center gap-6 xl:gap-10">
                            {/* Logo */}
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="30" height="30" fill="none">
                                    <path fill="currentColor" fillRule="evenodd" d="M12.91 3.251a7.485 7.485 0 0 0-4.664.21A7.502 7.502 0 0 0 0 10.5c0 3.86 2.923 7.03 6.643 7.447.457 1.95 2.197 3.303 4.22 3.303 2.08 0 3.858-1.439 4.248-3.468C18.667 17.587 21 14.394 21 10.5a7.501 7.501 0 0 0-8.09-7.249Z" className="text-white" />
                                </svg>
                                <span className="text-[20px] font-bold tracking-tight text-white flex items-center">
                                    TradingView
                                </span>
                            </div>

                            {/* Search Bar matching TradingView */}
                            <div className="hidden lg:flex items-center bg-[#ffffff]/10 hover:bg-[#ffffff]/15 transition-colors rounded-full px-4 h-9 w-[260px] cursor-pointer border border-[#ffffff]/10 hover:border-[#ffffff]/20">
                                <Search className="w-4 h-4 text-[#868993] mr-2" />
                                <span className="text-[#868993] text-[14px] font-medium flex-1">Search markets</span>
                                <span className="text-[#868993]/60 text-[12px] font-semibold tracking-wider">Ctrl+K</span>
                            </div>

                            {/* Nav Links */}
                            <div className="hidden lg:flex items-center gap-6">
                                {["Products", "Community", "Markets", "News", "Brokers", "More"].map((item) => (
                                    <a key={item} href={`#\${item.toLowerCase()}`} className="text-[14px] font-semibold text-[#c1c4cd] hover:text-white transition-colors cursor-pointer py-2">
                                        {item}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="hidden md:flex items-center gap-1.5 cursor-pointer text-[#c1c4cd] hover:text-white transition-colors">
                                <Globe className="w-5 h-5" />
                                <span className="text-[14px] font-semibold mt-0.5">IN</span>
                            </div>
                            <div className="hidden sm:flex items-center cursor-pointer text-[#c1c4cd] hover:text-white transition-colors">
                                <User className="w-5 h-5" />
                            </div>

                            <Button
                                onClick={onStart}
                                className="rounded-full px-6 h-9 bg-[#2962ff] hover:bg-[#1e4ebd] text-white font-semibold text-[14px] shadow-none border-none transition-colors"
                            >
                                Get started
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Breathtaking Hero Section */}
            <section className="relative pt-[102px] min-h-[92vh] flex flex-col items-center justify-center overflow-hidden">
                {/* Background Layering for perfect blending */}
                <div className="absolute inset-0 z-0 pointer-events-none bg-[#000000]">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000000]/50 to-[#000000] z-10" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(41,98,255,0.05)_0%,transparent_60%)] z-10" />
                    <img src="/astronaut_space_bg.png" alt="Cosmic Background" className="w-full h-full object-cover object-top opacity-70 scale-105" />
                    {/* Dark bottom fade to seamlessly blend into next section */}
                    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#000000] via-[#000000]/80 to-transparent z-20" />
                </div>

                {/* Hero Content */}
                <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center mt-[-8vh]">
                    <h1 className="text-6xl md:text-[90px] lg:text-[130px] font-black tracking-tighter text-white mb-6 leading-[1.02] drop-shadow-2xl selection:bg-[#2962ff] selection:text-white">
                        Look first / <br className="hidden md:block" /> Then leap.
                    </h1>

                    <p className="text-xl md:text-3xl font-medium text-[#d1d4dc] max-w-3xl mb-12 drop-shadow-lg" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
                        The best trades require research, then commitment.
                    </p>

                    <div className="flex flex-col items-center gap-5 mt-4">
                        <Button
                            onClick={onStart}
                            className="rounded-full px-12 h-16 text-[19px] font-bold bg-white text-black hover:bg-[#f0f3fa] transition-all duration-300 shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:scale-[1.02] group"
                        >
                            Get started for free
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <p className="text-[#868993] font-medium text-[15px] drop-shadow-md">
                            $0 forever, no credit card needed
                        </p>
                    </div>
                </div>

                {/* Astronaut Tag Overlay matches TradingView's ad */}
                <div className="absolute bottom-8 right-4 md:right-8 z-40 flex flex-col sm:flex-row items-end sm:items-center gap-3 backdrop-blur-xl bg-[#000000]/40 p-2 pr-6 rounded-full border border-white/10 hover:bg-[#000000]/60 transition-colors shadow-2xl cursor-pointer">
                    <div className="flex items-center gap-3">
                        <img src="https://ui-avatars.com/api/?name=Scott+Kidd&background=cbd5e1&color=0f172a&rounded=true" alt="Scott" className="w-10 h-10 rounded-full border border-white/20" />
                        <div className="text-left flex flex-col justify-center">
                            <span className="text-white font-bold text-[13px] leading-tight">Scott "Kidd" Poteet</span>
                            <span className="text-[#b2b5be] text-[11px] font-bold leading-tight">Polaris Dawn astronaut</span>
                        </div>
                    </div>
                    <div className="hidden sm:block w-[1px] h-8 bg-white/20 mx-2"></div>
                    <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 hover:bg-white/20 transition-colors">
                        <Rocket className="w-[14px] h-[14px] text-white" />
                        <span className="text-white text-[13px] font-bold">Space mission</span>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce cursor-pointer text-[#868993] hover:text-white transition-colors">
                    <ChevronDown className="w-8 h-8" />
                </div>
            </section>

            {/* Ultra-Clean Markets Tab Section */}
            <section className="relative z-20 bg-[#000000] pb-24 border-t border-[#1e222d] pt-16">
                <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
                    <div className="flex gap-8 border-b border-[#2a2e39] mb-6 overflow-x-auto hide-scrollbar pointer-events-auto">
                        {['Crypto', 'Indices', 'Stocks', 'Forex', 'Futures', 'Bonds'].map((tab, i) => (
                            <button key={tab} className={`pb-4 text-[16px] font-semibold whitespace-nowrap transition-colors appearance-none outline-none target:outline-none focus:outline-none \${i === 0 ? 'text-white border-b-2 border-[#2962ff]' : 'text-[#787b86] hover:text-[#b2b5be]'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="bg-[#131722] rounded-[16px] border border-[#2a2e39] shadow-2xl overflow-hidden">
                        <div className="grid grid-cols-4 px-6 py-4 border-b border-[#2a2e39] text-[#787b86] text-[11px] font-bold tracking-wider uppercase">
                            <div>Symbol</div>
                            <div className="text-right">Last Price</div>
                            <div className="text-right">Change</div>
                            <div className="text-right">Change %</div>
                        </div>
                        {[
                            { s: "BTCUSDT", n: "Bitcoin", p: "68,422.50", c: "+1,607.50", cp: "+2.41%" },
                            { s: "ETHUSDT", n: "Ethereum", p: "3,455.12", c: "-41.80", cp: "-1.20%" },
                            { s: "SOLUSDT", n: "Solana", p: "145.88", c: "+7.73", cp: "+5.60%" },
                            { s: "BNBUSDT", n: "Binance Coin", p: "612.45", c: "+4.87", cp: "+0.80%" },
                            { s: "XRPUSDT", n: "Ripple", p: "0.5800", c: "-0.0029", cp: "-0.50%" }
                        ].map((row, i) => (
                            <div key={i} className={`grid grid-cols-4 items-center px-6 py-[18px] hover:bg-[#1e222d] transition-colors cursor-pointer \${i !== 4 ? 'border-b border-[#1e222d]' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-[#2a2e39] flex justify-center items-center font-bold text-sm text-white border border-[#363a45] shadow-inner">{row.s[0]}</div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-[15px] leading-tight">{row.s}</span>
                                        <span className="text-[#868993] text-[13px] font-medium leading-tight">{row.n}</span>
                                    </div>
                                </div>
                                <div className="text-right text-white font-semibold text-[15px] tabular-nums">${row.p}</div>
                                <div className={`text-right font-semibold text-[15px] tabular-nums \${row.c.startsWith('+') ? 'text-[#089981]' : 'text-[#f23645]'}`}>{row.c}</div>
                                <div className={`text-right font-semibold text-[15px] tabular-nums \${row.cp.startsWith('+') ? 'text-[#089981]' : 'text-[#f23645]'}`}>{row.cp}</div>
                            </div>
                        ))}
                        <div className="w-full h-12 flex items-center justify-center border-t border-[#1e222d] hover:bg-[#1e222d] transition-colors cursor-pointer text-[#2962ff] font-semibold text-[14px]">
                            View all markets <ArrowRight className="w-4 h-4 ml-1.5" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Glowing Cosmic Superchart Section (Perfected implementation) */}
            <section className="relative py-32 bg-[#000000] overflow-hidden border-t border-[#1e222d]">
                {/* Clean, deep neon lighting effects */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#2962ff]/20 rounded-full blur-[120px]"></div>
                    <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[140px]"></div>
                </div>

                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl md:text-[72px] font-black text-white mb-6 tracking-tighter leading-tight">
                            Where the world does markets
                        </h2>
                        <p className="text-xl md:text-2xl text-[#b2b5be] font-medium max-w-2xl mx-auto">
                            Join 100 million traders and investors taking the future into their own hands.
                        </p>
                    </div>

                    <div className="relative mt-20 group perspective-[2000px] max-w-[1000px] mx-auto">
                        {/* Elegant multi-layer gradient border */}
                        <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 opacity-70 group-hover:opacity-100 transition-opacity duration-700 blur-[2px]"></div>
                        <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-500 to-pink-500 z-0"></div>
                        <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 opacity-20 blur-3xl group-hover:opacity-40 transition-opacity duration-700"></div>

                        <div className="relative z-10 bg-[#131722] rounded-[22px] overflow-hidden shadow-2xl transform transition-transform duration-700 hover:scale-[1.01]">
                            <img src="/glowing_superchart.png" alt="Advanced Superchart Platform Overview" className="w-full block border-none outline-none h-auto object-cover" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Essential Features Grid */}
            <section className="py-24 bg-[#0a0a0b] border-y border-[#1e222d]">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-16">
                        <div className="flex flex-col items-center text-center space-y-5">
                            <div className="w-16 h-16 rounded-2xl bg-[#131722] border border-[#2a2e39] flex items-center justify-center text-[#2962ff] shadow-lg">
                                <BarChart2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-white tracking-tight">Advanced Charting</h3>
                            <p className="text-[#868993] text-[16px] font-medium leading-relaxed">
                                Unparalleled charting capabilities with massive historical data and advanced drawing tools for technical analysis.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-5">
                            <div className="w-16 h-16 rounded-2xl bg-[#131722] border border-[#2a2e39] flex items-center justify-center text-pink-500 shadow-lg">
                                <Zap className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-white tracking-tight">Real-time Data</h3>
                            <p className="text-[#868993] text-[16px] font-medium leading-relaxed">
                                Lightning-fast market quotes with zero delay. Stay ahead of the market with the fastest possible edge.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-5">
                            <div className="w-16 h-16 rounded-2xl bg-[#131722] border border-[#2a2e39] flex items-center justify-center text-emerald-500 shadow-lg">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-white tracking-tight">Reliable Network</h3>
                            <p className="text-[#868993] text-[16px] font-medium leading-relaxed">
                                Join millions of active traders globally in the most heavily fortified and secure trading ecosystem.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 bg-[#000000]">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                        <div className="lg:col-span-2 space-y-6 pr-8">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="32" height="32" fill="none">
                                    <path fill="currentColor" fillRule="evenodd" d="M12.91 3.251a7.485 7.485 0 0 0-4.664.21A7.502 7.502 0 0 0 0 10.5c0 3.86 2.923 7.03 6.643 7.447.457 1.95 2.197 3.303 4.22 3.303 2.08 0 3.858-1.439 4.248-3.468C18.667 17.587 21 14.394 21 10.5a7.501 7.501 0 0 0-8.09-7.249Z" className="text-white" />
                                </svg>
                                <span className="text-[22px] font-bold tracking-tight text-white flex items-center">
                                    TradingView
                                </span>
                            </div>
                            <p className="text-[#787b86] text-[15px] font-medium leading-relaxed">
                                Look first. Then leap.
                            </p>
                            <div className="flex gap-3 pt-2">
                                {[Globe, Users, Activity, Eye].map((Icon, i) => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-[#131722] border border-[#2a2e39] flex items-center justify-center hover:bg-[#2a2e39] hover:text-white transition-all cursor-pointer text-[#868993]">
                                        <Icon className="w-[18px] h-[18px]" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h5 className="font-bold text-[16px] text-white">Products</h5>
                            <ul className="space-y-4 text-[15px] font-semibold text-[#868993]">
                                <li className="hover:text-white transition-colors cursor-pointer">Supercharts</li>
                                <li className="hover:text-white transition-colors cursor-pointer">Pine Script™</li>
                                <li className="hover:text-white transition-colors cursor-pointer">Stock Screener</li>
                                <li className="hover:text-white transition-colors cursor-pointer">Options Desk</li>
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <h5 className="font-bold text-[16px] text-white">Company</h5>
                            <ul className="space-y-4 text-[15px] font-semibold text-[#868993]">
                                <li className="hover:text-white transition-colors cursor-pointer">About</li>
                                <li className="hover:text-white transition-colors cursor-pointer">Features</li>
                                <li className="hover:text-white transition-colors cursor-pointer">Pricing</li>
                                <li className="hover:text-white transition-colors cursor-pointer">Wall of Love</li>
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <h5 className="font-bold text-[16px] text-white">Community</h5>
                            <ul className="space-y-4 text-[15px] font-semibold text-[#868993]">
                                <li className="hover:text-white transition-colors cursor-pointer">Refer a friend</li>
                                <li className="hover:text-white transition-colors cursor-pointer">Ideas</li>
                                <li className="hover:text-white transition-colors cursor-pointer">Scripts</li>
                                <li className="hover:text-white transition-colors cursor-pointer">House rules</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[#1e222d] flex flex-col md:flex-row justify-between items-center gap-6 text-[14px] font-semibold text-[#787b86]">
                        <div className="flex gap-6 flex-wrap justify-center">
                            <span className="hover:text-white transition-colors cursor-pointer">Terms of Use</span>
                            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
                            <span className="hover:text-white transition-colors cursor-pointer">Disclaimer</span>
                        </div>
                        <div>© 2026 TradingView Clone, Inc.</div>
                    </div>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-marquee-slow {
          display: flex;
          width: fit-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee-slow:hover {
          animation-play-state: paused;
        }
      ` }} />
        </div>
    );
}

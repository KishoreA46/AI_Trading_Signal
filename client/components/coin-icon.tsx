import { useState } from 'react';

interface CoinIconProps {
    symbol: string;
    size?: number;
    className?: string;
}

// Vivid gradient backgrounds per first letter for fallback icons
const LETTER_COLORS: Record<string, string> = {
    a: 'from-sky-500 to-blue-600',
    b: 'from-orange-400 to-amber-500',
    c: 'from-cyan-500 to-teal-600',
    d: 'from-yellow-400 to-orange-500',
    e: 'from-violet-500 to-purple-600',
    f: 'from-green-400 to-emerald-600',
    g: 'from-pink-400 to-rose-500',
    h: 'from-indigo-500 to-blue-600',
    i: 'from-fuchsia-500 to-pink-600',
    j: 'from-lime-400 to-green-500',
    k: 'from-red-400 to-rose-500',
    l: 'from-amber-500 to-yellow-600',
    m: 'from-teal-500 to-cyan-600',
    n: 'from-blue-500 to-indigo-600',
    o: 'from-rose-400 to-pink-500',
    p: 'from-emerald-500 to-green-600',
    q: 'from-purple-400 to-violet-600',
    r: 'from-orange-500 to-red-500',
    s: 'from-violet-400 to-indigo-500',
    t: 'from-green-500 to-teal-600',
    u: 'from-pink-500 to-fuchsia-600',
    v: 'from-sky-400 to-cyan-500',
    w: 'from-yellow-500 to-amber-600',
    x: 'from-slate-500 to-gray-600',
    y: 'from-lime-500 to-green-600',
    z: 'from-red-500 to-rose-600',
};

function FallbackIcon({ baseSymbol, size }: { baseSymbol: string; size: number }) {
    const firstLetter = baseSymbol.charAt(0).toLowerCase();
    const gradient = LETTER_COLORS[firstLetter] || 'from-primary to-primary/60';
    // Show up to 2 characters so e.g. "XAG" shows "XA" not just "X"
    const label = baseSymbol.length >= 3 ? baseSymbol.slice(0, 2) : baseSymbol;
    const fontSize = size > 28 ? size * 0.35 : size * 0.42;

    return (
        <div
            className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-inner shrink-0`}
            style={{ width: size, height: size }}
        >
            <span
                className="font-black text-white tracking-tight select-none"
                style={{ fontSize, lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
                {label.toUpperCase()}
            </span>
        </div>
    );
}

// Global caches for icon performance - VERSION BUMP FOR EXACT RELEVANCE
const MISSING_CACHE_KEY = 'crypto-icons-missing-v9';
const SUCCESS_CACHE_KEY = 'crypto-icons-success-v3';

// Force absolute exact image URLs for the most complex/obscure coins
const HARD_URL_MAP: Record<string, string> = {
    'XAU': 'https://coin-images.coingecko.com/coins/images/69746/large/1000023657.jpg',
    'XAG': 'https://coin-images.coingecko.com/coins/images/67838/large/HEXA.png',
    'SAHARA': 'https://coin-images.coingecko.com/coins/images/66681/large/Token_Logo_3x.png',
    'PORT3': 'https://coin-images.coingecko.com/coins/images/33383/large/port3-bc-200x200.png',
    'LYN': 'https://coin-images.coingecko.com/coins/images/68908/large/everlyn.png',
    'ESP': 'https://coin-images.coingecko.com/coins/images/67626/large/espresso.jpg',
    'POWER': 'https://coin-images.coingecko.com/coins/images/70944/large/power.png',
    'ARC': 'https://coin-images.coingecko.com/coins/images/52701/large/u312bPNA_400x400.jpg',
    'ASTER': 'https://coin-images.coingecko.com/coins/images/69040/large/_ASTER.png',
    'SIREN': 'https://coin-images.coingecko.com/coins/images/54479/large/siren.png',
    'HIPPO': 'https://coin-images.coingecko.com/coins/images/50450/large/sudeng.png',
    'MEMEFI': 'https://coin-images.coingecko.com/coins/images/51175/large/memefi.png',
    'UXLINK': 'https://coin-images.coingecko.com/coins/images/38600/large/uxlink.jpg',
    'NEIROETH': 'https://coin-images.coingecko.com/coins/images/39474/large/Neiro.jpg',
    'LEVER': 'https://coin-images.coingecko.com/coins/images/26456/large/leverfi.jpeg',
    'POL': 'https://coin-images.coingecko.com/coins/images/39322/large/POL.png'
};

const SYMBOL_MAP: Record<string, string> = {
    'MATIC': 'POL',
    'BEAMX': 'BEAM',
    'FB': 'FRACTAL',
    'USDT': 'TETHER',
    'BTC': 'BITCOIN',
    'ETH': 'ETHEREUM',
    'XAU': 'PAXG',
    'XAG': 'SILVER',
    'NEIROETH': 'NEIRO',
    'FTM': 'FANTOM',
    'MEMEFI': 'MEMEFI',
    'UXLINK': 'UXLINK',
    'SAHARA': 'SAHARA-AI',
    'PORT3': 'PORT3-NETWORK',
    'LYN': 'LYN-NETWORK',
    'ESP': 'ESPORTS',
    'POWER': 'POWER',
    'ARC': 'ARC',
    'ASTER': 'ASTER',
    'SIREN': 'SIREN',
    'HIPPO': 'SUI-HIPPO',
    'LEVER': 'LEVER-NETWORK',
};

const getStoredMap = (key: string): Record<string, any> => {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
};

const MISSING_ICONS = getStoredMap(MISSING_CACHE_KEY);
const SUCCESSFUL_SOURCES = getStoredMap(SUCCESS_CACHE_KEY);

const saveToCache = (cacheKey: string, symbol: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
        const current = getStoredMap(cacheKey);
        current[symbol] = value;
        localStorage.setItem(cacheKey, JSON.stringify(current));
    } catch (e) { /* ignore */ }
};

export default function CoinIcon({ symbol, size = 32, className = '' }: CoinIconProps) {
    const rawBase = symbol.split('/')[0].split('-')[0].split('USDT')[0].toUpperCase();
    let cleanSymbol = rawBase;
    if (rawBase !== '1INCH' && /^(1000|100|10)/.test(rawBase)) {
        cleanSymbol = rawBase.replace(/^(1000|100|10)/, '');
    }
    const baseSymbol = (SYMBOL_MAP[cleanSymbol] || cleanSymbol).toLowerCase();

    // Start from the last known successful source for this coin, or 0
    const [srcIndex, setSrcIndex] = useState(
        MISSING_ICONS[baseSymbol] ? 99 : (SUCCESSFUL_SOURCES[baseSymbol] ?? 0)
    );
    const [isLoaded, setIsLoaded] = useState(false);

    let sources = [
        // High Fidelity / Official Exchange Sources Only
        `https://www.binance.com/base/image/coin/${baseSymbol.toUpperCase()}.png`,
        `https://bin.bnbstatic.com/static/images/home/asset-logo/${baseSymbol.toUpperCase()}.png`,
        `https://cryptologos.cc/logos/${baseSymbol.toLowerCase()}-${baseSymbol.toLowerCase()}-logo.png`,
        `https://assets.coincap.io/assets/icons/${baseSymbol.toLowerCase()}@2x.png`,
        `https://otc-mexc.oss-cn-beijing.aliyuncs.com/coin/${baseSymbol.toUpperCase()}.png`,
        `https://static.okx.com/cdn/oksupport/asset/currency/${baseSymbol.toLowerCase()}.png`,
        `https://s3.ap-northeast-1.amazonaws.com/bybit-static/token/icon/${baseSymbol.toLowerCase()}.png`,
        `https://gimg2.gateimg.com/coin_icon/64/${baseSymbol.toLowerCase()}.png`,
        `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${baseSymbol.toLowerCase()}.png`,
        `https://static.crypto.com/token/icons/${baseSymbol.toLowerCase()}/color_icon.png`,
    ];

    // If we have an exact, hardcoded official reference URL, inject it as the #1 choice
    const explicitMapKey = Object.keys(HARD_URL_MAP).find(k => k === cleanSymbol || k.toLowerCase() === baseSymbol);
    if (explicitMapKey) {
        sources = [HARD_URL_MAP[explicitMapKey], ...sources];
    }

    const showFallback = srcIndex >= sources.length;

    if (showFallback) {
        return <FallbackIcon baseSymbol={baseSymbol.toUpperCase()} size={size} />;
    }

    return (
        <div
            className={`rounded-full overflow-hidden bg-secondary/10 flex items-center justify-center shrink-0 relative ${className}`}
            style={{ width: size, height: size }}
        >
            {/* Always show Fallback behind the image while loading to avoid "empty" states */}
            {!isLoaded && (
                <div className="absolute inset-0">
                    <FallbackIcon baseSymbol={baseSymbol.toUpperCase()} size={size} />
                </div>
            )}

            <img
                src={sources[srcIndex]}
                alt={`${symbol} icon`}
                width={size}
                height={size}
                className={`w-full h-full object-contain p-0.5 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => {
                    setIsLoaded(true);
                    // Remember this working source for next time!
                    if (srcIndex !== SUCCESSFUL_SOURCES[baseSymbol]) {
                        saveToCache(SUCCESS_CACHE_KEY, baseSymbol, srcIndex);
                    }
                }}
                onError={() => {
                    const next = srcIndex + 1;
                    if (next >= sources.length) {
                        saveToCache(MISSING_CACHE_KEY, baseSymbol, true);
                    }
                    setSrcIndex(next);
                }}
            />
        </div>
    );
}

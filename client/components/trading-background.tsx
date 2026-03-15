import React from 'react';

// Organized columns of bright, high-quality cryptocurrency & trading imagery for the masonry grid
const IMAGE_COLUMNS = [
    [
        "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1622630998477-20b41cd190a0?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=600"
    ],
    [
        "https://images.unsplash.com/photo-1605792657360-39baa1b5ea38?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1624996379697-f01d168b1a52?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600"
    ],
    [
        "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1641580529558-a96c78c8be37?auto=format&fit=crop&q=80&w=600"
    ],
    [
        "https://images.unsplash.com/photo-1609554496796-c345a5335ceb?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1629339942248-45d4b10c8c2f?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&q=80&w=600"
    ],
    [
        "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1622630998477-20b41cd190a0?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=600"
    ],
];

export default function TradingBackground({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4 font-sans selection:bg-[#2962ff] selection:text-white relative overflow-hidden">

            {/* The Skewed Canvas wrapper - Fully vibrant and bright */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                <div
                    className="flex gap-4 sm:gap-6 min-w-max animate-[slowPan_60s_linear_infinite]"
                    style={{ transform: "rotate(-12deg) scale(1.4) translateY(-10%)" }}
                >
                    {IMAGE_COLUMNS.map((col, colIndex) => (
                        <div key={colIndex} className={`flex flex-col gap-4 sm:gap-6 w-[220px] sm:w-[280px] md:w-[320px] ${colIndex % 2 === 0 ? '-translate-y-16' : 'translate-y-8'}`}>
                            {col.map((imgUrl, imgIndex) => (
                                <div
                                    key={imgIndex}
                                    className="w-full h-[280px] sm:h-[340px] md:h-[400px] rounded-2xl sm:rounded-[24px] overflow-hidden shadow-md relative bg-white"
                                >
                                    <img
                                        src={imgUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Keyframes for slow pan */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slowPan {
                    0% { transform: rotate(-12deg) scale(1.4) translateY(0%); }
                    50% { transform: rotate(-12deg) scale(1.4) translateY(-15%); }
                    100% { transform: rotate(-12deg) scale(1.4) translateY(0%); }
                }
            `}} />

            {/* Subtle top/center gradient to ensure logo and outer text visibility if they are dark */}
            <div className="absolute top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-white/90 to-transparent z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-[20vh] bg-gradient-to-t from-white/90 to-transparent z-0 pointer-events-none"></div>

            {/* Main Interactive Child Content */}
            <div className="relative z-10 w-full flex flex-col items-center">
                {children}
            </div>
        </div>
    );
}

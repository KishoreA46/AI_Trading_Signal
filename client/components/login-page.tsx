import React, { useState } from 'react';
import { Bot, ArrowRight } from 'lucide-react';
import TradingBackground from '@/components/trading-background';

interface LoginPageProps {
    onLogin: () => void;
    onSignupClick: () => void;
}

export default function LoginPage({ onLogin, onSignupClick }: LoginPageProps) {
    const [email, setEmail] = useState('');
    const [isError, setIsError] = useState(false);

    const validateEmail = (email: string) => {
        return String(email)
            .toLowerCase()
            .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !validateEmail(email)) {
            setIsError(true);
            return;
        }
        onLogin();
    };

    return (
        <TradingBackground>
            <div className="w-full max-w-[420px] flex flex-col items-center">

                {/* Logo Section */}
                <div className="mb-6 flex flex-col items-center">
                    <div className="relative w-[3.25rem] h-[3.25rem] bg-[#2962ff] rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300">
                        <Bot className="w-7 h-7 text-white" />
                    </div>
                </div>

                {/* Main White Card */}
                <div className="bg-white w-full rounded-[14px] p-8 shadow-2xl relative">
                    <div className="mb-5 text-left">
                        <h1 className="text-[20px] font-bold text-[#111213] tracking-tight mb-0.5">
                            Log in
                        </h1>
                        <p className="text-[#5c5f62] text-[13.5px] font-normal">
                            Continue to CryptoAI
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-[14px]">
                        <div className="space-y-1.5 text-left">
                            <label className="text-[12.5px] font-normal text-[#111213]">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (isError) setIsError(false);
                                }}
                                className={`w-full h-[40px] border rounded-[6px] px-3.5 text-[#111213] focus:outline-none focus:ring-[1px] transition-all text-[13.5px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] ${isError
                                    ? 'bg-[#fae9e9] border-[#d82c0d] focus:border-[#d82c0d] focus:ring-[#d82c0d]'
                                    : 'bg-white border-[#c9cccf] focus:border-black focus:ring-black'
                                    }`}
                            />
                            {isError && (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px] text-[#d82c0d] shrink-0"><path fillRule="evenodd" clipRule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm-1-11a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V5zm1 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="currentColor" /></svg>
                                    <span className="text-[#d82c0d] text-[13px] font-normal">Enter a valid email address</span>
                                </div>
                            )}
                        </div>

                        <div className="relative pt-1">
                            {isError && (
                                <div className="absolute -top-[12px] right-2 bg-[#d8ebfc] text-[#0a66c2] text-[11.5px] font-medium px-2 py-0.5 rounded-full border border-[#b5d1f0] z-10 shadow-sm pointer-events-none">
                                    Last used
                                </div>
                            )}
                            <button
                                type="submit"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (!email || !validateEmail(email)) {
                                        setIsError(true);
                                        return;
                                    }
                                    onLogin();
                                }}
                                className="w-full h-[42px] rounded-[6px] bg-[#1a1a1a] hover:bg-black text-white font-semibold text-[13.5px] transition-all flex items-center justify-center shadow-sm cursor-pointer"
                            >
                                Continue with email
                            </button>
                        </div>
                    </form>

                    <div className="my-[20px] flex items-center gap-3">
                        <div className="flex-1 h-[1px] bg-[#e1e3e5]"></div>
                        <span className="text-[#6d7175] text-[12px] font-normal">or</span>
                        <div className="flex-1 h-[1px] bg-[#e1e3e5]"></div>
                    </div>

                    <div className="space-y-3">
                        {/* Passkey Button */}
                        <button className="w-full h-[42px] rounded-[6px] bg-[#f2f4f6] hover:bg-[#e8ecef] text-[#202223] font-normal text-[13.5px] transition-colors flex items-center justify-center gap-2.5 shadow-sm shadow-[#f4f6f8]/50 outline-none focus:ring-2 focus:ring-[#2962ff]/30">
                            {/* SVG for Passkey (Person with a key) */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 21V19C6 17.8954 6.89543 17 8 17H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M21 15.5C21 16.8807 19.8807 18 18.5 18C17.9048 18 17.3582 17.7925 16.9238 17.443L15.228 19.0838C15.1506 19.1587 15.0483 19.2023 14.9392 19.2023H13.6C13.2686 19.2023 13 18.9337 13 18.6023V17.2631C13 17.154 13.0436 17.0516 13.1185 16.9742L14.621 15.422C14.6693 15.3721 14.7156 15.3243 14.7595 15.2783C14.41 14.8439 14.2025 14.2974 14.2025 13.7022C14.2025 12.3216 15.3216 11.2025 16.7022 11.2025C18.0828 11.2025 19.2023 12.3216 19.2023 13.7022Z" fill="white" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="17.6" cy="14.6" r="0.75" fill="currentColor" />
                            </svg>
                            Sign in with passkey
                        </button>

                        {/* 3 Inline Buttons Block */}
                        <div className="flex gap-3">
                            {/* Apple Button */}
                            <button className="flex-1 h-[42px] rounded-[6px] bg-[#f2f4f6] hover:bg-[#e8ecef] transition-colors flex items-center justify-center outline-none focus:ring-2 focus:ring-[#2962ff]/30">
                                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-black" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.53.84 3.24.84.7 0 2.14-1.01 3.73-1.01 1.35.03 2.59.54 3.48 1.4-3.05 1.76-2.58 6.09.28 7.34-.68 1.71-1.63 3.4-2.73 4.4z" />
                                    <path d="M12.03 7.25c-.15-2.23 1.66-4.04 3.74-4.25.32 2.3-1.72 4.19-3.74 4.25z" />
                                </svg>
                            </button>

                            {/* Facebook Button */}
                            <button className="flex-1 h-[42px] rounded-[6px] bg-[#f2f4f6] hover:bg-[#e8ecef] transition-colors flex items-center justify-center outline-none focus:ring-2 focus:ring-[#2962ff]/30">
                                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-[#1877F2]" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </button>

                            {/* Google Button */}
                            <button className="flex-1 h-[42px] rounded-[6px] bg-[#f2f4f6] hover:bg-[#e8ecef] transition-colors flex items-center justify-center outline-none focus:ring-2 focus:ring-[#2962ff]/30">
                                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Footer text inside card */}
                    <div className="mt-[28px]">
                        <p className="text-[#5c5f62] text-[13px] font-normal">
                            New to CryptoAI?{' '}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onSignupClick();
                                }}
                                className="text-[#0a66c2] font-medium hover:underline inline-flex items-center transition-colors outline-none focus:ring-2 focus:ring-[#2962ff]/30 rounded-sm"
                            >
                                Get started <ArrowRight className="w-[14px] h-[14px] ml-0.5" />
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer Links outside the card */}
                <div className="mt-8 flex flex-col items-center gap-3 relative z-10">
                    <a href="#" className="text-[#5c5f62] hover:underline hover:text-black transition-colors text-[13px] drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)] bg-white/40 px-3 py-1 rounded-full backdrop-blur-md">
                        Need Help?
                    </a>
                    <p className="text-[#5c5f62] text-[12.5px] cursor-default drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)] bg-white/40 px-3 py-1 rounded-full backdrop-blur-md">
                        By continuing, you agree to the <a href="#" className="text-[#3f3f46] hover:underline hover:text-black transition-colors font-medium">Terms</a> and <a href="#" className="text-[#3f3f46] hover:underline hover:text-black transition-colors font-medium">Privacy Policy</a>.
                    </p>
                </div>
            </div>
        </TradingBackground>
    );
}

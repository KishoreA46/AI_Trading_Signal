import React, { useState } from 'react';
import { Bot, Github } from 'lucide-react';
import TradingBackground from '@/components/trading-background';

interface SignupPageProps {
    onSignup: () => void;
    onLoginClick: () => void;
}

export default function SignupPage({ onSignup, onLoginClick }: SignupPageProps) {
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
        onSignup();
    };

    return (
        <TradingBackground>
            <div className="w-full max-w-[460px] flex flex-col items-center relative z-10">

                {/* Logo Section mapped to CryptoAI */}
                <div className="mb-6 flex flex-col items-center">
                    <div className="relative w-16 h-16 bg-[#2962ff] shadow-[#2962ff]/20 rounded-2xl flex items-center justify-center shadow-lg mb-8 cursor-pointer hover:scale-105 transition-transform duration-300">
                        <Bot className="w-8 h-8 text-white" />
                    </div>

                    <h1 className="text-[32px] font-semibold text-[#111213] tracking-tight leading-tight mb-2 cursor-default drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
                        Get started with CryptoAI
                    </h1>
                    <p className="text-[#5c5f62] text-[15px] font-normal text-center cursor-default drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]">
                        Join the next generation AI trading platform.<br />No credit card required.
                    </p>
                </div>

                {/* Main White Card Form */}
                <div className="bg-white w-full rounded-[20px] p-[28px] shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative group flex flex-col text-left">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (isError) setIsError(false);
                                }}
                                placeholder="Email address"
                                className={`w-full h-[54px] border rounded-[8px] px-4 text-[#111213] focus:outline-none focus:ring-[1.5px] transition-all placeholder:text-[#6b7280] text-[15px] ${isError
                                    ? 'bg-[#fae9e9] border-[#d82c0d] focus:border-[#d82c0d] focus:ring-[#d82c0d]'
                                    : 'bg-white border-[#d1d5db] focus:border-black focus:ring-black group-hover:border-gray-400'
                                    }`}
                            />
                            {isError && (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[14px] h-[14px] text-[#d82c0d] shrink-0"><path fillRule="evenodd" clipRule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm-1-11a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V5zm1 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" fill="currentColor" /></svg>
                                    <span className="text-[#d82c0d] text-[13.5px] font-normal">Enter a valid email address</span>
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
                                className="w-full h-[54px] rounded-[8px] bg-[#1a1a1a] hover:bg-black text-white font-semibold text-[15px] transition-all flex items-center justify-center cursor-pointer shadow-sm shadow-black/20"
                            >
                                Continue with email
                            </button>
                        </div>
                    </form>

                    <div className="my-[26px] flex items-center gap-4">
                        <div className="flex-1 h-[1px] bg-[#e5e7eb]"></div>
                        <span className="text-[#6b7280] text-[13px] font-normal">or</span>
                        <div className="flex-1 h-[1px] bg-[#e5e7eb]"></div>
                    </div>

                    <div className="space-y-3">
                        {/* Google Button */}
                        <button className="w-full h-[54px] rounded-[8px] bg-[#f4f6f8] hover:bg-[#ebedf0] text-[#202223] font-medium text-[15px] transition-colors flex items-center justify-center relative shadow-sm shadow-[#f4f6f8]/50 outline-none focus:ring-2 focus:ring-[#2962ff]/30">
                            <div className="absolute left-4 flex items-center h-full">
                                <svg viewBox="0 0 24 24" className="w-[20px] h-[20px]" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            </div>
                            Continue with Google
                        </button>

                        {/* Apple Button */}
                        <button className="w-full h-[54px] rounded-[8px] bg-[#f4f6f8] hover:bg-[#ebedf0] text-[#202223] font-medium text-[15px] transition-colors flex items-center justify-center relative shadow-sm shadow-[#f4f6f8]/50 outline-none focus:ring-2 focus:ring-[#2962ff]/30">
                            <div className="absolute left-4 flex items-center h-full">
                                <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] text-black" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.53.84 3.24.84.7 0 2.14-1.01 3.73-1.01 1.35.03 2.59.54 3.48 1.4-3.05 1.76-2.58 6.09.28 7.34-.68 1.71-1.63 3.4-2.73 4.4z" />
                                    <path d="M12.03 7.25c-.15-2.23 1.66-4.04 3.74-4.25.32 2.3-1.72 4.19-3.74 4.25z" />
                                </svg>
                            </div>
                            Continue with Apple
                        </button>

                        {/* GitHub Button */}
                        <button className="w-full h-[54px] rounded-[8px] bg-[#f4f6f8] hover:bg-[#ebedf0] text-[#202223] font-medium text-[15px] transition-colors flex items-center justify-center relative shadow-sm shadow-[#f4f6f8]/50 outline-none focus:ring-2 focus:ring-[#2962ff]/30">
                            <div className="absolute left-4 flex items-center h-full">
                                <Github className="w-[20px] h-[20px] text-black" />
                            </div>
                            Continue with GitHub
                        </button>
                    </div>

                    <div className="mt-7 text-center">
                        <p className="text-[#5c5f62] text-[13.5px] font-normal">
                            Already have an account?{' '}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onLoginClick();
                                }}
                                className="text-black font-semibold hover:underline outline-none focus:ring-2 focus:ring-[#2962ff]/30 rounded-sm"
                            >
                                Log in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </TradingBackground>
    );
}

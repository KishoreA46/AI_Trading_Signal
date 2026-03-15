

import { useState, useEffect, useRef, useCallback } from 'react';
import { marketAPI } from '@/lib/api';

export interface Kline {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    isFinal?: boolean;
}

const BASE_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_BASE_URL = BASE_URL.replace(/^http/, 'ws');

export function useMarketData(symbol: string, timeframe: string) {
    const [klines, setKlines] = useState<Kline[]>([]);
    const [latestTick, setLatestTick] = useState<Kline | null>(null);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef<WebSocket | null>(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        // Clear klines to avoid showing old data during timeframe switch
        setKlines([]);
        setLatestTick(null);

        try {
            // Request 500 to respect Binance max limit of 1000
            const data = await marketAPI.getKlines(symbol, timeframe, 500);
            setKlines(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch history:', error);
            setLoading(false);
        }
    }, [symbol, timeframe]);

    useEffect(() => {
        // 1. Fetch historical data on symbol/timeframe change
        fetchHistory();

        let isMounted = true;
        const formattedSymbol = symbol.replace('/', '-');
        const wsUrl = `${WS_BASE_URL}/ws/klines/${formattedSymbol}/${timeframe}`;

        const connect = () => {
            if (!isMounted) return;

            // Log connection attempt
            console.log(`[useMarketData] Connecting to: ${wsUrl}`);
            const ws = new WebSocket(wsUrl);
            socketRef.current = ws;

            ws.onmessage = (event) => {
                if (!isMounted) return;
                try {
                    const data = JSON.parse(event.data);
                    setLatestTick(data);
                } catch (e) {
                    console.error('[useMarketData] Failed to parse message:', e);
                }
            };

            ws.onclose = (event) => {
                if (isMounted) {
                    // Avoid reconnecting on normal close codes if possible, 
                    // but for market data we usually want to try again
                    console.log(`[useMarketData] Connection closed (${event.code}). Reconnecting...`);
                    setTimeout(() => {
                        if (isMounted) connect();
                    }, 3000);
                }
            };

            ws.onerror = (err) => {
                if (isMounted) {
                    console.error('[useMarketData] WebSocket error:', err);
                }
                // ws.close() will trigger onclose reconnect logic
                ws.close();
            };
        };

        connect();

        return () => {
            isMounted = false;
            if (socketRef.current) {
                const socket = socketRef.current;
                // Avoid closing if still connecting to prevent console noise.
                // The browser will clean up the pending connection eventually,
                // and our isMounted checks prevent state updates.
                if (socket.readyState === WebSocket.OPEN) {
                    socket.close();
                }
            }
        };
    }, [symbol, timeframe, fetchHistory]);

    return { klines, latestTick, loading, refresh: fetchHistory };
}

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, Time, CandlestickSeries, HistogramSeries, LineSeries, ColorType } from 'lightweight-charts';

export interface IndicatorsState {
    ema20: boolean;
    ema50: boolean;
    ema200: boolean;
}

interface PriceChartProps {
    data: any[];
    latestTick?: any;
    theme?: 'light' | 'dark';
    indicators?: IndicatorsState;
    signal?: any;
    activeTrade?: any;
}

function calculateEMA(data: any[], period: number) {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    let ema = [];

    // Initial SMA for the first EMA point
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += (data[i].close || data[i].value);
    }
    let prevEma = sum / period;

    // TradingView expects time as a unix timestamp in seconds (or string like "2019-04-11")
    ema.push({ time: data[period - 1].time as Time, value: Number(prevEma.toFixed(2)) });

    for (let i = period; i < data.length; i++) {
        const val = (data[i].close || data[i].value);
        const currentEma = (val - prevEma) * k + prevEma;
        ema.push({ time: data[i].time as Time, value: Number(currentEma.toFixed(2)) });
        prevEma = currentEma;
    }
    return ema;
}

const PriceChart = React.memo(({
    data,
    latestTick,
    theme = 'dark',
    indicators = { ema20: false, ema50: false, ema200: false },
    signal,
    activeTrade
}: PriceChartProps) => {

    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const ema20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const ema50SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const ema200SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

    // Initial Chart Creation
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: theme === 'dark' ? '#94a3b8' : '#64748b',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
            },
            rightPriceScale: {
                borderColor: theme === 'dark' ? '#334155' : '#cbd5e1',
                autoScale: true,
            },
            crosshair: {
                mode: 1, // Normal crosshair
            },
        });

        // Add Main Candlestick Series
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        // Add Volume Series
        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // Set as an overlay
        });

        // Configure volume scale so it doesn't overlap candles too much
        chart.priceScale('').applyOptions({
            scaleMargins: {
                top: 0.8, // leave top 80% for candles
                bottom: 0,
            },
        });

        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumeSeries;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        // Initial force resize
        setTimeout(handleResize, 10);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []); // Only rebuild chart entirely if container unmounts

    // Theme Update
    useEffect(() => {
        if (!chartRef.current) return;
        chartRef.current.applyOptions({
            layout: {
                textColor: theme === 'dark' ? '#94a3b8' : '#64748b',
            },
            grid: {
                vertLines: { color: theme === 'dark' ? '#1e293b' : '#e2e8f0' },
                horzLines: { color: theme === 'dark' ? '#1e293b' : '#e2e8f0' },
            },
            timeScale: { borderColor: theme === 'dark' ? '#334155' : '#cbd5e1' },
            rightPriceScale: { borderColor: theme === 'dark' ? '#334155' : '#cbd5e1' },
        });
    }, [theme]);

    // Data Update (Candles & Volume)
    useEffect(() => {
        if (!chartRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current || !data) return;

        // Process data for TV
        const formattedData = data.map(d => ({
            time: d.time as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
        }));

        const formattedVolume = data.map(d => ({
            time: d.time as Time,
            value: d.volume || 0,
            color: d.close >= d.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
        }));

        candlestickSeriesRef.current.setData(formattedData);
        volumeSeriesRef.current.setData(formattedVolume);

        // Add live tick
        if (latestTick) {
            candlestickSeriesRef.current.update({
                time: latestTick.time as Time,
                open: latestTick.open,
                high: latestTick.high,
                low: latestTick.low,
                close: latestTick.close,
            });
            volumeSeriesRef.current.update({
                time: latestTick.time as Time,
                value: latestTick.volume || 0,
                color: latestTick.close >= latestTick.open ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
            });
        }

    }, [data, latestTick]);

    // Indicators Update
    useEffect(() => {
        if (!chartRef.current || !data) return;

        // Manage EMA 20
        if (indicators.ema20) {
            if (!ema20SeriesRef.current) {
                ema20SeriesRef.current = chartRef.current.addSeries(LineSeries, {
                    color: '#3b82f6', // blue
                    lineWidth: 1,
                    crosshairMarkerVisible: false,
                    priceLineVisible: false,
                });
            }
            ema20SeriesRef.current.setData(calculateEMA(data, 20));
        } else if (ema20SeriesRef.current) {
            chartRef.current.removeSeries(ema20SeriesRef.current);
            ema20SeriesRef.current = null;
        }

        // Manage EMA 50
        if (indicators.ema50) {
            if (!ema50SeriesRef.current) {
                ema50SeriesRef.current = chartRef.current.addSeries(LineSeries, {
                    color: '#eab308', // yellow
                    lineWidth: 2,
                    crosshairMarkerVisible: false,
                    priceLineVisible: false,
                });
            }
            ema50SeriesRef.current.setData(calculateEMA(data, 50));
        } else if (ema50SeriesRef.current) {
            chartRef.current.removeSeries(ema50SeriesRef.current);
            ema50SeriesRef.current = null;
        }

        // Manage EMA 200
        if (indicators.ema200) {
            if (!ema200SeriesRef.current) {
                ema200SeriesRef.current = chartRef.current.addSeries(LineSeries, {
                    color: '#a855f7', // purple
                    lineWidth: 2,
                    crosshairMarkerVisible: false,
                    priceLineVisible: false,
                });
            }
            ema200SeriesRef.current.setData(calculateEMA(data, 200));
        } else if (ema200SeriesRef.current) {
            chartRef.current.removeSeries(ema200SeriesRef.current);
            ema200SeriesRef.current = null;
        }

    }, [data, indicators]);

    // Markers & Price Lines (Signals / Trades)
    useEffect(() => {
        if (!candlestickSeriesRef.current || !data.length) return;

        const series = candlestickSeriesRef.current;
        const markers: any[] = [];

        // Remove old price lines first
        // TV doesn't have an easy "removeAllPriceLines" method, so we should technically keep references,
        // but for a simple re-write, we can just clear markers on the series.
        // Price lines aren't fully robust here without ref tracking, but markers are easy.

        if (signal) {
            const lastCandle = data[data.length - 1];
            markers.push({
                time: lastCandle.time as Time,
                position: signal.type === 'BUY' ? 'belowBar' : 'aboveBar',
                color: signal.type === 'BUY' ? '#22c55e' : '#ef4444',
                shape: signal.type === 'BUY' ? 'arrowUp' : 'arrowDown',
                text: `${signal.type}`,
            });
        }

        // Apply markers correctly on generic series via series.options() or setMarkers
        try {
            // Check if setMarkers is available, otherwise use applyOptions if on v5
            if (typeof (series as any).setMarkers === 'function') {
                (series as any).setMarkers(markers);
            }
        } catch (e) {
            console.error(e);
        }

    }, [data, signal, activeTrade]);

    return (
        <div ref={chartContainerRef} className="w-full h-full min-h-[380px]" />
    );
});

PriceChart.displayName = 'PriceChart';
export default PriceChart;

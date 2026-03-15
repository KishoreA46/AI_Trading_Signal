/**
 * API utility for communicating with the Python backend
 */

const BASE_URL = import.meta.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `API Error: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch (e) {
        // Fallback to status text if JSON parsing fails
      }
      throw new APIError(response.status, errorMessage);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    console.error('[v0] API request failed:', error);
    throw new Error(`Failed to fetch ${endpoint}`);
  }
}

// Signals API
export const signalsAPI = {
  getLatest: (timeframe: string = '1h') => request<Signal[]>(`/api/signals/latest?timeframe=${timeframe}`),
  getMock: () => request<Signal[]>('/api/signals/mock'),
  getBySymbol: (symbol: string, refresh: boolean = false) =>
    request<Signal>(`/api/signals/symbol/${symbol.replace('/', '-')}?refresh=${refresh}`),
  getHistory: (limit: number = 50) =>
    request(`/api/signals/history?limit=${limit}`),
};

// Trading API
export const tradingAPI = {
  createTrade: (trade: any) =>
    request('/api/trades', { method: 'POST', body: JSON.stringify(trade) }),
  getTrades: (status?: 'OPEN' | 'CLOSED') =>
    request(`/api/trades${status ? `?status=${status}` : ''}`),
  closeTrade: (tradeId: string, exitPrice: number, quantity?: number) =>
    request(`/api/trades/${tradeId}/close`, {
      method: 'POST',
      body: JSON.stringify({ exitPrice, quantity }),
    }),
  getStats: () => request('/api/trades/stats'),
};

// Performance API
export const performanceAPI = {
  getSummary: () => request<any>('/api/performance/summary'),
  getPnLHistory: () => request<any[]>('/api/performance/history'),
  getMetrics: () => request('/api/performance/metrics'),
  getSettings: () => request<any>('/api/portfolio/settings'),
  updateSettings: (settings: { initialCapital: number }) =>
    request<any>('/api/portfolio/settings', { method: 'POST', body: JSON.stringify(settings) }),
  resetPortfolio: () => request<any>('/api/portfolio/reset', { method: 'POST' }),
  allocateCapital: (symbol: string, amount: number) =>
    request<any>('/api/portfolio/allocate', { method: 'POST', body: JSON.stringify({ symbol, amount }) }),
};

// Watchlist API
export const watchlistAPI = {
  getAll: () => request<string[]>('/api/watchlist'),
  add: (symbol: string) => request(`/api/watchlist/${symbol.replace('/', '-')}`, { method: 'POST' }),
  remove: (symbol: string) => request(`/api/watchlist/${symbol.replace('/', '-')}`, { method: 'DELETE' }),
};

// Alerts API
export const alertsAPI = {
  create: (alert: any) =>
    request('/api/alerts', { method: 'POST', body: JSON.stringify(alert) }),
  getAll: () => request<any[]>('/api/alerts'),
  delete: (alertId: string) =>
    request(`/api/alerts/${alertId}`, { method: 'DELETE' }),
  toggle: (alertId: string, isActive: boolean) =>
    request(`/api/alerts/${alertId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
};

// Notifications API (Aggregated from Alerts and Trades)
export const notificationsAPI = {
  getAll: async () => {
    try {
      const [trades, alerts] = await Promise.all([
        tradingAPI.getTrades('CLOSED'),
        alertsAPI.getAll()
      ]);

      const tradeNotifications = (trades as any[]).map(t => ({
        id: `trade-${t.id}`,
        title: 'Trade Closed',
        message: `${t.symbol} ${t.side} closed at ${t.exitPrice}. PnL: ${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)}`,
        time: new Date(t.exitTime).getTime(),
        read: false,
        type: 'trade'
      }));

      const alertNotifications = (alerts as any[]).filter(a => a.status === 'TRIGGERED').map(a => ({
        id: `alert-${a.id}`,
        title: 'Price Alert',
        message: `${a.symbol} ${a.condition} ${a.targetPrice} was triggered at ${a.triggerPrice}`,
        time: new Date(a.triggeredAt).getTime(),
        read: false,
        type: 'alert'
      }));

      return [...tradeNotifications, ...alertNotifications].sort((a, b) => b.time - a.time);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }
};

// Settings API
export const settingsAPI = {
  get: () => request('/api/settings'),
  update: (settings: any) =>
    request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

// Signal Interface
export interface Signal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'FLAT';
  strength: number;
  confidence: number;
  indicators: string[];
  timestamp: string;
  price: number;
  entry: number;
  stop_loss: number;
  take_profit: number;
  take_profit2?: number | null;
  take_profit3?: number | null;
  volume?: number;
  accuracy?: number;
}

// Market API
export interface MarketCoin {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume: number;
  quoteVolume: number;
}

export interface MarketStats {
  market_cap: number;
  market_cap_change_24h: number;
  fdv: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  volume_24h: number;
  volume_change_24h: number;
  market_cap_dominance: number;
}

const CACHE = {
  topCoins: { data: null as MarketCoin[] | null, timestamp: 0 }
};

export const marketAPI = {
  getCachedTopCoins: () => {
    if (CACHE.topCoins.data && Date.now() - CACHE.topCoins.timestamp < 15000) {
      return CACHE.topCoins.data;
    }
    return null;
  },
  getTopCoins: async () => {
    if (CACHE.topCoins.data && Date.now() - CACHE.topCoins.timestamp < 15000) {
      return CACHE.topCoins.data;
    }
    const data = await request<MarketCoin[]>('/api/market');
    CACHE.topCoins.data = data;
    CACHE.topCoins.timestamp = Date.now();
    return data;
  },
  getTicker: (symbol: string) =>
    request<MarketCoin>(`/api/market/${symbol.replace('/', '-')}`),
  getKlines: (symbol: string, timeframe: string = '1h', limit: number = 1000) =>
    request<any[]>(`/api/klines/${symbol.replace('/', '-')}?timeframe=${timeframe}&limit=${limit}`),
  getOrderBook: (symbol: string) =>
    request<any>(`/api/orderbook/${symbol.replace('/', '-')}`),
  getRecentTrades: (symbol: string) =>
    request<any[]>(`/api/trades/recent/${symbol.replace('/', '-')}`),
  getNews: (symbol: string) =>
    request<any[]>(`/api/news/${symbol.replace('/', '-')}`),
  getGeneralNews: () =>
    request<any[]>('/api/news'),
  getStats: (symbol: string) =>
    request<MarketStats>(`/api/market/${symbol.replace('/', '-')}/stats`),
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await request('/api/health');
    return true;
  } catch {
    return false;
  }
};

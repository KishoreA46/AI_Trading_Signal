'use client';

import { useState } from 'react';
import DashboardNav from '@/components/dashboard-nav';
import DashboardPage from '@/components/dashboard-page';
import MarketPage from '@/components/market-page';
import PortfolioPage from '@/components/portfolio-page';
import TradeHistoryPage from '@/components/trade-history-page';
import SettingsPanel from '@/components/settings-panel';
import WatchlistPage from '@/components/watchlist-page';
import CoinDetailView from '@/components/coin-detail-view';
import NewsPage from '@/components/news-page';

export default function Home() {
  const [activeTab] = useState<'dashboard' | 'market' | 'watchlist' | 'history' | 'news' | 'settings' | 'portfolio' | 'trading' | 'alerts'>('dashboard'); // Updated type
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const [appearance, setAppearance] = useState({
    theme: 'dark',
    density: 'comfortable',
    colorAccent: '#f97316',
  });

  return (
    <div
      className={`flex h-screen bg-background text-foreground ${appearance.theme === 'dark' ? 'dark' : ''} ${appearance.density === 'compact' ? 'density-compact' : ''}`}
      style={{
        '--primary': appearance.colorAccent,
        '--sidebar-primary': appearance.colorAccent,
        '--accent': appearance.colorAccent,
        '--ring': appearance.colorAccent
      } as any}
    >
      {/* Sidebar Navigation */}
      <DashboardNav />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {selectedSymbol ? (
          <CoinDetailView
            symbol={selectedSymbol}
            onClose={() => setSelectedSymbol(null)}
          />
        ) : (
          <div className="flex-1 relative h-full">
            {activeTab === 'dashboard' && <DashboardPage onSelectCoin={setSelectedSymbol} />}
            {activeTab === 'market' && <MarketPage onSelectCoin={setSelectedSymbol} />}
            {activeTab === 'portfolio' && <PortfolioPage />}
            {activeTab === 'history' && <TradeHistoryPage />}
            {activeTab === 'news' && <NewsPage />}
            {activeTab === 'watchlist' && <WatchlistPage onSelectCoin={setSelectedSymbol} />}
            {activeTab === 'settings' && <SettingsPanel appearance={appearance} setAppearance={setAppearance} />}
          </div>
        )}
      </main>
    </div>
  );
}

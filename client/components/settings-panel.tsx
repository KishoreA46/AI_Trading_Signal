
import { useState, useEffect, useRef } from 'react';
import {
  Palette, Shield, Bell,
  LineChart, AlertTriangle, Trash2, RefreshCcw,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { settingsAPI, performanceAPI } from '@/lib/api';

interface SettingsPanelProps {
  appearance: {
    theme: string;
    density: string;
    colorAccent: string;
  };
  setAppearance: (appearance: any) => void;
}

export default function SettingsPanel({ appearance, setAppearance }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    maxPositionSize: 1000,
    maxDailyLoss: 2000,
    riskPerTrade: 2,
    leverage: 1,
    alertEmail: true,
    alertPush: false,
    alertSMS: false,
    defaultSymbol: 'BTC/USDT',
    timeframe: '4h',
  });

  const [activeCategory, setActiveCategory] = useState('appearance');
  const [isMobileDetail, setIsMobileDetail] = useState(false);
  const isInitialMount = useRef(true);
  const skipNextSave = useRef(false);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsAPI.get();
        if (data) {
          skipNextSave.current = true;
          setSettings(data as typeof settings);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Auto-save settings with debounce
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await settingsAPI.update(settings);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [settings]);

  const categories = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'risk', label: 'Risk Management', icon: Shield },
    { id: 'trading', label: 'Trading Preferences', icon: LineChart },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className={`border-b border-border bg-card/50 backdrop-blur-xl p-4 md:p-6 sticky top-0 z-10 shrink-0 ${isMobileDetail ? 'hidden md:block' : 'block'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between max-w-6xl mx-auto w-full gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Configure your trading environment</p>
          </div>

        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden max-w-6xl mx-auto w-full pb-20 md:pb-0">
        {/* Sidebar / Options List */}
        <div className={`
          w-full md:w-64 md:border-r border-border bg-card/30 p-4 md:space-y-2 overflow-y-auto shrink-0
          ${isMobileDetail ? 'hidden md:block' : 'block'}
        `}>
          <div className="space-y-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setIsMobileDetail(true);
                }}
                className={`
                  w-full flex items-center justify-between px-4 py-3.5 md:py-2 rounded-xl md:rounded-lg text-sm font-bold transition-all
                  ${activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm md:shadow-none'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground md:bg-transparent bg-secondary/20'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </div>
                <ChevronRight className="w-4 h-4 md:hidden opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className={`
          flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar
          ${!isMobileDetail ? 'hidden md:block' : 'block'}
        `}>
          {/* Back Button (Mobile Only) */}
          {isMobileDetail && (
            <button
              onClick={() => setIsMobileDetail(false)}
              className="md:hidden flex items-center gap-2 text-primary font-bold mb-6 active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>
          )}
          <div className="max-w-3xl space-y-12">
            {/* Appearance Section */}
            {activeCategory === 'appearance' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-6">
                  <Palette className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">Appearance Settings</h3>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 space-y-6 backdrop-blur-md">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-4">
                      Theme Mode
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {['Dark', 'Light', 'System'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setAppearance({ ...appearance, theme: t.toLowerCase() })}
                          className={`py-2.5 md:py-3 px-3 md:px-4 rounded-lg border text-xs md:text-sm font-bold transition-all ${appearance.theme === t.toLowerCase()
                            ? 'bg-primary border-primary text-primary-foreground scale-[1.02]'
                            : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/50'
                            }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-4">
                      Interface Density
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                      {['Comfortable', 'Compact'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setAppearance({ ...appearance, density: d.toLowerCase() })}
                          className={`flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-lg border text-xs md:text-sm font-bold transition-all ${appearance.density === d.toLowerCase()
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/50'
                            }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-4">
                      Accent Color
                    </label>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {['#E50914', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#facc15'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setAppearance({ ...appearance, colorAccent: color })}
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all ${appearance.colorAccent === color
                            ? 'border-foreground scale-110'
                            : 'border-transparent hover:scale-105'
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Risk Management Section */}
            {activeCategory === 'risk' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">Risk Management</h3>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Max Position Size ($)
                      </label>
                      <input
                        type="number"
                        value={settings.maxPositionSize}
                        onChange={(e) =>
                          setSettings({ ...settings, maxPositionSize: parseFloat(e.target.value) })
                        }
                        className="w-full bg-secondary text-foreground px-4 py-3 rounded border border-border focus:border-primary outline-none"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Maximum value per position</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Max Daily Loss ($)
                      </label>
                      <input
                        type="number"
                        value={settings.maxDailyLoss}
                        onChange={(e) =>
                          setSettings({ ...settings, maxDailyLoss: parseFloat(e.target.value) })
                        }
                        className="w-full bg-secondary text-foreground px-4 py-3 rounded border border-border focus:border-primary outline-none"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Stop trading when daily losses exceed this amount
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Risk Per Trade (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.riskPerTrade}
                        onChange={(e) =>
                          setSettings({ ...settings, riskPerTrade: parseFloat(e.target.value) })
                        }
                        className="w-full bg-secondary text-foreground px-4 py-3 rounded border border-border focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">
                        Leverage
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.leverage}
                        onChange={(e) =>
                          setSettings({ ...settings, leverage: parseFloat(e.target.value) })
                        }
                        className="w-full bg-secondary text-foreground px-4 py-3 rounded border border-border focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Trading Preferences Section */}
            {activeCategory === 'trading' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-6">
                  <LineChart className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">Trading Preferences</h3>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Default Symbol
                    </label>
                    <input
                      type="text"
                      value={settings.defaultSymbol}
                      onChange={(e) =>
                        setSettings({ ...settings, defaultSymbol: e.target.value })
                      }
                      className="w-full bg-secondary text-foreground px-4 py-3 rounded border border-border focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Preferred Timeframe
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['1m', '5m', '15m', '1h', '4h', '1d'].map(tf => (
                        <button
                          key={tf}
                          onClick={() => setSettings({ ...settings, timeframe: tf })}
                          className={`py-2 rounded-lg border font-medium text-sm transition-all ${settings.timeframe === tf
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-foreground hover:bg-secondary/80'
                            }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Notifications Section */}
            {activeCategory === 'notifications' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-6">
                  <Bell className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">Notification Settings</h3>
                </div>
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  {[
                    { id: 'alertEmail', label: 'Email Notifications', sub: 'Receive alerts via email' },
                    { id: 'alertPush', label: 'Push Notifications', sub: 'Receive browser push notifications' },
                    { id: 'alertSMS', label: 'SMS Notifications', sub: 'Receive alerts via SMS (Premium)', pro: true }
                  ].map((notif) => (
                    <label key={notif.id} className="flex items-center gap-3 cursor-pointer hover:bg-secondary/50 p-3 rounded transition-colors group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border border-border accent-primary"
                        checked={(settings as any)[notif.id]}
                        onChange={(e) => setSettings({ ...settings, [notif.id]: e.target.checked })}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{notif.label}</p>
                          {notif.pro && <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">Pro</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">{notif.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {/* Danger Zone Section */}
            {activeCategory === 'danger' && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-2 mb-6 text-red-500">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Danger Zone</h3>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                      <RefreshCcw className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-foreground mb-1">Reset Portfolio</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        This will permanently delete all trade history, reset your capital to $10,000,
                        and close any open simulated positions. This action cannot be undone.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to reset your entire portfolio? This will delete all trade history.')) {
                          try {
                            await performanceAPI.resetPortfolio();
                            alert('Portfolio reset successfully.');
                            window.location.reload();
                          } catch (error) {
                            alert('Failed to reset portfolio.');
                          }
                        }
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Reset Now
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

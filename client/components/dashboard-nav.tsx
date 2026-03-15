import { useState } from 'react';
import { BarChart3, Settings, Star, Briefcase, LayoutDashboard, History, Newspaper, LogOut, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface DashboardNavProps {
  isSidebarOpen?: boolean;
}

export default function DashboardNav({ isSidebarOpen = true }: DashboardNavProps) {
  const location = useLocation();
  let activeTab = location.pathname.substring(1).split('/')[0] || 'dashboard';

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // Keep the sidebar pointing to "market" if we're inside a coin detail view
  if (activeTab === 'coin') {
    activeTab = 'market';
  }

  // Removed: if (!isSidebarOpen) return null;
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'market', label: 'Market', icon: BarChart3 },
    { id: 'news', label: 'News Feed', icon: Newspaper },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'history', label: 'Trade History', icon: History },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`
      md:relative md:inset-0 z-50 shrink-0 transition-all duration-300
      md:flex md:flex-col
      ${isSidebarOpen ? 'md:w-60' : 'md:w-[68px]'} 
      bg-[#ebebeb] dark:bg-sidebar md:border-r border-[#d4d4d4] dark:border-sidebar-border
      fixed bottom-4 left-4 right-4 p-2 md:p-0 flex flex-row items-center justify-between
      rounded-[32px] md:rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] md:shadow-none
      top-auto md:top-0
    `}>
      {/* Space at top of sidebar */}
      <div className="hidden md:block h-3 shrink-0" />


      {/* Navigation */}
      <nav className={`
        flex-1 w-full
        md:px-3 md:space-y-2 md:overflow-visible
        flex flex-row md:flex-col items-center justify-around md:justify-start
        overflow-x-auto hide-scrollbar scroll-smooth space-x-1 md:space-x-0
      `}>

        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <Link
              key={id}
              to={`/${id}`}
              title={!isSidebarOpen ? label : ''}
              className={`
              relative flex items-center shrink-0
              md:w-full md:min-w-0 min-w-[68px] h-12 md:h-10
              ${isSidebarOpen
                  ? 'md:flex-row md:justify-start md:gap-4 md:px-3 md:py-2'
                  : 'md:flex-col md:justify-center md:px-0 md:py-2'
                } 
              flex-col justify-center gap-1
              rounded-[16px] md:rounded-md transition-all duration-200 group
              ${isActive
                  ? 'md:bg-transparent md:dark:bg-primary text-primary dark:text-primary-foreground font-bold'
                  : 'text-slate-600 dark:text-sidebar-foreground/60 hover:text-slate-900 dark:hover:text-white md:hover:bg-black/5 md:dark:hover:bg-sidebar-accent/50 font-bold'
                }
            `}
            >
              <div className={`flex items-center justify-center transition-transform duration-200`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-primary dark:text-primary-foreground' : 'text-slate-500 dark:text-sidebar-foreground/60 group-hover:text-slate-900 dark:group-hover:text-white'}`} fill="none" strokeWidth={3} />
              </div>

              <span className={`text-[10px] whitespace-nowrap md:whitespace-normal md:text-[15px] font-bold tracking-tight ${isSidebarOpen ? 'md:inline' : 'md:hidden'}`}>
                {label}
              </span>
            </Link>
          )
        })}

        {/* Mobile Logout Button */}
        <Link
          key="logout-mobile"
          to="#"
          onClick={() => setIsLogoutDialogOpen(true)}
          title={!isSidebarOpen ? "Logout" : ''}
          className={`
            relative flex items-center shrink-0
            md:hidden // Only visible on mobile
            min-w-[68px] h-12
            flex-col justify-center gap-1
            rounded-[16px] transition-all duration-200 group
            text-slate-600 dark:text-sidebar-foreground/60 hover:text-red-500 dark:hover:text-red-400 font-bold
          `}
        >
          <div className="flex items-center justify-center transition-transform duration-200">
            <LogOut className="w-6 h-6 text-slate-500 dark:text-sidebar-foreground/60 group-hover:text-red-500 dark:group-hover:text-red-400" fill="none" strokeWidth={3} />
          </div>
          <span className="text-[10px] whitespace-nowrap font-bold tracking-tight">
            Logout
          </span>
        </Link>

      </nav>

      <div className={`hidden md:flex flex-col w-full md:px-3 mt-auto mb-4 ${!isSidebarOpen ? 'items-center' : ''}`}>
        <button
          onClick={() => setIsLogoutDialogOpen(true)}
          title={!isSidebarOpen ? "Logout" : ''}
          className={`
            relative flex items-center shrink-0
            md:w-full md:min-w-0 h-10
            ${isSidebarOpen
              ? 'md:flex-row md:justify-start md:gap-4 md:px-3 md:py-2'
              : 'md:flex-col md:justify-center md:px-0 md:py-2'
            } 
            rounded-md transition-all duration-200 group
            text-slate-600 dark:text-sidebar-foreground/60 hover:text-red-500 dark:hover:text-red-400 md:hover:bg-red-500/5 font-bold
          `}
        >
          <div className="flex items-center justify-center transition-transform duration-200">
            <LogOut className="w-6 h-6 text-slate-500 dark:text-sidebar-foreground/60 group-hover:text-red-500 dark:group-hover:text-red-400" fill="none" strokeWidth={3} />
          </div>
          {isSidebarOpen && <span className="text-[15px] font-bold tracking-tight">Logout</span>}
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      {isLogoutDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsLogoutDialogOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-red-500" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">Confirm Logout</h3>
              <p className="text-muted-foreground text-sm">Do you want to Logout from your session?</p>
            </div>
            <div className="flex border-t border-border">
              <button
                onClick={() => setIsLogoutDialogOpen(false)}
                className="flex-1 py-4 text-sm font-bold text-muted-foreground hover:bg-secondary/50 transition-colors border-r border-border"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('User logged out');
                  setIsLogoutDialogOpen(false);
                }}
                className="flex-1 py-4 text-sm font-black text-red-500 hover:bg-red-500/5 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

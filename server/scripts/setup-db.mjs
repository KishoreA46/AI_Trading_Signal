import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const setupSQL = `
-- Settings table for user preferences
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_per_trade NUMERIC(5,2) DEFAULT 2.0,
  default_position_size NUMERIC(12,8) DEFAULT 1.0,
  alert_email VARCHAR(255),
  alerts_enabled BOOLEAN DEFAULT true,
  backend_api_key VARCHAR(255),
  backend_api_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Paper trades table
CREATE TABLE IF NOT EXISTS paper_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('LONG', 'SHORT')),
  entry_price NUMERIC(18,8) NOT NULL,
  exit_price NUMERIC(18,8),
  quantity NUMERIC(18,8) NOT NULL,
  entry_date TIMESTAMP DEFAULT now(),
  exit_date TIMESTAMP,
  status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
  pnl NUMERIC(18,8),
  pnl_percentage NUMERIC(8,4),
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Alerts table for signal history
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type VARCHAR(20) NOT NULL CHECK (signal_type IN ('BUY', 'SELL', 'HOLD')),
  symbol VARCHAR(20) NOT NULL,
  price NUMERIC(18,8),
  confidence NUMERIC(3,2),
  action_taken VARCHAR(20) CHECK (action_taken IN ('ACCEPTED', 'DISMISSED', 'PENDING')),
  action_timestamp TIMESTAMP,
  message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  entry_date TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for settings
CREATE POLICY "Users can view their own settings" ON settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for paper_trades
CREATE POLICY "Users can view their own trades" ON paper_trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" ON paper_trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" ON paper_trades
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for alerts
CREATE POLICY "Users can view their own alerts" ON alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts" ON alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for watchlist
CREATE POLICY "Users can view their own watchlist" ON watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchlist" ON watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlist" ON watchlist
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_paper_trades_user_status ON paper_trades(user_id, status);
CREATE INDEX idx_alerts_user_created ON alerts(user_id, created_at DESC);
CREATE INDEX idx_watchlist_user ON watchlist(user_id);
`;

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: setupSQL });
    
    if (error) {
      console.error('Error executing setup:', error);
      process.exit(1);
    }
    
    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
}

setupDatabase();

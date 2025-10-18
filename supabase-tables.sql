-- Email Queue Table
CREATE TABLE email_queue (
  id TEXT PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  template_id TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  sender_password TEXT,
  send_mode TEXT NOT NULL,
  scheduled_date TIMESTAMP,
  email_count INTEGER DEFAULT 0,
  entry_data JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  message TEXT
);

-- Email Templates Table
CREATE TABLE email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Processing Stats Table
CREATE TABLE email_processing_stats (
  id SERIAL PRIMARY KEY,
  total_processed INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  last_processing_time TIMESTAMP,
  session_processed INTEGER DEFAULT 0,
  session_failed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scheduled Emails Table
CREATE TABLE scheduled_emails (
  id TEXT PRIMARY KEY,
  email_data JSONB NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email Counters Table
CREATE TABLE email_counters (
  id SERIAL PRIMARY KEY,
  email_id INTEGER NOT NULL,
  direct_send_count INTEGER DEFAULT 0,
  scheduled_send_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Users Table (for sender configurations)
CREATE TABLE email_users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

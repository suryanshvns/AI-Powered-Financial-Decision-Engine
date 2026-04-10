CREATE TABLE IF NOT EXISTS user_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_rules_user_id ON user_rules (user_id);

ALTER TABLE predictions DROP CONSTRAINT IF EXISTS predictions_risk_level_check;
ALTER TABLE predictions
  ADD CONSTRAINT predictions_risk_level_check
  CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH'));

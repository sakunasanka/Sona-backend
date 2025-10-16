-- PHQ-9 Database Migration Script
-- Run this script in your PostgreSQL database to create the questionnaire_results table

-- Create the questionnaire_results table
CREATE TABLE IF NOT EXISTS questionnaire_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id INTEGER NOT NULL,
    questionnaire_type VARCHAR(10) NOT NULL DEFAULT 'PHQ9' CHECK (questionnaire_type IN ('PHQ9')),
    responses JSONB NOT NULL,
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 27),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('Minimal or none', 'Mild', 'Moderate', 'Moderately severe', 'Severe')),
    impact VARCHAR(100),
    has_item9_positive BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign key constraint (assuming users table exists)
    CONSTRAINT fk_questionnaire_results_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questionnaire_results_user_id 
    ON questionnaire_results(user_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_results_type 
    ON questionnaire_results(questionnaire_type);

CREATE INDEX IF NOT EXISTS idx_questionnaire_results_completed_at 
    ON questionnaire_results(completed_at);

CREATE INDEX IF NOT EXISTS idx_questionnaire_results_item9 
    ON questionnaire_results(has_item9_positive);

CREATE INDEX IF NOT EXISTS idx_questionnaire_results_composite 
    ON questionnaire_results(user_id, questionnaire_type, completed_at);

-- Create index on deleted_at for soft delete queries
CREATE INDEX IF NOT EXISTS idx_questionnaire_results_deleted_at 
    ON questionnaire_results(deleted_at);

-- Add updated_at trigger (optional, for automatic timestamp updates)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_questionnaire_results_updated_at
    BEFORE UPDATE ON questionnaire_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created successfully
\d questionnaire_results;

-- Show all indexes
\di questionnaire_results*;

COMMENT ON TABLE questionnaire_results IS 'Stores PHQ-9 questionnaire results for depression screening';
COMMENT ON COLUMN questionnaire_results.responses IS 'JSON array of 9 question responses with questionIndex and answer';
COMMENT ON COLUMN questionnaire_results.has_item9_positive IS 'Tracks if item 9 (suicidal ideation) was answered positively for risk monitoring';
COMMENT ON COLUMN questionnaire_results.deleted_at IS 'For soft deletion if needed';

-- Sample data for testing (optional)
-- INSERT INTO questionnaire_results (
--     user_id, 
--     responses, 
--     total_score, 
--     severity, 
--     impact, 
--     has_item9_positive, 
--     completed_at
-- ) VALUES (
--     1, -- Replace with actual user ID
--     '[
--         {"questionIndex": 0, "answer": 2},
--         {"questionIndex": 1, "answer": 1},
--         {"questionIndex": 2, "answer": 3},
--         {"questionIndex": 3, "answer": 2},
--         {"questionIndex": 4, "answer": 1},
--         {"questionIndex": 5, "answer": 2},
--         {"questionIndex": 6, "answer": 0},
--         {"questionIndex": 7, "answer": 1},
--         {"questionIndex": 8, "answer": 1}
--     ]'::jsonb,
--     13,
--     'Moderate',
--     'somewhat difficult',
--     true,
--     CURRENT_TIMESTAMP
-- );

SELECT 'PHQ-9 database migration completed successfully!' AS status;

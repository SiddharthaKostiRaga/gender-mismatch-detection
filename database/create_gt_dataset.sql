-- Create GT Dataset table for Ground Truth analysis
CREATE TABLE IF NOT EXISTS gt_dataset (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gender VARCHAR(50),
    findings TEXT,
    human_impression TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gt_dataset_gender ON gt_dataset(gender);

-- Enable Row Level Security (RLS)
ALTER TABLE gt_dataset ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access (for the POC)
DROP POLICY IF EXISTS "Allow anonymous read access to gt_dataset" ON gt_dataset;
CREATE POLICY "Allow anonymous read access to gt_dataset" ON gt_dataset
    FOR SELECT USING (true);

-- Create policy for service role access
DROP POLICY IF EXISTS "Allow service role full access to gt_dataset" ON gt_dataset;
CREATE POLICY "Allow service role full access to gt_dataset" ON gt_dataset
    FOR ALL USING (auth.role() = 'service_role');

-- Verify table creation
SELECT 'GT Dataset table created successfully' as status; 
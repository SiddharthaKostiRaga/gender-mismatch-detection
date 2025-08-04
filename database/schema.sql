-- Gender Mismatch Detection System Database Schema
-- For Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Keywords table
CREATE TABLE gender_keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    gender_type VARCHAR(10) NOT NULL CHECK (gender_type IN ('male', 'female')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('body_part', 'finding', 'lab_test')),
    subcategory VARCHAR(50) CHECK (subcategory IN ('pregnancy_related', 'non_pregnancy')),
    pregnancy_related BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exclusion patterns table
CREATE TABLE gender_exclusions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pattern_name VARCHAR(100) NOT NULL,
    regex_pattern TEXT NOT NULL,
    context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('healthcare_provider', 'communication', 'patient_reference')),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient reference keywords table
CREATE TABLE patient_reference_keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    keyword VARCHAR(50) NOT NULL,
    reference_type VARCHAR(20) NOT NULL CHECK (reference_type IN ('female', 'male')),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detection logs table
CREATE TABLE detection_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    report_id VARCHAR(100),
    patient_gender VARCHAR(10),
    patient_age INTEGER,
    results JSONB,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_gender_keywords_gender_type ON gender_keywords(gender_type);
CREATE INDEX idx_gender_keywords_enabled ON gender_keywords(enabled);
CREATE INDEX idx_gender_keywords_category ON gender_keywords(category);
CREATE INDEX idx_detection_logs_created_at ON detection_logs(created_at);
CREATE INDEX idx_detection_logs_patient_gender ON detection_logs(patient_gender);

-- Enable Row Level Security
ALTER TABLE gender_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE gender_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_reference_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Enable read access for all users" ON gender_keywords
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON gender_exclusions
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON patient_reference_keywords
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON detection_logs
    FOR INSERT WITH CHECK (true);

-- Insert male keywords
INSERT INTO gender_keywords (keyword, gender_type, category, subcategory) VALUES
('prostate', 'male', 'body_part', 'non_pregnancy'),
('prostatic', 'male', 'body_part', 'non_pregnancy'),
('testis', 'male', 'body_part', 'non_pregnancy'),
('testes', 'male', 'body_part', 'non_pregnancy'),
('testicular', 'male', 'body_part', 'non_pregnancy'),
('testicle', 'male', 'body_part', 'non_pregnancy'),
('testicles', 'male', 'body_part', 'non_pregnancy'),
('scrotum', 'male', 'body_part', 'non_pregnancy'),
('scrotal', 'male', 'body_part', 'non_pregnancy'),
('penis', 'male', 'body_part', 'non_pregnancy'),
('penile', 'male', 'body_part', 'non_pregnancy'),
('glans', 'male', 'body_part', 'non_pregnancy'),
('prepuce', 'male', 'body_part', 'non_pregnancy'),
('foreskin', 'male', 'body_part', 'non_pregnancy'),
('epididymis', 'male', 'body_part', 'non_pregnancy'),
('epididymal', 'male', 'body_part', 'non_pregnancy'),
('vas deferens', 'male', 'body_part', 'non_pregnancy'),
('seminal vesicle', 'male', 'body_part', 'non_pregnancy'),
('seminal vesicles', 'male', 'body_part', 'non_pregnancy'),
('spermatic cord', 'male', 'body_part', 'non_pregnancy'),
('BPH', 'male', 'finding', 'non_pregnancy'),
('prostatitis', 'male', 'finding', 'non_pregnancy'),
('cryptorchidism', 'male', 'finding', 'non_pregnancy'),
('hydrocele', 'male', 'finding', 'non_pregnancy'),
('varicocele', 'male', 'finding', 'non_pregnancy'),
('epididymitis', 'male', 'finding', 'non_pregnancy'),
('orchitis', 'male', 'finding', 'non_pregnancy'),
('priapism', 'male', 'finding', 'non_pregnancy'),
('gynecomastia', 'male', 'finding', 'non_pregnancy'),
('PSA', 'male', 'lab_test', 'non_pregnancy'),
('prostate specific antigen', 'male', 'lab_test', 'non_pregnancy'),
('prostate-specific antigen', 'male', 'lab_test', 'non_pregnancy'),
('free PSA', 'male', 'lab_test', 'non_pregnancy'),
('PSA ratio', 'male', 'lab_test', 'non_pregnancy'),
('semen analysis', 'male', 'lab_test', 'non_pregnancy'),
('sperm count', 'male', 'lab_test', 'non_pregnancy'),
('sperm concentration', 'male', 'lab_test', 'non_pregnancy'),
('sperm motility', 'male', 'lab_test', 'non_pregnancy'),
('sperm morphology', 'male', 'lab_test', 'non_pregnancy');

-- Insert female keywords
INSERT INTO gender_keywords (keyword, gender_type, category, subcategory, pregnancy_related) VALUES
('uterus', 'female', 'body_part', 'non_pregnancy', false),
('uterine', 'female', 'body_part', 'non_pregnancy', false),
('ovary', 'female', 'body_part', 'non_pregnancy', false),
('ovaries', 'female', 'body_part', 'non_pregnancy', false),
('ovarian', 'female', 'body_part', 'non_pregnancy', false),
('fallopian tube', 'female', 'body_part', 'non_pregnancy', false),
('fallopian tubes', 'female', 'body_part', 'non_pregnancy', false),
('cervix', 'female', 'body_part', 'non_pregnancy', false),
('cervical', 'female', 'body_part', 'non_pregnancy', false),
('vagina', 'female', 'body_part', 'non_pregnancy', false),
('vaginal', 'female', 'body_part', 'non_pregnancy', false),
('vulva', 'female', 'body_part', 'non_pregnancy', false),
('vulvar', 'female', 'body_part', 'non_pregnancy', false),
('labia', 'female', 'body_part', 'non_pregnancy', false),
('clitoris', 'female', 'body_part', 'non_pregnancy', false),
('endometrium', 'female', 'body_part', 'non_pregnancy', false),
('endometrial', 'female', 'body_part', 'non_pregnancy', false),
('myometrium', 'female', 'body_part', 'non_pregnancy', false),
('myometrial', 'female', 'body_part', 'non_pregnancy', false),
('adnexa', 'female', 'body_part', 'non_pregnancy', false),
('adnexal', 'female', 'body_part', 'non_pregnancy', false),
('placenta', 'female', 'body_part', 'pregnancy_related', true),
('placental', 'female', 'body_part', 'pregnancy_related', true),
('amniotic', 'female', 'body_part', 'pregnancy_related', true),
('umbilical cord', 'female', 'body_part', 'pregnancy_related', true),
('fetal', 'female', 'body_part', 'pregnancy_related', true),
('fetus', 'female', 'body_part', 'pregnancy_related', true),
('PCOS', 'female', 'finding', 'non_pregnancy', false),
('endometriosis', 'female', 'finding', 'non_pregnancy', false),
('adenomyosis', 'female', 'finding', 'non_pregnancy', false),
('PID', 'female', 'finding', 'non_pregnancy', false),
('vaginismus', 'female', 'finding', 'non_pregnancy', false),
('vulvodynia', 'female', 'finding', 'non_pregnancy', false),
('pregnant', 'female', 'finding', 'pregnancy_related', true),
('pregnancy', 'female', 'finding', 'pregnancy_related', true),
('gravid', 'female', 'finding', 'pregnancy_related', true),
('gravida', 'female', 'finding', 'pregnancy_related', true),
('gestation', 'female', 'finding', 'pregnancy_related', true),
('gestational', 'female', 'finding', 'pregnancy_related', true),
('trimester', 'female', 'finding', 'pregnancy_related', true),
('prenatal', 'female', 'finding', 'pregnancy_related', true),
('antenatal', 'female', 'finding', 'pregnancy_related', true),
('obstetric', 'female', 'finding', 'pregnancy_related', true),
('obstetrical', 'female', 'finding', 'pregnancy_related', true),
('conception', 'female', 'finding', 'pregnancy_related', true),
('fertilization', 'female', 'finding', 'pregnancy_related', true),
('implantation', 'female', 'finding', 'pregnancy_related', true),
('menstrual', 'female', 'finding', 'pregnancy_related', true),
('menstruation', 'female', 'finding', 'pregnancy_related', true),
('menopause', 'female', 'finding', 'pregnancy_related', true),
('menopausal', 'female', 'finding', 'pregnancy_related', true),
('ovulation', 'female', 'finding', 'pregnancy_related', true),
('gynecologic', 'female', 'finding', 'pregnancy_related', true),
('gynecological', 'female', 'finding', 'pregnancy_related', true),
('preeclampsia', 'female', 'finding', 'pregnancy_related', true),
('eclampsia', 'female', 'finding', 'pregnancy_related', true),
('miscarriage', 'female', 'finding', 'pregnancy_related', true),
('abortion', 'female', 'finding', 'pregnancy_related', true),
('IUGR', 'female', 'finding', 'pregnancy_related', true),
('oligohydramnios', 'female', 'finding', 'pregnancy_related', true),
('polyhydramnios', 'female', 'finding', 'pregnancy_related', true),
('pap smear', 'female', 'lab_test', 'non_pregnancy', false),
('pap test', 'female', 'lab_test', 'non_pregnancy', false),
('cervical cytology', 'female', 'lab_test', 'non_pregnancy', false),
('HPV test', 'female', 'lab_test', 'non_pregnancy', false),
('mammography', 'female', 'lab_test', 'non_pregnancy', false),
('mammogram', 'female', 'lab_test', 'non_pregnancy', false),
('beta-hCG', 'female', 'lab_test', 'pregnancy_related', true),
('beta hCG', 'female', 'lab_test', 'pregnancy_related', true),
('human chorionic gonadotropin', 'female', 'lab_test', 'pregnancy_related', true),
('hCG', 'female', 'lab_test', 'pregnancy_related', true),
('AFP', 'female', 'lab_test', 'pregnancy_related', true),
('alpha-fetoprotein', 'female', 'lab_test', 'pregnancy_related', true),
('PAPP-A', 'female', 'lab_test', 'pregnancy_related', true),
('pregnancy-associated plasma protein', 'female', 'lab_test', 'pregnancy_related', true),
('triple screen', 'female', 'lab_test', 'pregnancy_related', true),
('quad screen', 'female', 'lab_test', 'pregnancy_related', true),
('first trimester screen', 'female', 'lab_test', 'pregnancy_related', true),
('second trimester screen', 'female', 'lab_test', 'pregnancy_related', true),
('glucose tolerance test', 'female', 'lab_test', 'pregnancy_related', true),
('GCT', 'female', 'lab_test', 'pregnancy_related', true),
('OGTT', 'female', 'lab_test', 'pregnancy_related', true),
('group B strep', 'female', 'lab_test', 'pregnancy_related', true),
('GBS culture', 'female', 'lab_test', 'pregnancy_related', true);

-- Insert exclusion patterns
INSERT INTO gender_exclusions (pattern_name, regex_pattern, context_type) VALUES
('healthcare_provider', '(?:physician|doctor|dr\.?|nurse|provider|technician|radiologist|clinician|staff|attending|resident|intern)\s+.{0,50}\b(he|she|his|her|him|male|female)\b', 'healthcare_provider'),
('communication', '(?:spoke|talked|discussed|communicated|contacted|called|informed|told|asked|explained|consulted)\s+(?:with\s+)?(?:the\s+)?(?:patient|family|mother|father|parent|guardian)\s+.{0,50}\b(he|she|his|her|him|male|female)\b', 'communication'),
('patient_reference', '\b(he|she|his|her|him|male|female|woman|man|girl|boy)\b', 'patient_reference');

-- Insert patient reference keywords
INSERT INTO patient_reference_keywords (keyword, reference_type) VALUES
('female', 'female'), ('she', 'female'), ('her', 'female'), ('hers', 'female'),
('woman', 'female'), ('girl', 'female'),
('male', 'male'), ('he', 'male'), ('him', 'male'), ('his', 'male'),
('man', 'male'), ('boy', 'male');

-- Create analytics view
CREATE VIEW detection_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_reports,
  COUNT(CASE WHEN results->>'mismatches' != '[]' THEN 1 END) as reports_with_alerts,
  AVG((results->>'processing_time_ms')::int) as avg_processing_time,
  COUNT(CASE WHEN patient_gender = 'Female' THEN 1 END) as female_patients,
  COUNT(CASE WHEN patient_gender = 'Male' THEN 1 END) as male_patients,
  COUNT(CASE WHEN patient_gender = 'Unknown' THEN 1 END) as unknown_gender_patients
FROM detection_logs
GROUP BY DATE(created_at)
ORDER BY date DESC; 
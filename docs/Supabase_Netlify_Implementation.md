# Gender Mismatch Detection System - Supabase + Netlify Implementation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Supabase Setup](#supabase-setup)
3. [Netlify Setup](#netlify-setup)
4. [Frontend Implementation](#frontend-implementation)
5. [Backend Functions](#backend-functions)
6. [Database Integration](#database-integration)
7. [Deployment Process](#deployment-process)
8. [Monitoring & Analytics](#monitoring--analytics)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Netlify       │    │   Supabase      │
│   (React/Vue)   │◄──►│   Functions     │◄──►│   PostgreSQL    │
│                 │    │   (Serverless)  │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Netlify CDN   │    │   Auth Service  │    │   Real-time     │
│   (Static Host) │    │   (Supabase)    │    │   Subscriptions │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down your project URL and anon key

### 1.2 Database Schema

```sql
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
    context_type VARCHAR(50) NOT NULL CHECK (context_type IN ('healthcare_provider', 'communication')),
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
CREATE INDEX idx_detection_logs_created_at ON detection_logs(created_at);

-- Enable Row Level Security
ALTER TABLE gender_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE gender_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for read access
CREATE POLICY "Enable read access for all users" ON gender_keywords
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON gender_exclusions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON detection_logs
    FOR INSERT WITH CHECK (true);
```

### 1.3 Seed Data

```sql
-- Insert male keywords
INSERT INTO gender_keywords (keyword, gender_type, category, subcategory) VALUES
('prostate', 'male', 'body_part', 'non_pregnancy'),
('prostatic', 'male', 'body_part', 'non_pregnancy'),
('testis', 'male', 'body_part', 'non_pregnancy'),
('testes', 'male', 'body_part', 'non_pregnancy'),
('testicular', 'male', 'body_part', 'non_pregnancy'),
('scrotum', 'male', 'body_part', 'non_pregnancy'),
('penis', 'male', 'body_part', 'non_pregnancy'),
('BPH', 'male', 'finding', 'non_pregnancy'),
('prostatitis', 'male', 'finding', 'non_pregnancy'),
('PSA', 'male', 'lab_test', 'non_pregnancy'),
('prostate specific antigen', 'male', 'lab_test', 'non_pregnancy');

-- Insert female keywords
INSERT INTO gender_keywords (keyword, gender_type, category, subcategory, pregnancy_related) VALUES
('uterus', 'female', 'body_part', 'non_pregnancy', false),
('uterine', 'female', 'body_part', 'non_pregnancy', false),
('ovary', 'female', 'body_part', 'non_pregnancy', false),
('ovaries', 'female', 'body_part', 'non_pregnancy', false),
('cervix', 'female', 'body_part', 'non_pregnancy', false),
('vagina', 'female', 'body_part', 'non_pregnancy', false),
('placenta', 'female', 'body_part', 'pregnancy_related', true),
('fetal', 'female', 'body_part', 'pregnancy_related', true),
('pregnant', 'female', 'finding', 'pregnancy_related', true),
('pregnancy', 'female', 'finding', 'pregnancy_related', true),
('PCOS', 'female', 'finding', 'non_pregnancy', false),
('endometriosis', 'female', 'finding', 'non_pregnancy', false);

-- Insert exclusion patterns
INSERT INTO gender_exclusions (pattern_name, regex_pattern, context_type) VALUES
('healthcare_provider', '(?:physician|doctor|dr\.?|nurse|provider|technician|radiologist|clinician|staff|attending|resident|intern)\s+.{0,50}\b(he|she|his|her|him|male|female)\b', 'healthcare_provider'),
('communication', '(?:spoke|talked|discussed|communicated|contacted|called|informed|told|asked|explained|consulted)\s+(?:with\s+)?(?:the\s+)?(?:patient|family|mother|father|parent|guardian)\s+.{0,50}\b(he|she|his|her|him|male|female)\b', 'communication'),
('patient_reference', '\b(he|she|his|her|him|male|female|woman|man|girl|boy)\b', 'patient_reference');

-- Create patient reference keywords table
CREATE TABLE patient_reference_keywords (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    keyword VARCHAR(50) NOT NULL,
    reference_type VARCHAR(20) NOT NULL CHECK (reference_type IN ('female', 'male')),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert patient reference keywords
INSERT INTO patient_reference_keywords (keyword, reference_type) VALUES
('female', 'female'), ('she', 'female'), ('her', 'female'), ('hers', 'female'),
('woman', 'female'), ('girl', 'female'),
('male', 'male'), ('he', 'male'), ('him', 'male'), ('his', 'male'),
('man', 'male'), ('boy', 'male');
```

## Netlify Setup

### 2.1 Project Structure

```
gender-mismatch-detection/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DetectionForm.js
│   │   │   ├── ResultsDisplay.js
│   │   │   └── AlertCard.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── detection.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.local
├── functions/
│   ├── detect-mismatch.js
│   ├── get-keywords.js
│   └── get-stats.js
├── netlify.toml
├── package.json
└── README.md
```

### 2.2 Netlify Configuration

```toml
# netlify.toml
[build]
  publish = "frontend/build"
  functions = "functions"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## Frontend Implementation

### 3.1 React App Setup

```bash
# Create React app
npx create-react-app frontend
cd frontend

# Install dependencies
npm install @supabase/supabase-js axios @mui/material @emotion/react @emotion/styled
```

### 3.2 API Service

```javascript
// frontend/src/services/api.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export const api = {
  async detectMismatch(data) {
    const response = await fetch('/.netlify/functions/detect-mismatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async getKeywords() {
    const { data, error } = await supabase
      .from('gender_keywords')
      .select('*')
      .eq('enabled', true)
    if (error) throw error
    return data
  },

  async getStats() {
    const response = await fetch('/.netlify/functions/get-stats')
    return response.json()
  }
}
```

### 3.3 Detection Form Component

```javascript
// frontend/src/components/DetectionForm.js
import React, { useState } from 'react'
import { TextField, Button, Box, Typography, Alert } from '@mui/material'
import { api } from '../services/api'

export default function DetectionForm({ onResults }) {
  const [formData, setFormData] = useState({
    report_text: '',
    patient_gender: '',
    patient_age: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const results = await api.detectMismatch(formData)
      onResults(results)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Gender Mismatch Detection
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TextField
        fullWidth
        multiline
        rows={6}
        label="Report Text"
        value={formData.report_text}
        onChange={(e) => setFormData({...formData, report_text: e.target.value})}
        required
        sx={{ mb: 2 }}
      />
      
      <TextField
        fullWidth
        select
        label="Patient Gender"
        value={formData.patient_gender}
        onChange={(e) => setFormData({...formData, patient_gender: e.target.value})}
        required
        sx={{ mb: 2 }}
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Unknown">Unknown</option>
      </TextField>
      
      <TextField
        fullWidth
        type="number"
        label="Patient Age"
        value={formData.patient_age}
        onChange={(e) => setFormData({...formData, patient_age: e.target.value})}
        required
        sx={{ mb: 2 }}
      />
      
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Processing...' : 'Detect Mismatches'}
      </Button>
    </Box>
  )
}
```

## Backend Functions

### 4.1 Detection Function

```javascript
// functions/detect-mismatch.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const { report_text, patient_gender, patient_age } = JSON.parse(event.body)
    const startTime = Date.now()

    // Validate input
    if (!report_text || !patient_gender || patient_age === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    if (patient_gender === 'Unknown') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          mismatches: [],
          processing_skipped: true,
          skip_reason: 'Unknown gender'
        })
      }
    }

    // Get keywords from Supabase
    const { data: keywords, error: keywordsError } = await supabase
      .from('gender_keywords')
      .select('*')
      .eq('enabled', true)

    if (keywordsError) throw keywordsError

    // Get exclusion patterns
    const { data: exclusions, error: exclusionsError } = await supabase
      .from('gender_exclusions')
      .select('*')
      .eq('enabled', true)

    if (exclusionsError) throw exclusionsError

    // Process detection
    const mismatches = detectMismatches(report_text, patient_gender, patient_age, keywords, exclusions)

    // Log detection result
    await supabase.from('detection_logs').insert({
      patient_gender,
      patient_age,
      results: { mismatches },
      processing_time_ms: Date.now() - startTime
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        mismatches,
        processing_time_ms: Date.now() - startTime,
        total_keywords_checked: keywords.length
      })
    }

  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

function detectMismatches(text, gender, age, keywords, exclusions) {
  const mismatches = []
  const textLower = text.toLowerCase()

  // Apply detection logic based on gender and age
  let targetKeywords = []
  
  if (gender === 'Female') {
    // Female patients: flag ALL male keywords
    targetKeywords = keywords.filter(k => k.gender_type === 'male')
  } else if (gender === 'Male') {
    if (age >= 8) {
      // Male ≥8: flag ALL female keywords
      targetKeywords = keywords.filter(k => k.gender_type === 'female')
    } else {
      // Male <8: flag only non-pregnancy female keywords
      targetKeywords = keywords.filter(k => 
        k.gender_type === 'female' && !k.pregnancy_related
      )
    }
  }

  // Find matches
  for (const keyword of targetKeywords) {
    const regex = new RegExp(`\\b${keyword.keyword}\\b`, 'gi')
    const matches = textLower.match(regex)
    
    if (matches) {
      mismatches.push({
        keyword: keyword.keyword,
        category: keyword.category,
        subcategory: keyword.subcategory,
        priority: determinePriority(keyword, gender, age),
        context: extractContext(text, keyword.keyword)
      })
    }
  }

  // Apply exclusion rules
  return applyExclusions(mismatches, text, exclusions)
}

function determinePriority(keyword, gender, age) {
  if (gender === 'Female' && keyword.gender_type === 'male') return 'High'
  if (gender === 'Male' && age >= 8 && keyword.gender_type === 'female') return 'High'
  if (gender === 'Male' && age < 8 && keyword.gender_type === 'female' && !keyword.pregnancy_related) return 'High'
  return 'Medium'
}

function extractContext(text, keyword) {
  const index = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (index === -1) return ''
  
  const start = Math.max(0, index - 50)
  const end = Math.min(text.length, index + keyword.length + 50)
  return text.substring(start, end)
}

function applyExclusions(mismatches, text, exclusions) {
  return mismatches.filter(mismatch => {
    // Check healthcare provider context
    const providerPattern = /(?:physician|doctor|dr\.?|nurse|provider|technician|radiologist|clinician|staff|attending|resident|intern)\s+.{0,50}\b(he|she|his|her|him|male|female)\b/gi
    if (providerPattern.test(text)) {
      return false
    }
    
    // Check communication context
    const communicationPattern = /(?:spoke|talked|discussed|communicated|contacted|called|informed|told|asked|explained|consulted)\s+(?:with\s+)?(?:the\s+)?(?:patient|family|mother|father|parent|guardian)\s+.{0,50}\b(he|she|his|her|him|male|female)\b/gi
    if (communicationPattern.test(text)) {
      return false
    }
    
    // Check patient reference context
    const patientRefPattern = /\b(he|she|his|her|him|male|female|woman|man|girl|boy)\b/gi
    const patientRefMatches = text.match(patientRefPattern)
    if (patientRefMatches) {
      for (const match of patientRefMatches) {
        const contextStart = Math.max(0, text.indexOf(match) - 100)
        const contextEnd = Math.min(text.length, text.indexOf(match) + 100)
        const context = text.substring(contextStart, contextEnd).toLowerCase()
        
        // If context contains patient reference indicators, exclude
        if (context.includes('patient') || context.includes('family') || 
            context.includes('mother') || context.includes('father') || 
            context.includes('parent')) {
          return false
        }
      }
    }
    
    return true
  })
}
```

### 4.2 Stats Function

```javascript
// functions/get-stats.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // Get recent detection logs
    const { data: logs, error } = await supabase
      .from('detection_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // Calculate stats
    const stats = {
      total_reports: logs.length,
      total_alerts: logs.reduce((sum, log) => sum + (log.results?.mismatches?.length || 0), 0),
      avg_processing_time: logs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / logs.length,
      high_priority_alerts: logs.reduce((sum, log) => 
        sum + (log.results?.mismatches?.filter(m => m.priority === 'High').length || 0), 0
      ),
      recent_activity: logs.slice(0, 10)
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stats)
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
```

## Deployment Process

### 5.1 Environment Variables

```bash
# .env.local (frontend)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Environment variables in Netlify dashboard
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 5.2 Deployment Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/gender-mismatch-detection.git
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository
   - Set build settings:
     - Build command: `cd frontend && npm run build`
     - Publish directory: `frontend/build`

3. **Configure Environment Variables**
   - In Netlify dashboard, go to Site settings > Environment variables
   - Add all required environment variables

4. **Deploy**
   - Netlify will automatically deploy on every push to main branch
   - Preview deployments for pull requests

## Monitoring & Analytics

### 6.1 Supabase Analytics

```sql
-- Create view for analytics
CREATE VIEW detection_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_reports,
  COUNT(CASE WHEN results->>'mismatches' != '[]' THEN 1 END) as reports_with_alerts,
  AVG((results->>'processing_time_ms')::int) as avg_processing_time,
  COUNT(CASE WHEN patient_gender = 'Female' THEN 1 END) as female_patients,
  COUNT(CASE WHEN patient_gender = 'Male' THEN 1 END) as male_patients
FROM detection_logs
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 6.2 Real-time Subscriptions

```javascript
// frontend/src/services/realtime.js
import { supabase } from './api'

export const subscribeToAlerts = (callback) => {
  return supabase
    .channel('detection_logs')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'detection_logs' },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()
}
```

## Cost Analysis

### Supabase (Free Tier)
- **Database**: 500MB storage
- **Bandwidth**: 2GB/month
- **API calls**: 50,000/month
- **Auth users**: 50,000
- **Real-time connections**: 500 concurrent

### Netlify (Free Tier)
- **Build minutes**: 300/month
- **Bandwidth**: 100GB/month
- **Function invocations**: 125,000/month
- **Form submissions**: 100/month

### Estimated Monthly Cost
- **Development**: $0 (free tiers sufficient)
- **Production (low volume)**: $0-20
- **Production (high volume)**: $50-200

## Benefits of This Stack

1. **Zero Infrastructure Management**: No servers to maintain
2. **Automatic Scaling**: Handles traffic spikes automatically
3. **Real-time Updates**: Live alert notifications
4. **Built-in Security**: HTTPS, authentication, row-level security
5. **Cost Effective**: Generous free tiers
6. **Developer Friendly**: Great tooling and documentation
7. **Global CDN**: Fast loading worldwide
8. **Easy Deployment**: Git-based deployments

This stack provides a modern, scalable, and cost-effective solution for the Gender Mismatch Detection System. 
# Gender Mismatch Detection System

## Overview

An automated system for detecting gender mismatches in radiology reports using keyword-based pattern recognition. The system identifies when medical reports contain gender-specific terms that don't match the patient's gender, helping to improve quality assurance in radiology.

## 🚀 Quick Start

**Live Application**: https://gender-mismatch-detection.netlify.app

Try it with this sample:
- **Report**: "Patient has prostate enlargement"
- **Gender**: Female
- **Age**: 45
- **Expected**: High priority alert for "prostate" (male-specific term)

## Features

- **Keyword-based Detection**: Pre-defined libraries of male/female specific medical terms
- **Age-based Logic**: Different detection rules for pediatric vs adult patients
- **Smart Exclusions**: Filters out legitimate gender references in provider/communication contexts
- **Priority Alerts**: High/Medium priority classification for detected mismatches
- **Real-time Processing**: Fast detection with comprehensive reporting

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Netlify       │    │   Supabase      │
│   (React)       │◄──►│   Functions     │◄──►│   PostgreSQL    │
│                 │    │   (Serverless)  │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Business Rules

- **Female patients**: Flag ALL male-specific terms
- **Male patients ≥8 years**: Flag ALL female-specific terms + pregnancy terms
- **Male patients <8 years**: Flag only non-pregnancy female terms
- **Unknown gender**: Skip processing

## Technology Stack

- **Frontend**: React + Material-UI
- **Backend**: Netlify Functions (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Netlify
- **Authentication**: Supabase Auth

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SiddharthaKostiRaga/gender-mismatch-detection.git
   cd gender-mismatch-detection
   ```

2. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `database/schema.sql`
   - Note your project URL and anon key

3. **Set up environment variables**
   ```bash
   # Frontend (.env.local)
   REACT_APP_SUPABASE_URL=https://fpplmfsrhxkvnwunlfdl.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Netlify Functions (in Netlify dashboard)
   SUPABASE_URL=https://fpplmfsrhxkvnwunlfdl.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

5. **Run development server**
   ```bash
   npm start
   ```

## Project Structure

```
gender-mismatch-detection/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── utils/           # Utility functions
│   │   └── App.js
│   ├── public/
│   └── package.json
├── functions/               # Netlify serverless functions
│   ├── detect-mismatch.js
│   ├── get-keywords.js
│   └── get-stats.js
├── database/               # Database schema and migrations
│   └── schema.sql
├── docs/                   # Documentation
│   ├── Phase1_Implementation_Guide.md
│   └── Supabase_Netlify_Implementation.md
├── netlify.toml           # Netlify configuration
└── README.md
```

## API Endpoints

### POST /api/detect-mismatch
Detect gender mismatches in a radiology report.

**Request:**
```json
{
  "report_text": "Patient has prostate enlargement",
  "patient_gender": "Female",
  "patient_age": 45
}
```

**Response:**
```json
{
  "mismatches": [
    {
      "keyword": "prostate",
      "category": "body_part",
      "priority": "High",
      "context": "Patient has prostate enlargement"
    }
  ],
  "processing_time_ms": 150,
  "total_keywords_checked": 45
}
```

## Development

### Running Tests
```bash
cd frontend
npm test
```

### Building for Production
```bash
cd frontend
npm run build
```

### Local Development
```bash
# Start frontend development server
cd frontend
npm start

# Test Netlify functions locally
netlify dev
```

## Deployment

### Live Application
- **Production URL**: https://gender-mismatch-detection.netlify.app
- **Netlify Dashboard**: https://app.netlify.com/projects/gender-mismatch-detection
- **GitHub Repository**: https://github.com/SiddharthaKostiRaga/gender-mismatch-detection

### Automatic Deployment
- Push to `main` branch triggers automatic deployment
- Preview deployments for pull requests
- Environment variables configured in Netlify dashboard

### Manual Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy to Netlify
netlify deploy --prod
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the implementation guides for detailed technical information

## Roadmap

### Phase 1 (Current)
- ✅ Keyword-based detection
- ✅ Age-based logic
- ✅ Exclusion rules
- ✅ Priority alerts

### Phase 2 (Future)
- Custom keyword management
- Institution-specific libraries
- Advanced analytics

### Phase 3 (Future)
- AI-powered detection
- Natural language processing
- Machine learning integration 
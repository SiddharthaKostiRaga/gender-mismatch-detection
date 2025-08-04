const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://fpplmfsrhxkvnwunlfdl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcGxtZnNyaHhrdm53dW5sZmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI5MDU0NywiZXhwIjoyMDY5ODY2NTQ3fQ.AsvxBdeJ7G58g745yANYT819Gxrr05v0X5W2V7cWqJo';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to detect mismatches (reuse from detect-mismatch.js)
async function detectMismatches(reportText, patientGender, patientAge = 50) {
  const startTime = Date.now();
  
  try {
    // Fetch keywords and exclusions from Supabase
    const [keywordsResult, exclusionsResult] = await Promise.all([
      supabase.from('gender_keywords').select('*').eq('enabled', true),
      supabase.from('gender_exclusions').select('*').eq('enabled', true)
    ]);

    const keywords = keywordsResult.data || [];
    const exclusions = exclusionsResult.data || [];

    // Apply age-based rules
    let applicableKeywords = keywords;
    if (patientAge < 18) {
      applicableKeywords = keywords.filter(k => !k.pregnancy_related);
    }

    // Find matches
    const matches = [];
    const reportLower = reportText.toLowerCase();

    applicableKeywords.forEach(keyword => {
      const keywordLower = keyword.keyword.toLowerCase();
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
      const found = reportLower.match(regex);
      
      if (found) {
        matches.push({
          keyword: keyword.keyword,
          category: keyword.category,
          subcategory: keyword.subcategory,
          gender: keyword.gender,
          count: found.length
        });
      }
    });

    // Apply exclusions
    const filteredMatches = applyExclusions(matches, exclusions, reportText);

    // Determine priority
    const priority = determinePriority(filteredMatches, patientGender);

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      mismatches: filteredMatches,
      priority,
      processingTime,
      keywordsChecked: applicableKeywords.length,
      exclusionsApplied: exclusions.length,
      totalMatches: matches.length,
      filteredMatches: filteredMatches.length
    };

  } catch (error) {
    console.error('Error in detectMismatches:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function applyExclusions(matches, exclusions, reportText) {
  const reportLower = reportText.toLowerCase();
  
  return matches.filter(match => {
    // Check each exclusion rule
    for (const exclusion of exclusions) {
      if (exclusion.context_type === 'healthcare_provider') {
        // Healthcare provider context - check for provider terms before gender reference
        const providerPatterns = [
          /(?:physician|doctor|dr|nurse|provider|technician|radiologist|clinician|staff|attending|resident|intern)\s+[^.]*(?:female|male|woman|man|girl|boy)/gi
        ];
        
        for (const pattern of providerPatterns) {
          if (pattern.test(reportText)) {
            return false; // Exclude this match
          }
        }
      }
      
      if (exclusion.context_type === 'communication') {
        // Communication context - check for communication verbs with patient/family
        const communicationPatterns = [
          /(?:spoke|talked|discussed|communicated|contacted|called|informed|told|asked|explained|consulted)\s+[^.]*(?:patient|family|spouse|husband|wife)/gi
        ];
        
        for (const pattern of communicationPatterns) {
          if (pattern.test(reportText)) {
            return false; // Exclude this match
          }
        }
      }
      
      if (exclusion.context_type === 'patient_reference') {
        // Patient reference context - check for patient reference keywords
        const patientRefPatterns = [
          /(?:female|male|woman|man|girl|boy)\s+[^.]*(?:patient|pt|subject)/gi
        ];
        
        for (const pattern of patientRefPatterns) {
          if (pattern.test(reportText)) {
            return false; // Exclude this match
          }
        }
      }
    }
    
    return true; // Keep this match
  });
}

function determinePriority(matches, patientGender) {
  if (matches.length === 0) return 'none';
  
  const highPriorityCount = matches.filter(m => 
    m.gender !== patientGender && 
    ['body_parts', 'findings'].includes(m.category)
  ).length;
  
  const mediumPriorityCount = matches.filter(m => 
    m.gender !== patientGender && 
    m.category === 'lab_tests'
  ).length;
  
  if (highPriorityCount > 0) return 'high';
  if (mediumPriorityCount > 0) return 'medium';
  return 'low';
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const requestBody = JSON.parse(event.body);
    const { gender, findings, human_impression } = requestBody;

    // Validate input - at least 2 columns must be selected
    const selectedColumns = [gender, findings, human_impression].filter(Boolean);
    if (selectedColumns.length < 2) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Please select at least 2 columns for analysis',
          selectedColumns: selectedColumns.length
        })
      };
    }

    const analysisResults = {
      gender: gender,
      findings: findings,
      human_impression: human_impression,
      analyses: [],
      overallSummary: {
        totalAnalyses: 0,
        mismatchesFound: 0,
        priority: 'none'
      }
    };

    // Perform separate comparative analyses
    if (gender && findings) {
      console.log('Analyzing Gender vs Findings...');
      const genderVsFindings = await detectMismatches(findings, gender);
      analysisResults.analyses.push({
        type: 'gender_vs_findings',
        data: findings,
        results: genderVsFindings
      });
      analysisResults.overallSummary.totalAnalyses++;
      if (genderVsFindings.mismatches && genderVsFindings.mismatches.length > 0) {
        analysisResults.overallSummary.mismatchesFound += genderVsFindings.mismatches.length;
      }
    }

    if (gender && human_impression) {
      console.log('Analyzing Gender vs Human Impression...');
      const genderVsImpression = await detectMismatches(human_impression, gender);
      analysisResults.analyses.push({
        type: 'gender_vs_human_impression',
        data: human_impression,
        results: genderVsImpression
      });
      analysisResults.overallSummary.totalAnalyses++;
      if (genderVsImpression.mismatches && genderVsImpression.mismatches.length > 0) {
        analysisResults.overallSummary.mismatchesFound += genderVsImpression.mismatches.length;
      }
    }

    // Determine overall priority
    const allPriorities = analysisResults.analyses.map(a => a.results.priority);
    if (allPriorities.includes('high')) {
      analysisResults.overallSummary.priority = 'high';
    } else if (allPriorities.includes('medium')) {
      analysisResults.overallSummary.priority = 'medium';
    } else if (allPriorities.includes('low')) {
      analysisResults.overallSummary.priority = 'low';
    }

    // Log the analysis
    try {
      await supabase.from('detection_logs').insert({
        report_text: JSON.stringify({ gender, findings, human_impression }),
        patient_gender: gender,
        patient_age: 50,
        detection_results: analysisResults,
        processing_time: analysisResults.analyses.reduce((sum, a) => sum + (a.results.processingTime || 0), 0),
        alert_priority: analysisResults.overallSummary.priority
      });
    } catch (logError) {
      console.error('Error logging analysis:', logError);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(analysisResults)
    };

  } catch (error) {
    console.error('Error in GT dataset analysis:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
}; 
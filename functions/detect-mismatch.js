const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { report_text, patient_gender, patient_age } = JSON.parse(event.body);
    const startTime = Date.now();

    // Validate input
    if (!report_text || !patient_gender || patient_age === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
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
      };
    }

    // Get keywords from Supabase
    const { data: keywords, error: keywordsError } = await supabase
      .from('gender_keywords')
      .select('*')
      .eq('enabled', true);

    if (keywordsError) throw keywordsError;

    // Get exclusion patterns
    const { data: exclusions, error: exclusionsError } = await supabase
      .from('gender_exclusions')
      .select('*')
      .eq('enabled', true);

    if (exclusionsError) throw exclusionsError;

    // Process detection
    const mismatches = detectMismatches(report_text, patient_gender, patient_age, keywords, exclusions);

    // Log detection result
    await supabase.from('detection_logs').insert({
      patient_gender,
      patient_age,
      results: { mismatches },
      processing_time_ms: Date.now() - startTime
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        mismatches,
        processing_time_ms: Date.now() - startTime,
        total_keywords_checked: keywords.length
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function detectMismatches(text, gender, age, keywords, exclusions) {
  const mismatches = [];
  const textLower = text.toLowerCase();

  // Apply detection logic based on gender and age
  let targetKeywords = [];
  
  if (gender === 'Female') {
    // Female patients: flag ALL male keywords
    targetKeywords = keywords.filter(k => k.gender_type === 'male');
  } else if (gender === 'Male') {
    if (age >= 8) {
      // Male ≥8: flag ALL female keywords
      targetKeywords = keywords.filter(k => k.gender_type === 'female');
    } else {
      // Male <8: flag only non-pregnancy female keywords
      targetKeywords = keywords.filter(k => 
        k.gender_type === 'female' && !k.pregnancy_related
      );
    }
  }

  // Find matches
  for (const keyword of targetKeywords) {
    const regex = new RegExp(`\\b${keyword.keyword}\\b`, 'gi');
    const matches = textLower.match(regex);
    
    if (matches) {
      mismatches.push({
        keyword: keyword.keyword,
        category: keyword.category,
        subcategory: keyword.subcategory,
        priority: determinePriority(keyword, gender, age),
        context: extractContext(text, keyword.keyword)
      });
    }
  }

  // Apply exclusion rules
  return applyExclusions(mismatches, text, exclusions);
}

function determinePriority(keyword, gender, age) {
  if (gender === 'Female' && keyword.gender_type === 'male') return 'High';
  if (gender === 'Male' && age >= 8 && keyword.gender_type === 'female') return 'High';
  if (gender === 'Male' && age < 8 && keyword.gender_type === 'female' && !keyword.pregnancy_related) return 'High';
  return 'Medium';
}

function extractContext(text, keyword) {
  const index = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (index === -1) return '';
  
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + keyword.length + 50);
  return text.substring(start, end);
}

function applyExclusions(mismatches, text, exclusions) {
  return mismatches.filter(mismatch => {
    // Check healthcare provider context
    const providerPattern = /(?:physician|doctor|dr\.?|nurse|provider|technician|radiologist|clinician|staff|attending|resident|intern)\s+.{0,50}\b(he|she|his|her|him|male|female)\b/gi;
    if (providerPattern.test(text)) {
      return false;
    }
    
    // Check communication context
    const communicationPattern = /(?:spoke|talked|discussed|communicated|contacted|called|informed|told|asked|explained|consulted)\s+(?:with\s+)?(?:the\s+)?(?:patient|family|mother|father|parent|guardian)\s+.{0,50}\b(he|she|his|her|him|male|female)\b/gi;
    if (communicationPattern.test(text)) {
      return false;
    }
    
    // Check patient reference context
    const patientRefPattern = /\b(he|she|his|her|him|male|female|woman|man|girl|boy)\b/gi;
    const patientRefMatches = text.match(patientRefPattern);
    if (patientRefMatches) {
      for (const match of patientRefMatches) {
        const contextStart = Math.max(0, text.indexOf(match) - 100);
        const contextEnd = Math.min(text.length, text.indexOf(match) + 100);
        const context = text.substring(contextStart, contextEnd).toLowerCase();
        
        // If context contains patient reference indicators, exclude
        if (context.includes('patient') || context.includes('family') || 
            context.includes('mother') || context.includes('father') || 
            context.includes('parent')) {
          return false;
        }
      }
    }
    
    return true;
  });
} 
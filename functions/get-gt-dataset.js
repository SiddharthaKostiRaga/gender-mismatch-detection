const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://fpplmfsrhxkvnwunlfdl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcGxtZnNyaHhrdm53dW5sZmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI5MDU0NywiZXhwIjoyMDY5ODY2NTQ3fQ.AsvxBdeJ7G58g745yANYT819Gxrr05v0X5W2V7cWqJo';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Fetch all GT dataset records
    const { data: gtData, error } = await supabase
      .from('gt_dataset')
      .select('gender, findings, human_impression')
      .order('id');

    if (error) {
      throw error;
    }

    // Extract unique values for dropdowns
    const uniqueGenders = [...new Set(gtData.map(record => record.gender).filter(Boolean))];
    const allFindings = gtData.map(record => record.findings).filter(Boolean);
    const allHumanImpressions = gtData.map(record => record.human_impression).filter(Boolean);

    // Create truncated versions for dropdown display
    const findingsForDropdown = allFindings.map(finding => ({
      value: finding,
      label: finding.length > 100 ? finding.substring(0, 100) + '...' : finding
    }));

    const impressionsForDropdown = allHumanImpressions.map(impression => ({
      value: impression,
      label: impression.length > 100 ? impression.substring(0, 100) + '...' : impression
    }));

    const response = {
      success: true,
      data: {
        genders: uniqueGenders,
        findings: findingsForDropdown,
        human_impressions: impressionsForDropdown,
        totalRecords: gtData.length
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error fetching GT dataset:', error);
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
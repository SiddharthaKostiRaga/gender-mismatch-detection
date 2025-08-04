const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get recent detection logs
    const { data: logs, error } = await supabase
      .from('detection_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Calculate stats
    const stats = {
      total_reports: logs.length,
      total_alerts: logs.reduce((sum, log) => sum + (log.results?.mismatches?.length || 0), 0),
      avg_processing_time: logs.length > 0 ? 
        logs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / logs.length : 0,
      high_priority_alerts: logs.reduce((sum, log) => 
        sum + (log.results?.mismatches?.filter(m => m.priority === 'High').length || 0), 0
      ),
      medium_priority_alerts: logs.reduce((sum, log) => 
        sum + (log.results?.mismatches?.filter(m => m.priority === 'Medium').length || 0), 0
      ),
      female_patients: logs.filter(log => log.patient_gender === 'Female').length,
      male_patients: logs.filter(log => log.patient_gender === 'Male').length,
      unknown_gender_patients: logs.filter(log => log.patient_gender === 'Unknown').length,
      alerts_per_report: logs.length > 0 ? 
        logs.reduce((sum, log) => sum + (log.results?.mismatches?.length || 0), 0) / logs.length : 0,
      recent_activity: logs.slice(0, 10).map(log => ({
        id: log.id,
        patient_gender: log.patient_gender,
        patient_age: log.patient_age,
        mismatches_count: log.results?.mismatches?.length || 0,
        processing_time: log.processing_time_ms,
        created_at: log.created_at
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(stats)
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
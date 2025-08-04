import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const api = {
  async detectMismatch(data) {
    try {
      const response = await fetch('/.netlify/functions/detect-mismatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Detection API error:', error);
      throw new Error('Failed to detect mismatches. Please try again.');
    }
  },

  async getKeywords() {
    try {
      const { data, error } = await supabase
        .from('gender_keywords')
        .select('*')
        .eq('enabled', true)
        .order('keyword');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Keywords API error:', error);
      throw new Error('Failed to load keywords.');
    }
  },

  async getStats() {
    try {
      const response = await fetch('/.netlify/functions/get-stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Stats API error:', error);
      throw new Error('Failed to load statistics.');
    }
  },

  async getExclusions() {
    try {
      const { data, error } = await supabase
        .from('gender_exclusions')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Exclusions API error:', error);
      throw new Error('Failed to load exclusion patterns.');
    }
  },

  async getPatientReferences() {
    try {
      const { data, error } = await supabase
        .from('patient_reference_keywords')
        .select('*')
        .eq('enabled', true);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Patient references API error:', error);
      throw new Error('Failed to load patient reference keywords.');
    }
  },

  // GT Dataset Analysis Functions
  async getGTDatasetData() {
    try {
      const response = await fetch('/.netlify/functions/get-gt-dataset');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GT Dataset API error:', error);
      throw new Error('Failed to load GT dataset data.');
    }
  },

  async analyzeGTDataset(analysisData) {
    try {
      const response = await fetch('/.netlify/functions/gt-dataset-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('GT Dataset Analysis API error:', error);
      throw new Error('Failed to analyze GT dataset.');
    }
  }
}; 
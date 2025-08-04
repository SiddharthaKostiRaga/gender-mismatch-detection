import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { api } from '../services/api';

export function DetectionForm({ onResults, loading, setLoading }) {
  const [formData, setFormData] = useState({
    report_text: '',
    patient_gender: '',
    patient_age: ''
  });
  const [error, setError] = useState('');
  const [keywords, setKeywords] = useState([]);

  // Load keywords on component mount
  React.useEffect(() => {
    const loadKeywords = async () => {
      try {
        const keywordsData = await api.getKeywords();
        setKeywords(keywordsData);
      } catch (error) {
        console.error('Failed to load keywords:', error);
      }
    };
    loadKeywords();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate input
      if (!formData.report_text.trim()) {
        throw new Error('Please enter report text');
      }
      if (!formData.patient_gender) {
        throw new Error('Please select patient gender');
      }
      if (!formData.patient_age || formData.patient_age < 0) {
        throw new Error('Please enter a valid patient age');
      }

      const results = await api.detectMismatch({
        report_text: formData.report_text,
        patient_gender: formData.patient_gender,
        patient_age: parseInt(formData.patient_age)
      });

      onResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const getKeywordStats = () => {
    const maleKeywords = keywords.filter(k => k.gender_type === 'male').length;
    const femaleKeywords = keywords.filter(k => k.gender_type === 'female').length;
    const pregnancyKeywords = keywords.filter(k => k.pregnancy_related).length;
    
    return { maleKeywords, femaleKeywords, pregnancyKeywords };
  };

  const stats = getKeywordStats();

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h4" gutterBottom>
        Gender Mismatch Detection
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Enter radiology report text and patient information to detect gender mismatches.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Report Text */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={8}
            label="Radiology Report Text"
            value={formData.report_text}
            onChange={handleInputChange('report_text')}
            required
            placeholder="Enter the radiology report text here..."
            variant="outlined"
          />
        </Grid>

        {/* Patient Information */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel>Patient Gender</InputLabel>
            <Select
              value={formData.patient_gender}
              onChange={handleInputChange('patient_gender')}
              label="Patient Gender"
            >
              <MenuItem value="">Select Gender</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Unknown">Unknown</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Patient Age"
            value={formData.patient_age}
            onChange={handleInputChange('patient_age')}
            required
            inputProps={{ min: 0, max: 120 }}
            placeholder="Enter age in years"
          />
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Processing...
              </>
            ) : (
              'Detect Gender Mismatches'
            )}
          </Button>
        </Grid>
      </Grid>

      {/* Keyword Statistics */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Male Keywords: {stats.maleKeywords}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Female Keywords: {stats.femaleKeywords}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Pregnancy Keywords: {stats.pregnancyKeywords}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
} 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { api } from '../services/api';

const GTDatasetAnalysis = () => {
  const [gender, setGender] = useState('');
  const [findings, setFindings] = useState('');
  const [humanImpression, setHumanImpression] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [gtData, setGtData] = useState({
    genders: [],
    findings: [],
    human_impressions: []
  });

  // Load GT dataset data on component mount
  useEffect(() => {
    loadGTDatasetData();
  }, []);

  const loadGTDatasetData = async () => {
    try {
      setDataLoading(true);
      const response = await api.getGTDatasetData();
      if (response.success) {
        setGtData(response.data);
      } else {
        setError('Failed to load GT dataset data');
      }
    } catch (err) {
      setError('Error loading GT dataset data: ' + err.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      setResults(null);

      const response = await api.analyzeGTDataset({
        gender,
        findings,
        human_impression: humanImpression
      });

      if (response.success !== false) {
        setResults(response);
      } else {
        setError(response.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Error during analysis: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCount = () => {
    return [gender, findings, humanImpression].filter(Boolean).length;
  };

  const isAnalysisDisabled = () => {
    return getSelectedCount() < 2 || loading || dataLoading;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <CheckIcon color="success" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'success';
    }
  };

  const renderAnalysisResults = () => {
    if (!results) return null;

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Analysis Results
          </Typography>
          
          {/* Overall Summary */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle1" gutterBottom>
              Overall Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Chip
                  icon={getPriorityIcon(results.overallSummary.priority)}
                  label={`Priority: ${results.overallSummary.priority.toUpperCase()}`}
                  color={getPriorityColor(results.overallSummary.priority)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Chip
                  label={`Analyses: ${results.overallSummary.totalAnalyses}`}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Chip
                  label={`Mismatches: ${results.overallSummary.mismatchesFound}`}
                  color={results.overallSummary.mismatchesFound > 0 ? 'error' : 'success'}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Selected Data */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'blue.50' }}>
            <Typography variant="subtitle1" gutterBottom>
              Selected Data
            </Typography>
            {results.gender && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Gender:</strong> {results.gender}
              </Typography>
            )}
            {results.findings && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Findings:</strong> {results.findings.substring(0, 200)}...
              </Typography>
            )}
            {results.human_impression && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Human Impression:</strong> {results.human_impression.substring(0, 200)}...
              </Typography>
            )}
          </Paper>

          {/* Individual Analyses */}
          {results.analyses.map((analysis, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'green.50' }}>
              <Typography variant="subtitle1" gutterBottom>
                {analysis.type === 'gender_vs_findings' ? 'Gender vs Findings' : 'Gender vs Human Impression'}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3}>
                  <Chip
                    icon={getPriorityIcon(analysis.results.priority)}
                    label={`Priority: ${analysis.results.priority.toUpperCase()}`}
                    color={getPriorityColor(analysis.results.priority)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Chip
                    label={`Keywords: ${analysis.results.keywordsChecked}`}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Chip
                    label={`Time: ${analysis.results.processingTime}ms`}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Chip
                    label={`Matches: ${analysis.results.filteredMatches}`}
                    color={analysis.results.filteredMatches > 0 ? 'error' : 'success'}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              {/* Mismatches */}
              {analysis.results.mismatches && analysis.results.mismatches.length > 0 ? (
                <Box>
                  <Typography variant="body2" color="error" gutterBottom>
                    Mismatches Found:
                  </Typography>
                  {analysis.results.mismatches.map((mismatch, mIndex) => (
                    <Chip
                      key={mIndex}
                      label={`${mismatch.keyword} (${mismatch.category})`}
                      color="error"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="success.main">
                  ✅ No mismatches detected
                </Typography>
              )}
            </Paper>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (dataLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            🎯 GT Dataset Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select at least 2 columns from the GT dataset for comparative analysis
          </Typography>

          <Grid container spacing={3}>
            {/* Gender Dropdown */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={gender}
                  label="Gender"
                  onChange={(e) => setGender(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select Gender</em>
                  </MenuItem>
                  {gtData.genders.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Findings Dropdown */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Findings</InputLabel>
                <Select
                  value={findings}
                  label="Findings"
                  onChange={(e) => setFindings(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select Findings</em>
                  </MenuItem>
                  {gtData.findings.map((finding, index) => (
                    <MenuItem key={index} value={finding.value}>
                      {finding.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Human Impression Dropdown */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Human Impression</InputLabel>
                <Select
                  value={humanImpression}
                  label="Human Impression"
                  onChange={(e) => setHumanImpression(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select Human Impression</em>
                  </MenuItem>
                  {gtData.human_impressions.map((impression, index) => (
                    <MenuItem key={index} value={impression.value}>
                      {impression.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Selection Summary */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Chip
              label={`Selected: ${getSelectedCount()}/3 columns`}
              color={getSelectedCount() >= 2 ? 'success' : 'warning'}
              variant="outlined"
            />
            {getSelectedCount() < 2 && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                Please select at least 2 columns for analysis
              </Typography>
            )}
          </Box>

          {/* Run Analysis Button */}
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <PlayIcon />}
            onClick={handleAnalysis}
            disabled={isAnalysisDisabled()}
            sx={{ mt: 2 }}
          >
            {loading ? 'Analyzing...' : '🔍 Run Detection'}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {renderAnalysisResults()}
    </Box>
  );
};

export default GTDatasetAnalysis; 
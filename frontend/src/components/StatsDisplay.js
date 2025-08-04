import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { api } from '../services/api';

export function StatsDisplay() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const statsData = await api.getStats();
        setStats(statsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load statistics: {error}
      </Alert>
    );
  }

  if (!stats) {
    return (
      <Alert severity="info">
        No statistics available yet.
      </Alert>
    );
  }

  const {
    total_reports = 0,
    total_alerts = 0,
    high_priority_alerts = 0,
    avg_processing_time = 0,
    alerts_per_report = 0
  } = stats;

  const alertRate = total_reports > 0 ? ((total_alerts / total_reports) * 100).toFixed(1) : 0;
  const highPriorityRate = total_alerts > 0 ? ((high_priority_alerts / total_alerts) * 100).toFixed(1) : 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        System Statistics
      </Typography>

      <Grid container spacing={3}>
        {/* Total Reports */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary">
                  Total Reports
                </Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {total_reports}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reports processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Alerts */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="secondary">
                  Total Alerts
                </Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {total_alerts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mismatches detected ({alertRate}% rate)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* High Priority Alerts */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" color="error">
                  High Priority
                </Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {high_priority_alerts}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical mismatches ({highPriorityRate}% of alerts)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Processing Time */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" color="success.main">
                  Avg. Processing
                </Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {avg_processing_time.toFixed(0)}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Per report
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="primary">
                      {alerts_per_report.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alerts per Report
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="secondary">
                      {alertRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alert Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" color="error">
                      {highPriorityRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      High Priority Rate
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Grid container spacing={1}>
                <Grid item>
                  <Chip 
                    label="Database Connected" 
                    color="success" 
                    size="small"
                  />
                </Grid>
                <Grid item>
                  <Chip 
                    label="API Active" 
                    color="success" 
                    size="small"
                  />
                </Grid>
                <Grid item>
                  <Chip 
                    label="Real-time Processing" 
                    color="success" 
                    size="small"
                  />
                </Grid>
                <Grid item>
                  <Chip 
                    label={`${avg_processing_time < 2000 ? 'Optimal' : 'Acceptable'} Performance`} 
                    color={avg_processing_time < 2000 ? "success" : "warning"} 
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 
import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

export function ResultsDisplay({ results }) {
  const { mismatches, processing_time_ms, total_keywords_checked, processing_skipped, skip_reason } = results;

  const highPriorityMismatches = mismatches?.filter(m => m.priority === 'High') || [];
  const mediumPriorityMismatches = mismatches?.filter(m => m.priority === 'Medium') || [];

  const getPriorityIcon = (priority) => {
    return priority === 'High' ? <WarningIcon color="error" /> : <InfoIcon color="info" />;
  };

  const getPriorityColor = (priority) => {
    return priority === 'High' ? 'error' : 'info';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'body_part': 'primary',
      'finding': 'secondary',
      'lab_test': 'success'
    };
    return colors[category] || 'default';
  };

  if (processing_skipped) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Processing Skipped
        </Typography>
        <Alert severity="info" icon={<CheckCircleIcon />}>
          {skip_reason}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Detection Results
      </Typography>

      {/* Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Total Mismatches
              </Typography>
              <Typography variant="h4" color="primary">
                {mismatches?.length || 0}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                High Priority
              </Typography>
              <Typography variant="h4" color="error">
                {highPriorityMismatches.length}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Processing Time
              </Typography>
              <Typography variant="h6">
                {processing_time_ms}ms
              </Typography>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="text.secondary">
                Keywords Checked
              </Typography>
              <Typography variant="h6">
                {total_keywords_checked}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* No Mismatches Found */}
      {(!mismatches || mismatches.length === 0) && (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          No gender mismatches detected in this report.
        </Alert>
      )}

      {/* High Priority Mismatches */}
      {highPriorityMismatches.length > 0 && (
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getPriorityIcon('High')}
              <Typography variant="h6" color="error">
                High Priority Mismatches ({highPriorityMismatches.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {highPriorityMismatches.map((mismatch, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {mismatch.keyword}
                          </Typography>
                          <Chip 
                            label={mismatch.category} 
                            size="small" 
                            color={getCategoryColor(mismatch.category)}
                          />
                          <Chip 
                            label={mismatch.priority} 
                            size="small" 
                            color={getPriorityColor(mismatch.priority)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Context: "{mismatch.context}"
                          </Typography>
                          {mismatch.subcategory && (
                            <Chip 
                              label={mismatch.subcategory} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < highPriorityMismatches.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Medium Priority Mismatches */}
      {mediumPriorityMismatches.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getPriorityIcon('Medium')}
              <Typography variant="h6" color="info.main">
                Medium Priority Mismatches ({mediumPriorityMismatches.length})
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {mediumPriorityMismatches.map((mismatch, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {mismatch.keyword}
                          </Typography>
                          <Chip 
                            label={mismatch.category} 
                            size="small" 
                            color={getCategoryColor(mismatch.category)}
                          />
                          <Chip 
                            label={mismatch.priority} 
                            size="small" 
                            color={getPriorityColor(mismatch.priority)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Context: "{mismatch.context}"
                          </Typography>
                          {mismatch.subcategory && (
                            <Chip 
                              label={mismatch.subcategory} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < mediumPriorityMismatches.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
} 
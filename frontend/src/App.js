import React, { useState } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Container, 
  Box,
  AppBar,
  Toolbar,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import { DetectionForm } from './components/DetectionForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { StatsDisplay } from './components/StatsDisplay';
import GTDatasetAnalysis from './components/GTDatasetAnalysis';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add error boundary
  React.useEffect(() => {
    console.log('App component mounted');
    console.log('Environment variables:', {
      SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
      SUPABASE_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
    });
  }, []);

  const handleResults = (detectionResults) => {
    setResults(detectionResults);
  };

  const handleError = (error) => {
    console.error('App error:', error);
    setError(error.message);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Gender Mismatch Detection System
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Detection Form */}
            <Paper elevation={3} sx={{ p: 3 }}>
              <DetectionForm 
                onResults={handleResults}
                loading={loading}
                setLoading={setLoading}
              />
            </Paper>

            {/* Results Display */}
            {results && (
              <Paper elevation={3} sx={{ p: 3 }}>
                <ResultsDisplay results={results} />
              </Paper>
            )}

            {/* GT Dataset Analysis */}
            <Paper elevation={3} sx={{ p: 3 }}>
              <GTDatasetAnalysis onError={handleError} />
            </Paper>

            {/* Stats Display */}
            <Paper elevation={3} sx={{ p: 3 }}>
              <StatsDisplay />
            </Paper>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 
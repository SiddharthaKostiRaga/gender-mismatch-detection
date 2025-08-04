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
  Paper
} from '@mui/material';
import { DetectionForm } from './components/DetectionForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { StatsDisplay } from './components/StatsDisplay';

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

  const handleResults = (detectionResults) => {
    setResults(detectionResults);
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
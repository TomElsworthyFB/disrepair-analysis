const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { calculateDisrepairOverlap } = require('./calculator');

/**
 * Main Express application configuration and setup
 * Sets up the API routes and middleware for the disrepair analysis tool
 */

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Simple test endpoint to check if API is running
 */
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

/**
 * Main API endpoint for disrepair analysis
 * Processes periods of disrepair and calculates overlaps
 */
app.post('/api/calculate-disrepair', (req, res) => {
  try {
    // Get disrepair periods and total rooms from request body
    const { periods, totalRooms, rooms } = req.body;
    
    // Validate input
    if (!periods || !Array.isArray(periods) || periods.length === 0) {
      return res.status(400).json({ error: 'Invalid input - Disrepair periods required' });
    }
    
    // Validate each period has required properties
    for (const period of periods) {
      if (!period.roomName || !period.startDate || !period.endDate) {
        return res.status(400).json({ 
          error: 'Invalid input - Each period must have roomName, startDate, and endDate' 
        });
      }
    }
    
    // For totalRooms: if explicitly provided, use it; otherwise calculate from unique rooms
    let effectiveTotalRooms = null;
    
    // If rooms array is provided, use its length
    if (rooms && Array.isArray(rooms)) {
      effectiveTotalRooms = rooms.length;
    } 
    // If totalRooms is provided and valid, use it
    else if (totalRooms && !isNaN(totalRooms) && totalRooms > 0) {
      effectiveTotalRooms = parseInt(totalRooms, 10);
    } 
    // Otherwise, calculate from unique room names in periods
    else {
      const uniqueRooms = new Set();
      periods.forEach(period => {
        if (period.roomName) {
          uniqueRooms.add(period.roomName);
        }
      });
      effectiveTotalRooms = uniqueRooms.size;
      console.log(`No totalRooms provided, using count of unique rooms: ${effectiveTotalRooms}`);
    }
    
    // Calculate overlapping periods with the determined totalRooms
    const results = calculateDisrepairOverlap(periods, effectiveTotalRooms);
    
    // Return results
    res.json(results);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ 
      error: 'Server error processing disrepair analysis',
      details: error.message
    });
  }
});

/**
 * API documentation endpoint
 * Serves the API documentation HTML page
 */
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/api-docs.html'));
});

/**
 * Start the server
 * Listens on the specified port (default: 3000)
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`- API available at http://localhost:${PORT}/api/calculate-disrepair`);
  console.log(`- Test interface at http://localhost:${PORT}`);
  console.log(`- API documentation at http://localhost:${PORT}/api-docs`);
});
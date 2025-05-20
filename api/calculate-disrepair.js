// api/calculate-disrepair.js
const { validateApiKey } = require('../middleware');
const { calculateDisrepairOverlap } = require('../calculator');

// Adapter function to use middleware with Vercel serverless functions
function applyMiddleware(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowedMethods: ['POST', 'OPTIONS']
    });
  }
  
  try {
    // Apply authentication middleware
    await applyMiddleware(req, res, validateApiKey);
    
    // If we get here, authentication was successful
    console.log(`API request from: ${req.client?.name || 'Unknown client'}`);
    
    // Get disrepair periods and total rooms from request body
    const { periods, totalRooms, rooms } = req.body;
    
    // Validate input
    if (!periods || !Array.isArray(periods) || periods.length === 0) {
      return res.status(400).json({
        error: 'Invalid input - Disrepair periods required'
      });
    }
    
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
    }
    
    // Calculate overlapping periods with the determined totalRooms
    const results = calculateDisrepairOverlap(periods, effectiveTotalRooms);
    
    // Return results
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Server error processing disrepair analysis',
      details: error.message
    });
  }
};
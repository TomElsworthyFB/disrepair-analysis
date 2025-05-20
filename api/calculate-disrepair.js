const { calculateDisrepairOverlap } = require('../calculator');

module.exports = (req, res) => {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  // Handle OPTIONS requests (for CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      method: req.method,
      allowedMethods: ['POST', 'OPTIONS']
    });
  }
  
  try {
    console.log('Request received:', req.url);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    // Check if body was properly parsed
    if (!req.body || typeof req.body !== 'object') {
      console.error('Invalid request body format:', req.body);
      return res.status(400).json({
        error: 'Invalid request format',
        receivedBodyType: typeof req.body,
        help: 'Make sure Content-Type is set to application/json'
      });
    }
    
    // Get disrepair periods and total rooms from request body
    const { periods, totalRooms, rooms } = req.body;
    
    // Validate input
    if (!periods || !Array.isArray(periods) || periods.length === 0) {
      return res.status(400).json({
        error: 'Invalid input - Disrepair periods required',
        receivedData: req.body
      });
    }
    
    for (const period of periods) {
      if (!period.roomName || !period.startDate || !period.endDate) {
        return res.status(400).json({ 
          error: 'Invalid input - Each period must have roomName, startDate, and endDate',
          invalidPeriod: period
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
    console.log('Calculating with totalRooms:', effectiveTotalRooms);
    const results = calculateDisrepairOverlap(periods, effectiveTotalRooms);
    console.log('Calculation results:', results);
    
    // Return results
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Server error processing disrepair analysis',
      details: error.message,
      stack: error.stack
    });
  }
};
/**
 * Calculate overlapping disrepair periods with percentage of property affected
 * @param {Array} periods - Array of disrepair periods with roomName, startDate, endDate
 * @param {Number} totalRooms - Total number of rooms in the property (defaults to number of unique rooms if not provided)
 * @returns {Array} Results with roomCount, weeksInDisrepair, and percentageOfProperty
 */
function calculateDisrepairOverlap(periods, totalRooms = null) {
  // Ensure totalRooms is valid (default to number of unique rooms if not provided)
  if (!totalRooms || totalRooms <= 0) {
    // Extract unique room names from the periods
    const uniqueRooms = new Set();
    periods.forEach(period => {
      if (period.roomName) {
        uniqueRooms.add(period.roomName);
      }
    });
    totalRooms = uniqueRooms.size;
    console.log(`Using count of unique rooms: ${totalRooms}`);
  }
  
  // Convert string dates to Date objects
  const processedPeriods = periods.map(period => ({
    ...period,
    startDate: new Date(formatDateForProcessing(period.startDate)),
    endDate: new Date(formatDateForProcessing(period.endDate))
  }));
  
  // Find overall date range
  const minDate = new Date(Math.min(...processedPeriods.map(p => p.startDate)));
  const maxDate = new Date(Math.max(...processedPeriods.map(p => p.endDate)));
  
  // Create a day-by-day timeline
  const timeline = [];
  const currentDate = new Date(minDate);
  
  while (currentDate <= maxDate) {
    timeline.push({
      date: new Date(currentDate),
      roomCount: 0
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Count rooms in disrepair for each day
  timeline.forEach(day => {
    processedPeriods.forEach(period => {
      if (day.date >= period.startDate && day.date <= period.endDate) {
        day.roomCount += 1;
      }
    });
  });
  
  // Group consecutive days with the same count
  const groupedPeriods = [];
  let currentGroup = null;
  
  timeline.forEach(day => {
    if (!currentGroup || currentGroup.roomCount !== day.roomCount) {
      if (currentGroup) {
        groupedPeriods.push(currentGroup);
      }
      
      currentGroup = {
        startDate: new Date(day.date),
        endDate: new Date(day.date),
        roomCount: day.roomCount
      };
    } else {
      currentGroup.endDate = new Date(day.date);
    }
  });
  
  if (currentGroup) {
    groupedPeriods.push(currentGroup);
  }
  
  // Calculate total weeks for each room count
  const roomCountTotals = {};
  
  groupedPeriods.forEach(period => {
    const { roomCount } = period;
    if (roomCount > 0) {
      const days = (period.endDate - period.startDate) / (1000 * 60 * 60 * 24) + 1;
      const weeks = days / 7.0;
      
      if (roomCountTotals[roomCount]) {
        roomCountTotals[roomCount] += weeks;
      } else {
        roomCountTotals[roomCount] = weeks;
      }
    }
  });
  
  // Format results with percentage calculations
  const results = Object.entries(roomCountTotals).map(([roomCount, weeks]) => {
    const count = parseInt(roomCount, 10);
    return {
      roomCount: count,
      weeksInDisrepair: parseFloat(weeks.toFixed(1)),
      percentageOfProperty: parseFloat(((count / totalRooms) * 100).toFixed(1))
    };
  });
  
  // Sort by room count
  return results.sort((a, b) => a.roomCount - b.roomCount);
}

/**
 * Format date from DD/MM/YYYY (UK format) to YYYY-MM-DD (ISO format)
 * @param {string} dateStr - Date string to format
 * @returns {string} Formatted date string in YYYY-MM-DD format
 */
function formatDateForProcessing(dateStr) {
  // Check if it's already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Parse DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  // Return as is if can't parse
  return dateStr;
}

module.exports = { calculateDisrepairOverlap };
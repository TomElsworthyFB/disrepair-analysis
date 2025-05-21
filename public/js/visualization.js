/**
 * visualization.js
 * Functions for displaying and visualizing disrepair analysis results
 */

/**
 * Display results in the results table
 * @param {Array} results - Analysis results from the API
 * @param {number} totalRooms - Total number of rooms in the property
 */
function displayResults(results, totalRooms) {
    const resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = '';
    
    if (!results || results.length === 0) {
        showMessage('No valid results returned');
        return;
    }
    
    let totalWeeks = 0;
    
    results.forEach(result => {
        const row = document.createElement('tr');
        
        const roomCountCell = document.createElement('td');
        roomCountCell.textContent = 
            `${result.roomCount} room${result.roomCount !== 1 ? 's' : ''}`;
        
        const weeksCell = document.createElement('td');
        weeksCell.textContent = `${result.weeksInDisrepair} weeks`;
        
        // Calculate percentage for display if not provided by API
        const percentageCell = document.createElement('td');
        const percentage = result.percentageOfProperty || 
                          ((result.roomCount / totalRooms) * 100).toFixed(1);
        percentageCell.textContent = `${percentage}%`;
        
        totalWeeks += parseFloat(result.weeksInDisrepair);
        
        row.appendChild(roomCountCell);
        row.appendChild(weeksCell);
        row.appendChild(percentageCell);
        resultsBody.appendChild(row);
    });
    
    // Add a summary row
    const summaryRow = document.createElement('tr');
    summaryRow.style.fontWeight = 'bold';
    
    const summaryLabelCell = document.createElement('td');
    summaryLabelCell.textContent = 'Total Weighted Impact:';
    
    const summaryValueCell = document.createElement('td');
    
    // Calculate a weighted score (more rooms = worse disrepair)
    let weightedScore = 0;
    results.forEach(result => {
        weightedScore += result.roomCount * result.weeksInDisrepair;
    });
    
    summaryValueCell.textContent = `${weightedScore.toFixed(1)} room-weeks`;
    
    // Add a percentage impact summary cell
    const summaryPercentageCell = document.createElement('td');
    
    // Calculate the average percentage impact (weighted by duration)
    let totalPercentageImpact = 0;
    results.forEach(result => {
        const percentage = result.percentageOfProperty || 
                          ((result.roomCount / totalRooms) * 100);
        totalPercentageImpact += percentage * result.weeksInDisrepair;
    });
    
    const averagePercentageImpact = totalPercentageImpact / totalWeeks;
    summaryPercentageCell.textContent = `${averagePercentageImpact.toFixed(1)}% avg.`;
    
    summaryRow.appendChild(summaryLabelCell);
    summaryRow.appendChild(summaryValueCell);
    summaryRow.appendChild(summaryPercentageCell);
    resultsBody.appendChild(summaryRow);
    
    document.getElementById('resultsContainer').style.display = 'block';
    
    // Show a success message
    showMessage('Analysis completed successfully', 'success');
}

/**
 * Display detailed calculation breakdown
 * @param {Array} originalPeriods - Original disrepair periods data
 * @param {Array} results - Analysis results
 */
function displayCalculationBreakdown(originalPeriods, results) {
    // Show the container
    document.getElementById('calculationBreakdownContainer').style.display = 'block';
    
    // Process the periods to ensure dates are Date objects
    const processedPeriods = originalPeriods.map(period => {
        let startDate, endDate;
        
        // Better date parsing for DD/MM/YYYY format
        if (typeof period.startDate === 'string' && period.startDate.includes('/')) {
            const [day, month, year] = period.startDate.split('/').map(Number);
            startDate = new Date(year, month - 1, day); // Month is 0-indexed in JavaScript
        } else {
            startDate = new Date(period.startDate);
        }
        
        if (typeof period.endDate === 'string' && period.endDate.includes('/')) {
            const [day, month, year] = period.endDate.split('/').map(Number);
            endDate = new Date(year, month - 1, day);
        } else {
            endDate = new Date(period.endDate);
        }
        
        return {
            roomName: period.roomName,
            startDate: startDate,
            endDate: endDate
        };
    });
    
    // Find overall date range
    const minDate = new Date(Math.min(...processedPeriods.map(p => p.startDate.getTime())));
    const maxDate = new Date(Math.max(...processedPeriods.map(p => p.endDate.getTime())));
    
    // Create a day-by-day timeline
    const timeline = [];
    const currentDate = new Date(minDate);
    
    while (currentDate <= maxDate) {
        const date = new Date(currentDate);
        
        // Find which rooms are in disrepair on this day
        const roomsInDisrepair = processedPeriods
            .filter(p => date >= p.startDate && date <= p.endDate)
            .map(p => p.roomName);
        
        timeline.push({
            date: date,
            roomCount: roomsInDisrepair.length,
            rooms: roomsInDisrepair
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Group consecutive days with the same room count
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
                roomCount: day.roomCount,
                rooms: [...day.rooms]
            };
        } else {
            currentGroup.endDate = new Date(day.date);
            // Rooms might change even if count remains the same
            currentGroup.rooms = [...day.rooms];
        }
    });
    
    if (currentGroup) {
        groupedPeriods.push(currentGroup);
    }
    
    // Render the visual timeline
    renderVisualTimeline(processedPeriods, minDate, maxDate);
    
    // Render day-by-day breakdown
    renderDayByDayBreakdown(timeline);
    
    // Render period groups breakdown
    renderPeriodGroupsBreakdown(groupedPeriods);
}

/**
 * Render visual timeline
 * @param {Array} periods - Disrepair periods to visualize
 * @param {Date} minDate - Minimum date in the dataset
 * @param {Date} maxDate - Maximum date in the dataset
 */
function renderVisualTimeline(periods, minDate, maxDate) {
    const container = document.getElementById('breakdownTimeline');
    container.innerHTML = '';
    
    // Calculate total days and scale
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Create a timeline for each room
    periods.forEach(period => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        
        const label = document.createElement('div');
        label.className = 'timeline-label';
        label.textContent = period.roomName;
        
        const bar = document.createElement('div');
        bar.className = 'timeline-bar';
        
        // Calculate position and width
        const startOffset = Math.max(0, (period.startDate - minDate) / (1000 * 60 * 60 * 24));
        const width = (period.endDate - period.startDate) / (1000 * 60 * 60 * 24) + 1;
        
        const disrepairBar = document.createElement('div');
        disrepairBar.className = 'disrepair-period';
        disrepairBar.style.left = `${(startOffset / totalDays) * 100}%`;
        disrepairBar.style.width = `${(width / totalDays) * 100}%`;
        disrepairBar.title = `${formatDisplayDate(period.startDate)} to ${formatDisplayDate(period.endDate)}`;
        
        bar.appendChild(disrepairBar);
        timelineItem.appendChild(label);
        timelineItem.appendChild(bar);
        container.appendChild(timelineItem);
    });
    
    // Add date scale with clearer month markers
    const scale = document.createElement('div');
    scale.className = 'timeline-scale';
    
    const scaleBar = document.createElement('div');
    scaleBar.className = 'timeline-bar';
    scaleBar.style.height = '20px';
    scaleBar.style.marginTop = '5px';
    
    // Add month markers
    let currentMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    
    while (currentMonth <= maxDate) {
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        
        // Calculate position
        const monthOffset = Math.max(0, (currentMonth - minDate) / (1000 * 60 * 60 * 24));
        
        const marker = document.createElement('div');
        marker.className = 'month-marker';
        marker.style.left = `${(monthOffset / totalDays) * 100}%`;
        
        const label = document.createElement('div');
        label.className = 'month-label';
        label.textContent = currentMonth.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
        
        marker.appendChild(label);
        scaleBar.appendChild(marker);
        
        currentMonth = nextMonth;
    }
    
    scale.appendChild(scaleBar);
    container.appendChild(scale);
}

/**
 * Render day-by-day breakdown table
 * @param {Array} timeline - Array of daily room counts
 */
function renderDayByDayBreakdown(timeline) {
    const tbody = document.getElementById('dayByDayBody');
    tbody.innerHTML = '';
    
    timeline.forEach(day => {
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formatDisplayDate(day.date);
        
        const countCell = document.createElement('td');
        countCell.textContent = day.roomCount;
        
        const roomsCell = document.createElement('td');
        roomsCell.textContent = day.rooms.join(', ');
        
        row.appendChild(dateCell);
        row.appendChild(countCell);
        row.appendChild(roomsCell);
        tbody.appendChild(row);
    });
}

/**
 * Render period groups breakdown table
 * @param {Array} groupedPeriods - Grouped periods with same room count
 */
function renderPeriodGroupsBreakdown(groupedPeriods) {
    const tbody = document.getElementById('periodGroupsBody');
    tbody.innerHTML = '';
    
    groupedPeriods.forEach(period => {
        if (period.roomCount > 0) { // Only show periods with rooms in disrepair
            const row = document.createElement('tr');
            
            const startDateCell = document.createElement('td');
            startDateCell.textContent = formatDisplayDate(period.startDate);
            
            const endDateCell = document.createElement('td');
            endDateCell.textContent = formatDisplayDate(period.endDate);
            
            const countCell = document.createElement('td');
            countCell.textContent = `${period.roomCount} room${period.roomCount !== 1 ? 's' : ''}`;
            
            const days = Math.round((period.endDate - period.startDate) / (1000 * 60 * 60 * 24)) + 1;
            const daysCell = document.createElement('td');
            daysCell.textContent = days;
            
            const weeksCell = document.createElement('td');
            weeksCell.textContent = (days / 7).toFixed(1);
            
            row.appendChild(startDateCell);
            row.appendChild(endDateCell);
            row.appendChild(countCell);
            row.appendChild(daysCell);
            row.appendChild(weeksCell);
            tbody.appendChild(row);
        }
    });
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDisplayDate(date) {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

/**
 * Create a visual heatmap of disrepair intensity
 * @param {Array} results - Analysis results
 * @param {number} totalRooms - Total rooms in property
 */
function createDisrepairHeatmap(results, totalRooms) {
    // This is a placeholder for future enhancement
    // A heatmap visualization could be added here to show intensity of disrepair over time
    console.log('Heatmap visualization would be generated here');
}

/**
 * Generate a printable report of the analysis
 * @param {Array} results - Analysis results
 * @param {Array} originalPeriods - Original disrepair periods
 * @param {number} totalRooms - Total rooms in property
 */
function generatePrintableReport(results, originalPeriods, totalRooms) {
    // This is a placeholder for future enhancement
    // Could generate a PDF or printable HTML version of the results
    console.log('Printable report would be generated here');
}

// Export functions to global scope
window.visualization = {
    displayResults,
    displayCalculationBreakdown,
    renderVisualTimeline,
    renderDayByDayBreakdown,
    renderPeriodGroupsBreakdown,
    formatDisplayDate,
    createDisrepairHeatmap,
    generatePrintableReport
};
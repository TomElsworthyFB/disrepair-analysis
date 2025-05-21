/**
 * visualization.js
 * Functions for displaying and visualizing disrepair analysis results
 */

// Define the visualization object at the top of the file
window.visualization = {
    displayResults: function(results, totalRooms) {
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
    },
    
    displayCalculationBreakdown: function(originalPeriods, results) {
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
        this.renderVisualTimeline(processedPeriods, minDate, maxDate);
        
        // Render day-by-day breakdown
        this.renderDayByDayBreakdown(timeline);
        
        // Render period groups breakdown
        this.renderPeriodGroupsBreakdown(groupedPeriods);
    },
    
    // Enhanced timeline rendering function
    renderVisualTimeline: function(periods, minDate, maxDate) {
        const container = document.getElementById('breakdownTimeline');
        container.innerHTML = '';
        
        // Calculate total days and scale
        const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
        const totalMonths = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
                             maxDate.getMonth() - minDate.getMonth() + 1;
        const totalYears = maxDate.getFullYear() - minDate.getFullYear() + 
                           (maxDate.getMonth() >= minDate.getMonth() ? 1 : 0);
        
        console.log("Timeline parameters:", {
            minDate: minDate.toISOString().split('T')[0],
            maxDate: maxDate.toISOString().split('T')[0],
            totalDays,
            totalMonths,
            totalYears
        });
        
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
            
            // Enhanced tooltip with clearer date formatting
            const startDateStr = this.formatDisplayDate(period.startDate);
            const endDateStr = this.formatDisplayDate(period.endDate);
            const durationWeeks = (width / 7).toFixed(1);
            disrepairBar.title = `${period.roomName}: ${startDateStr} to ${endDateStr} (${durationWeeks} weeks)`;
            
            bar.appendChild(disrepairBar);
            timelineItem.appendChild(label);
            timelineItem.appendChild(bar);
            container.appendChild(timelineItem);
        });
        
        // Add year separators for multi-year views
        if (totalYears > 1) {
            this.addYearSeparators(container, minDate, maxDate, totalDays);
        }
        
        // Create an intelligent scale based on the time span
        this.createTimelineScale(container, minDate, maxDate, totalDays, totalMonths, totalYears);
        
        // Add a timeline legend
        this.addTimelineLegend(container);
        
        // Add today marker if the current date falls within the timeline
        const today = new Date();
        if (today >= minDate && today <= maxDate) {
            this.addTodayMarker(container, minDate, today, totalDays);
        }
    },

/**
 * Optimized timeline scale function that works well for both short and long time periods
 */
createTimelineScale: function(container, minDate, maxDate, totalDays, totalMonths, totalYears) {
    console.log("Timeline scale parameters:", {
        minDate: minDate.toISOString().split('T')[0],
        maxDate: maxDate.toISOString().split('T')[0],
        totalDays,
        totalMonths,
        totalYears
    });

    const scale = document.createElement('div');
    scale.className = 'timeline-scale';
    
    const scaleBar = document.createElement('div');
    scaleBar.className = 'timeline-bar scale-bar';
    
    // Calculate months between min and max dates
    let monthsDifference = (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
                          maxDate.getMonth() - minDate.getMonth();
                          
    console.log(`Months difference: ${monthsDifference}`);
    
    // For short periods (<=6 months), show more detailed markers
    let shortPeriod = monthsDifference <= 6;
    
    // Decision logic for which markers to show
    let showDays = shortPeriod && totalDays <= 60; // Show days for very short periods
    let showAllMonths = !showDays || monthsDifference <= 24; // Always show months for periods <= 2 years
    let showQuarters = monthsDifference > 24 && totalYears < 5;
    let showOnlyYears = totalYears >= 5;
    
    console.log("Display decision:", { showDays, showAllMonths, showQuarters, showOnlyYears });
    
    // Add year markers first (if applicable)
    if (totalMonths > 1) {
        for (let year = minDate.getFullYear(); year <= maxDate.getFullYear(); year++) {
            // Only add year markers if we span multiple years or are showing the start of a year
            if (minDate.getFullYear() !== maxDate.getFullYear() || 
                (minDate.getMonth() <= 0 && maxDate.getMonth() >= 0)) {
                
                const yearDate = new Date(year, 0, 1);
                
                // Skip if not in range
                if (yearDate < minDate || yearDate > maxDate) continue;
                
                const offsetDays = Math.max(0, (yearDate - minDate) / (1000 * 60 * 60 * 24));
                const position = (offsetDays / totalDays) * 100;
                
                const marker = document.createElement('div');
                marker.className = 'time-marker year-marker';
                marker.style.left = `${position}%`;
                
                const label = document.createElement('div');
                label.className = 'time-label';
                label.textContent = year;
                
                marker.appendChild(label);
                scaleBar.appendChild(marker);
                
                console.log(`Added year marker: ${year} at position ${position.toFixed(2)}%`);
            }
        }
    }
    
    // Add month markers
    if (showAllMonths || showQuarters) {
        // Define which months to show
        let monthsToShow = [];
        
        if (showAllMonths) {
            // All months
            monthsToShow = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        } else if (showQuarters) {
            // Quarters only
            monthsToShow = [0, 3, 6, 9];
        }
        
        // Start with the month of minDate and go until the month of maxDate
        const startYear = minDate.getFullYear();
        const startMonth = minDate.getMonth();
        const endYear = maxDate.getFullYear();
        const endMonth = maxDate.getMonth();
        
        for (let year = startYear; year <= endYear; year++) {
            const firstMonthToShow = (year === startYear) ? startMonth : 0;
            const lastMonthToShow = (year === endYear) ? endMonth : 11;
            
            for (let month = firstMonthToShow; month <= lastMonthToShow; month++) {
                // Skip if this month is not in our monthsToShow array
                if (!showAllMonths && !monthsToShow.includes(month)) continue;
                
                // Skip January if showing year markers (to avoid duplication)
                if (month === 0 && scaleBar.querySelector(`.year-marker[style*="left: ${(new Date(year, 0, 1) - minDate) / (1000 * 60 * 60 * 24) / totalDays * 100}%"]`)) {
                    continue;
                }
                
                const monthDate = new Date(year, month, 1);
                const offsetDays = Math.max(0, (monthDate - minDate) / (1000 * 60 * 60 * 24));
                const position = (offsetDays / totalDays) * 100;
                
                const marker = document.createElement('div');
                marker.className = 'time-marker month-marker';
                marker.style.left = `${position}%`;
                
                const label = document.createElement('div');
                label.className = 'time-label';
                
                // Format based on whether we're showing quarters or months
                if (showQuarters && month % 3 === 0) {
                    const quarter = Math.floor(month / 3) + 1;
                    label.textContent = `Q${quarter}`;
                } else {
                    // Show month name
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    // For short periods, also add the year if spanning multiple years
                    if (totalYears > 1) {
                        label.textContent = `${monthNames[month]} ${year}`;
                    } else {
                        label.textContent = monthNames[month];
                    }
                }
                
                marker.appendChild(label);
                scaleBar.appendChild(marker);
                
                console.log(`Added month marker: ${label.textContent} at position ${position.toFixed(2)}%`);
            }
        }
    }
    
    // For very short periods, add day markers
    if (showDays) {
        // Only add day markers for periods of 60 days or less
        // Use every 5th or 10th day depending on total days
        const dayStep = totalDays <= 30 ? 5 : 10;
        
        // Start from the 1st, 5th, or 10th day of the month
        let startDay = minDate.getDate();
        startDay = Math.ceil(startDay / dayStep) * dayStep;
        
        let currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), startDay);
        
        while (currentDate <= maxDate) {
            const offsetDays = Math.max(0, (currentDate - minDate) / (1000 * 60 * 60 * 24));
            const position = (offsetDays / totalDays) * 100;
            
            // Skip if too close to month marker (within 5% of timeline width)
            const tooCloseToMonthMarker = Array.from(scaleBar.querySelectorAll('.month-marker, .year-marker'))
                .some(marker => {
                    const markerPosition = parseFloat(marker.style.left);
                    return Math.abs(markerPosition - position) < 5;
                });
                
            if (!tooCloseToMonthMarker) {
                const marker = document.createElement('div');
                marker.className = 'time-marker day-marker';
                marker.style.left = `${position}%`;
                
                const label = document.createElement('div');
                label.className = 'time-label';
                label.textContent = currentDate.getDate();
                
                marker.appendChild(label);
                scaleBar.appendChild(marker);
                
                console.log(`Added day marker: ${currentDate.getDate()} at position ${position.toFixed(2)}%`);
            }
            
            // Move to next marker day
            currentDate.setDate(currentDate.getDate() + dayStep);
        }
    }
    
    scale.appendChild(scaleBar);
    container.appendChild(scale);
    
    console.log(`Timeline scale created with ${scaleBar.children.length} markers`);
    
    // After all markers are added, remove any that would overlap
    this.fixOverlappingMarkers(scaleBar);
},

/**
 * Fixes overlapping markers by removing some to ensure clear spacing
 * @param {HTMLElement} scaleBar - The scale bar element containing markers
 */
fixOverlappingMarkers: function(scaleBar) {
    const markers = Array.from(scaleBar.querySelectorAll('.time-marker'));
    const minSpacing = 8; // Minimum spacing in percentage
    
    // Sort markers by position
    markers.sort((a, b) => {
        return parseFloat(a.style.left) - parseFloat(b.style.left);
    });
    
    // First pass: Keep year markers, remove overlapping month markers
    for (let i = 0; i < markers.length - 1; i++) {
        const current = markers[i];
        const next = markers[i + 1];
        
        const currentPos = parseFloat(current.style.left);
        const nextPos = parseFloat(next.style.left);
        
        if (nextPos - currentPos < minSpacing) {
            // If next is a year marker and current is not, remove current
            if (next.classList.contains('year-marker') && !current.classList.contains('year-marker')) {
                current.remove();
                markers.splice(i, 1);
                i--; // Adjust index as we removed an item
            }
            // If current is a year marker and next is not, remove next
            else if (current.classList.contains('year-marker') && !next.classList.contains('year-marker')) {
                next.remove();
                markers.splice(i + 1, 1);
                i--; // Adjust index as we removed an item
            }
            // If both are month markers, remove the next one
            else if (!current.classList.contains('year-marker') && !next.classList.contains('year-marker')) {
                next.remove();
                markers.splice(i + 1, 1);
                i--; // Adjust index as we removed an item
            }
        }
    }
    
    console.log(`After removing overlapping markers: ${scaleBar.children.length} markers remain`);
},

addYearSeparators: function(container, minDate, maxDate, totalDays) {
    // Add separators for each year boundary (except first)
    for (let year = minDate.getFullYear() + 1; year <= maxDate.getFullYear(); year++) {
        const yearStart = new Date(year, 0, 1);
        
        // Only add if this year boundary falls within our range
        if (yearStart > minDate && yearStart < maxDate) {
            const offsetDays = (yearStart - minDate) / (1000 * 60 * 60 * 24);
            const position = (offsetDays / totalDays) * 100;
            
            const separator = document.createElement('div');
            separator.className = 'year-separator';
            separator.style.left = `${position}%`;
            container.appendChild(separator);
        }
    }
},
    addTodayMarker: function(container, minDate, today, totalDays) {
        const offsetDays = (today - minDate) / (1000 * 60 * 60 * 24);
        const position = (offsetDays / totalDays) * 100;
        
        const marker = document.createElement('div');
        marker.className = 'today-marker';
        marker.style.left = `${position}%`;
        
        const label = document.createElement('div');
        label.className = 'today-label';
        label.textContent = 'Today';
        marker.appendChild(label);
        
        container.appendChild(marker);
    },

    addTimelineLegend: function(container) {
        // First remove any existing legend
        const existingLegend = container.querySelector('.timeline-legend');
        if (existingLegend) {
            existingLegend.remove();
        }

        const legend = document.createElement('div');
        legend.className = 'timeline-legend';
        
        // Disrepair period legend item
        const disrepairItem = document.createElement('div');
        disrepairItem.className = 'legend-item';
        
        const disrepairColor = document.createElement('div');
        disrepairColor.className = 'legend-color disrepair';
        
        const disrepairLabel = document.createElement('span');
        disrepairLabel.textContent = 'Period of Disrepair';
        
        disrepairItem.appendChild(disrepairColor);
        disrepairItem.appendChild(disrepairLabel);
        legend.appendChild(disrepairItem);
        
        container.appendChild(legend);
    },
    
    renderDayByDayBreakdown: function(timeline) {
        const tbody = document.getElementById('dayByDayBody');
        tbody.innerHTML = '';
        
        timeline.forEach(day => {
            const row = document.createElement('tr');
            
            const dateCell = document.createElement('td');
            dateCell.textContent = this.formatDisplayDate(day.date);
            
            const countCell = document.createElement('td');
            countCell.textContent = day.roomCount;
            
            const roomsCell = document.createElement('td');
            roomsCell.textContent = day.rooms.join(', ');
            
            row.appendChild(dateCell);
            row.appendChild(countCell);
            row.appendChild(roomsCell);
            tbody.appendChild(row);
        });
    },
    
    renderPeriodGroupsBreakdown: function(groupedPeriods) {
        const tbody = document.getElementById('periodGroupsBody');
        tbody.innerHTML = '';
        
        groupedPeriods.forEach(period => {
            if (period.roomCount > 0) { // Only show periods with rooms in disrepair
                const row = document.createElement('tr');
                
                const startDateCell = document.createElement('td');
                startDateCell.textContent = this.formatDisplayDate(period.startDate);
                
                const endDateCell = document.createElement('td');
                endDateCell.textContent = this.formatDisplayDate(period.endDate);
                
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
    },
    
    formatDisplayDate: function(date) {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    },
    
    createDisrepairHeatmap: function(results, totalRooms) {
        // This is a placeholder for future enhancement
        console.log('Heatmap visualization would be generated here');
    },
    
    generatePrintableReport: function(results, originalPeriods, totalRooms) {
        // This is a placeholder for future enhancement
        console.log('Printable report would be generated here');
    }
};

// Make sure the showMessage function is available
if (typeof showMessage !== 'function') {
    function showMessage(message, type = 'error') {
        const messageContainer = document.getElementById('messageContainer');
        messageContainer.textContent = message;
        messageContainer.className = type;
        messageContainer.style.display = 'block';
        document.getElementById('loadingIndicator').style.display = 'none';
    }
    
    // Add to window if it doesn't exist
    if (typeof window.showMessage !== 'function') {
        window.showMessage = showMessage;
    }
}

// Log that the visualization module is loaded
console.log('Visualization module loaded:', Object.keys(window.visualization));
/**
 * api-client.js
 * Functions for interacting with the disrepair analysis API
 */

// Make sure visualization is globally available
if (!window.visualization) {
    console.error('Visualization module not loaded. Please check script loading order.');
}

/**
 * Gets the headers to use for API requests
 * @returns {Object} Headers object
 */
function getApiHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Lexiotech-Frontend': 'true'
    };
}

/**
 * Tests the API connection
 */
async function testConnection() {
    let apiUrl = document.getElementById('apiUrl').value;
    
    // Standardise the API URL format
    if (!apiUrl.startsWith('/')) {
        apiUrl = '/' + apiUrl;
    }
    
    // Extract the base path (everything before /api/)
    let basePath = '';
    if (apiUrl.includes('/api/')) {
        basePath = apiUrl.substring(0, apiUrl.indexOf('/api/'));
    }
    
    // Form the ping URL correctly
    const pingUrl = `${basePath}/api/ping`;
    
    console.log('Testing connection to:', pingUrl);
    
    const statusContainer = document.getElementById('connectionStatus');
    
    statusContainer.innerHTML = 'Testing connection...';
    statusContainer.style.display = 'block';
    statusContainer.style.backgroundColor = '#f8f9fa';
    
    try {
        const response = await fetch(pingUrl, {
            headers: getApiHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'ok') {
            statusContainer.innerHTML = `✅ Connection successful! API is running. Authenticated as: ${data.clientName || 'Unknown client'}`;
            statusContainer.style.backgroundColor = '#d4efdf';
            statusContainer.className = 'status-container success';
        } else {
            throw new Error('Unexpected response from API');
        }
    } catch (error) {
        statusContainer.innerHTML = `❌ Connection failed: ${error.message}`;
        statusContainer.style.backgroundColor = '#fadbd8';
        statusContainer.className = 'status-container error';
        console.error('Connection test error:', error);
    }
}

/**
 * Analyzes disrepair data via the API
 */
async function analyzeData() {
    // First, make sure visualization module is loaded
    if (!window.visualization || typeof window.visualization.displayResults !== 'function') {
        showMessage('Error: Visualization module not loaded correctly. Please refresh the page.');
        console.error('Visualization module missing or incomplete:', window.visualization);
        return;
    }

    const dataInput = document.getElementById('dataInput').value.trim();
    const format = document.getElementById('format').value;
    const apiUrl = document.getElementById('apiUrl').value;
    const totalRooms = parseInt(document.getElementById('totalRooms').value, 10);
    
    // Show loading indicator
    toggleLoading(true);
    document.getElementById('messageContainer').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('calculationBreakdownContainer').style.display = 'none';
    
    // Validate input
    if (!dataInput) {
        showMessage('Please enter data to analyze');
        return;
    }
    
    // Validate total rooms
    if (isNaN(totalRooms) || totalRooms < 1) {
        showMessage('Total rooms must be a positive number');
        return;
    }
    
    try {
        // Parse input data
        let requestData = {};
        let originalPeriods = []; // Store the original periods for breakdown
        
        if (format === 'csv') {
            try {
                // Check if fileHandling module is available
                if (!window.fileHandling || typeof window.fileHandling.parseCsv !== 'function') {
                    throw new Error('File handling module not loaded correctly');
                }
                
                // Check if validation module is available
                if (!window.validation || typeof window.validation.validateCsvStructure !== 'function') {
                    throw new Error('Validation module not loaded correctly');
                }
                
                // Validate CSV structure
                window.validation.validateCsvStructure(dataInput);
                
                // Parse the CSV into the periods array
                const periods = window.fileHandling.parseCsv(dataInput);
                if (periods.length === 0) {
                    throw new Error('No valid periods found in CSV');
                }
                
                // Save original periods for breakdown
                originalPeriods = periods;
                
                // Convert dates to ISO format for API
                const transformedPeriods = periods.map(period => ({
                    roomName: period.roomName,
                    startDate: formatDateForAPI(period.startDate),
                    endDate: formatDateForAPI(period.endDate)
                }));
                
                requestData = { 
                    periods: transformedPeriods,
                    totalRooms: totalRooms
                };
            } catch (error) {
                showMessage(`CSV error: ${error.message}`);
                return;
            }
        } else {
            // Try to parse as JSON
            try {
                // Check if validation module is available
                if (!window.validation || typeof window.validation.validateJsonStructure !== 'function') {
                    throw new Error('Validation module not loaded correctly');
                }
                
                // Validate JSON structure
                window.validation.validateJsonStructure(dataInput);
                
                // Parse the data
                const parsedData = JSON.parse(dataInput);
                
                // Extract the periods array
                const periodsArray = Array.isArray(parsedData) ? parsedData : parsedData.periods;
                
                // Save original periods for breakdown
                originalPeriods = periodsArray;
                
                // Convert dates to ISO format for API
                const transformedPeriods = periodsArray.map(period => ({
                    roomName: period.roomName,
                    startDate: formatDateForAPI(period.startDate),
                    endDate: formatDateForAPI(period.endDate)
                }));
                
                requestData = { 
                    periods: transformedPeriods,
                    totalRooms: totalRooms
                };
            } catch (error) {
                showMessage(`JSON error: ${error.message}`);
                return;
            }
        }
        
        console.log('Sending data to API:', requestData);
        
        // Make API request
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify(requestData)
        });
        
        // Hide loading indicator
        toggleLoading(false);
        
        // Handle errors
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `API error: ${response.status}`);
        }
        
        // Process and display results
        const results = await response.json();
        
        console.log('Displaying results with visualization module:', window.visualization);
        window.visualization.displayResults(results, totalRooms);
        
        // Now display the calculation breakdown with the original periods
        window.visualization.displayCalculationBreakdown(originalPeriods, results);
        
    } catch (error) {
        showMessage(`Error: ${error.message}`);
        console.error('Analysis error:', error);
    }
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD (for API)
 * @param {string} dateStr - Date string in DD/MM/YYYY format
 * @returns {string} Date string in YYYY-MM-DD format
 */
function formatDateForAPI(dateStr) {
    const parts = dateStr.trim().split('/');
    if (parts.length !== 3) return dateStr; // Return as is if not in expected format
    
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    
    return `${year}-${month}-${day}`;
}

// Make sure showMessage and toggleLoading are defined
if (typeof showMessage !== 'function') {
    function showMessage(message, type = 'error') {
        const messageContainer = document.getElementById('messageContainer');
        messageContainer.textContent = message;
        messageContainer.className = type;
        messageContainer.style.display = 'block';
        if (document.getElementById('loadingIndicator')) {
            document.getElementById('loadingIndicator').style.display = 'none';
        }
    }
    
    // Add to window if it doesn't exist
    if (typeof window.showMessage !== 'function') {
        window.showMessage = showMessage;
    }
}

if (typeof toggleLoading !== 'function') {
    function toggleLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }
    }
    
    // Add to window if it doesn't exist
    if (typeof window.toggleLoading !== 'function') {
        window.toggleLoading = toggleLoading;
    }
}

// Export functions to the global scope
window.apiClient = {
    testConnection,
    analyzeData,
    getApiHeaders,
    formatDateForAPI
};

console.log('API Client module loaded:', window.apiClient);
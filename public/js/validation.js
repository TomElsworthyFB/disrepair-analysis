/**
 * validation.js
 * Functions for validating input data
 */

/**
 * Validate input data manually
 */
function validateInputData() {
    const dataInput = document.getElementById('dataInput').value.trim();
    const format = document.getElementById('format').value;
    
    if (!dataInput) {
        showMessage('No data to validate. Please enter or upload data first.');
        return;
    }
    
    try {
        let valid = false;
        let message = '';
        
        if (format === 'csv') {
            valid = validateCsvStructure(dataInput);
            if (valid) {
                const periods = window.fileHandling.parseCsv(dataInput);
                message = `✅ Valid CSV with ${periods.length} disrepair period(s)`;
            }
        } else {
            valid = validateJsonStructure(dataInput);
            const data = JSON.parse(dataInput);
            const periods = Array.isArray(data) ? data : data.periods;
            message = `✅ Valid JSON with ${periods.length} disrepair period(s)`;
        }
        
        showMessage(message, 'success');
    } catch (error) {
        showMessage(`Validation error: ${error.message}`);
    }
}

/**
 * Function to validate CSV structure
 * @param {string} csvContent - The CSV content to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateCsvStructure(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV must have a header row and at least one data row');
    }
    
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const requiredFieldPatterns = [
        /room.*name|name.*room/i,
        /start.*date|date.*start/i,
        /end.*date|date.*end/i
    ];
    
    // Check for required fields (allowing for variations in naming)
    for (let i = 0; i < requiredFieldPatterns.length; i++) {
        const pattern = requiredFieldPatterns[i];
        if (!headers.some(h => pattern.test(h))) {
            const fieldNames = ['room name', 'start date', 'end date'];
            throw new Error(`CSV must include a column for ${fieldNames[i]}`);
        }
    }
    
    // Validate each data row
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = lines[i].split(',');
        if (values.length !== headers.length) {
            throw new Error(`Row ${i+1} has an incorrect number of fields`);
        }
        
        // Get indices for date fields
        const startDateIndex = headers.findIndex(h => /start.*date|date.*start/i.test(h));
        const endDateIndex = headers.findIndex(h => /end.*date|date.*end/i.test(h));
        
        // Validate date formats if indices were found
        if (startDateIndex >= 0 && !isValidDate(values[startDateIndex].trim())) {
            throw new Error(`Row ${i+1} has an invalid start date format. Use DD/MM/YYYY format.`);
        }
        
        if (endDateIndex >= 0 && !isValidDate(values[endDateIndex].trim())) {
            throw new Error(`Row ${i+1} has an invalid end date format. Use DD/MM/YYYY format.`);
        }
    }
    
    return true;
}

/**
 * Function to validate JSON structure
 * @param {string} jsonContent - The JSON content to validate
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
function validateJsonStructure(jsonContent) {
    let jsonData;
    
    try {
        jsonData = JSON.parse(jsonContent);
    } catch (e) {
        throw new Error(`Invalid JSON syntax: ${e.message}`);
    }
    
    // Handle the case where the JSON is an array of periods
    if (Array.isArray(jsonData)) {
        jsonData = { periods: jsonData };
    }
    
    if (!jsonData.periods) {
        throw new Error('JSON must have a "periods" array');
    }
    
    if (!Array.isArray(jsonData.periods)) {
        throw new Error('The "periods" property must be an array');
    }
    
    if (jsonData.periods.length === 0) {
        throw new Error('The "periods" array must have at least one item');
    }
    
    // Validate each period
    for (let i = 0; i < jsonData.periods.length; i++) {
        const period = jsonData.periods[i];
        
        if (!period.roomName) {
            throw new Error(`Period at index ${i} is missing roomName`);
        }
        
        if (!period.startDate) {
            throw new Error(`Period at index ${i} is missing startDate`);
        }
        
        if (!period.endDate) {
            throw new Error(`Period at index ${i} is missing endDate`);
        }
        
        // Validate date formats
        if (!isValidDate(period.startDate)) {
            throw new Error(`Period at index ${i} has an invalid startDate format. Use DD/MM/YYYY format.`);
        }
        
        if (!isValidDate(period.endDate)) {
            throw new Error(`Period at index ${i} has an invalid endDate format. Use DD/MM/YYYY format.`);
        }
    }
    
    return true;
}

/**
 * Helper function to validate date format (DD/MM/YYYY)
 * @param {string} dateStr - The date string to validate
 * @returns {boolean} True if valid
 */
function isValidDate(dateStr) {
    // Accept UK format (DD/MM/YYYY)
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    
    const match = dateStr.trim().match(datePattern);
    if (!match) {
        return false;
    }
    
    // Extract day, month, year
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
    const year = parseInt(match[3], 10);
    
    // Create date and check if valid
    const date = new Date(year, month, day);
    return date.getDate() === day && 
           date.getMonth() === month && 
           date.getFullYear() === year;
}

// Export functions to global scope
window.validation = {
    validateInputData,
    validateCsvStructure,
    validateJsonStructure,
    isValidDate
};
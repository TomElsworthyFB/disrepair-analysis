/**
 * file-handling.js
 * Functions for handling file operations, uploads, downloads and sample data
 */

// Sample data for quick testing (with DD/MM/YYYY format and totalRooms)
const sampleJsonData = {
    totalRooms: 10,
    periods: [
        {
            roomName: "Bedroom 1",
            startDate: "12/01/2025",
            endDate: "09/05/2025"
        },
        {
            roomName: "Roof",
            startDate: "03/03/2025",
            endDate: "30/04/2025"
        },
        {
            roomName: "Kitchen",
            startDate: "15/03/2025",
            endDate: "12/05/2025"
        }
    ]
};

const sampleCsvData = 
`roomName,startDate,endDate
Bedroom 1,12/01/2025,09/05/2025
Roof,03/03/2025,30/04/2025
Kitchen,15/03/2025,12/05/2025`;

/**
 * Update file name display when a file is selected
 */
function updateFileName() {
    const fileInput = document.getElementById('fileUpload');
    const fileNameElement = document.getElementById('fileName');
    
    if (fileInput.files.length > 0) {
        fileNameElement.textContent = fileInput.files[0].name;
    } else {
        fileNameElement.textContent = 'No file selected';
    }
}

/**
 * Process the uploaded file with security enhancements
 */
function processUploadedFile() {
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];
    
    if (!file) {
        showMessage('Please select a file to upload');
        return;
    }
    
    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
        showMessage('File too large. Maximum size is 1MB.');
        return;
    }
    
    // Validate MIME type
    const validTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel', 'text/plain'];
    if (!validTypes.includes(file.type) && 
        !(file.type === '' && (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.json')))) {
        showMessage('Invalid file type. Please upload a CSV or JSON file.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const contents = e.target.result;
        
        // Determine file type from extension
        const fileName = file.name.toLowerCase();
        
        try {
            if (fileName.endsWith('.csv')) {
                // Validate CSV structure
                window.validation.validateCsvStructure(contents);
                document.getElementById('format').value = 'csv';
                document.getElementById('dataInput').value = sanitizeInput(contents);
                showMessage(`CSV file "${sanitizeFilename(file.name)}" loaded successfully`, 'success');
            } else if (fileName.endsWith('.json')) {
                // Validate JSON structure
                window.validation.validateJsonStructure(contents);
                document.getElementById('format').value = 'json';
                document.getElementById('dataInput').value = contents;
                
                // If JSON has totalRooms, update the input field
                try {
                    const jsonData = JSON.parse(contents);
                    if (jsonData.totalRooms) {
                        document.getElementById('totalRooms').value = jsonData.totalRooms;
                    }
                } catch (e) {
                    // Ignore parsing errors here as the main validation already passed
                }
                
                showMessage(`JSON file "${sanitizeFilename(file.name)}" loaded successfully`, 'success');
            } else {
                showMessage('Unsupported file type. Please upload a CSV or JSON file.');
            }
        } catch (error) {
            showMessage(`File validation error: ${error.message}`);
        }
    };
    
    reader.onerror = function() {
        showMessage('Error reading file');
    };
    
    reader.readAsText(file);
}

/**
 * Sanitize input to prevent XSS
 * @param {string} input - The input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
    // Basic sanitization - remove script tags and other potentially dangerous content
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/on\w+="[^"]*"/g, '')
                .replace(/javascript:/g, '');
}

/**
 * Sanitize filename for display
 * @param {string} filename - The filename to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    return filename.replace(/[^\w\s.-]/g, '');
}

/**
 * Parse CSV data into JSON
 * @param {string} csvData - CSV data string
 * @returns {Array} Array of parsed objects
 */
function parseCsv(csvData) {
    const lines = csvData.trim().split('\n');
    const rawHeaders = lines[0].split(',');
    
    // Process headers to handle different naming conventions
    const headers = rawHeaders.map(header => {
        const h = header.trim().toLowerCase();
        
        // Standardise header names
        if (/room.*name|name.*room/i.test(h)) {
            return 'roomName';
        } else if (/start.*date|date.*start/i.test(h)) {
            return 'startDate';
        } else if (/end.*date|date.*end/i.test(h)) {
            return 'endDate';
        }
        
        return h;
    });
    
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = lines[i].split(',');
        const obj = {};
        
        for (let j = 0; j < headers.length; j++) {
            if (j < values.length) {
                obj[headers[j]] = values[j].trim();
            }
        }
        
        // Only add if it has all required fields
        if (obj.roomName && obj.startDate && obj.endDate) {
            result.push(obj);
        }
    }
    
    return result;
}

/**
 * Load JSON sample data into the textarea
 */
function loadJsonSample() {
    document.getElementById('format').value = 'json';
    document.getElementById('dataInput').value = JSON.stringify(sampleJsonData, null, 2);
    document.getElementById('totalRooms').value = sampleJsonData.totalRooms;
    showMessage('Sample JSON data loaded', 'info');
}

/**
 * Load CSV sample data into the textarea
 */
function loadCsvSample() {
    document.getElementById('format').value = 'csv';
    document.getElementById('dataInput').value = sampleCsvData;
    document.getElementById('totalRooms').value = 10; // Default to 10 rooms
    showMessage('Sample CSV data loaded', 'info');
}

/**
 * Clear all data
 */
function clearData() {
    document.getElementById('dataInput').value = '';
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('messageContainer').style.display = 'none';
    document.getElementById('fileUpload').value = '';
    document.getElementById('fileName').textContent = 'No file selected';
    document.getElementById('calculationBreakdownContainer').style.display = 'none';
}

/**
 * Generate and download example CSV file
 */
function downloadExampleCsv() {
    const csvContent = `roomName,startDate,endDate
Bedroom 1,12/01/2025,09/05/2025
Roof,03/03/2025,30/04/2025
Kitchen,15/03/2025,12/05/2025
Bathroom,01/02/2025,15/04/2025
Living Room,20/01/2025,25/03/2025`;
    
    downloadFile('example-disrepair.csv', 'text/csv', csvContent);
}

/**
 * Generate and download example JSON file
 */
function downloadExampleJson() {
    const jsonData = {
        totalRooms: 10,
        periods: [
            {
                roomName: "Bedroom 1",
                startDate: "12/01/2025",
                endDate: "09/05/2025"
            },
            {
                roomName: "Roof",
                startDate: "03/03/2025",
                endDate: "30/04/2025"
            },
            {
                roomName: "Kitchen",
                startDate: "15/03/2025",
                endDate: "12/05/2025"
            },
            {
                roomName: "Bathroom",
                startDate: "01/02/2025",
                endDate: "15/04/2025"
            },
            {
                roomName: "Living Room",
                startDate: "20/01/2025",
                endDate: "25/03/2025"
            }
        ]
    };
    
    const jsonContent = JSON.stringify(jsonData, null, 2);
    downloadFile('example-disrepair.json', 'application/json', jsonContent);
}

/**
 * Helper function to download a file
 * @param {string} filename - Name of the file to download
 * @param {string} contentType - MIME type of the file
 * @param {string} content - Content of the file
 */
function downloadFile(filename, contentType, content) {
    const element = document.createElement('a');
    const file = new Blob([content], {type: contentType});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Export functions to global scope
window.fileHandling = {
    updateFileName,
    processUploadedFile,
    parseCsv,
    loadJsonSample,
    loadCsvSample,
    clearData,
    downloadExampleCsv,
    downloadExampleJson,
    downloadFile,
    sanitizeInput,
    sanitizeFilename
};
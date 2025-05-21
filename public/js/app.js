/**
 * app.js
 * Main application entry point for the Disrepair Analysis Tool
 */

// Global application state
window.appState = {
    apiUrl: document.getElementById('apiUrl')?.value || 'api/calculate-disrepair',
    totalRooms: 10,
    currentFormat: 'json',
    periods: [],
    results: null
};

/**
 * Shows a message in the message container
 * @param {string} message - Message text to display
 * @param {string} type - Message type (error, success, info)
 */
function showMessage(message, type = 'error') {
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.textContent = message;
    messageContainer.className = type;
    messageContainer.style.display = 'block';
    document.getElementById('loadingIndicator').style.display = 'none';
}

/**
 * Shows or hides the loading indicator
 * @param {boolean} show - Whether to show or hide the indicator
 */
function toggleLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
}

/**
 * Set up all event listeners for the application
 */
function setupEventListeners() {
    // File input change event
    const fileUpload = document.getElementById('fileUpload');
    if (fileUpload) {
        fileUpload.addEventListener('change', window.fileHandling.updateFileName);
    }
    
    // Format selector change event
    const formatSelector = document.getElementById('format');
    if (formatSelector) {
        formatSelector.addEventListener('change', function() {
            window.appState.currentFormat = this.value;
        });
    }
    
    // Total rooms input change event
    const totalRoomsInput = document.getElementById('totalRooms');
    if (totalRoomsInput) {
        totalRoomsInput.addEventListener('input', function() {
            window.appState.totalRooms = parseInt(this.value, 10) || 10;
        });
    }
    
    // API URL input change event
    const apiUrlInput = document.getElementById('apiUrl');
    if (apiUrlInput) {
        apiUrlInput.addEventListener('input', function() {
            window.appState.apiUrl = this.value;
        });
    }
    
    // Setup button click events
    setupButtonEvents();
}

/**
 * Set up button click event handlers
 */
function setupButtonEvents() {
    // Test connection button
    document.querySelector('button[onclick="testConnection()"]')?.addEventListener('click', window.apiClient.testConnection);
    
    // Load JSON sample button
    document.querySelector('button[onclick="loadJsonSample()"]')?.addEventListener('click', window.fileHandling.loadJsonSample);
    
    // Load CSV sample button
    document.querySelector('button[onclick="loadCsvSample()"]')?.addEventListener('click', window.fileHandling.loadCsvSample);
    
    // Validate input button
    document.querySelector('button[onclick="validateInputData()"]')?.addEventListener('click', window.validation.validateInputData);
    
    // Clear button
    document.querySelector('button[onclick="clearData()"]')?.addEventListener('click', window.fileHandling.clearData);
    
    // Analyze data button
    document.querySelector('button[onclick="analyzeData()"]')?.addEventListener('click', window.apiClient.analyzeData);
    
    // Download example CSV button
    document.querySelector('button[onclick="downloadExampleCsv()"]')?.addEventListener('click', window.fileHandling.downloadExampleCsv);
    
    // Download example JSON button
    document.querySelector('button[onclick="downloadExampleJson()"]')?.addEventListener('click', window.fileHandling.downloadExampleJson);
    
    // Process uploaded file button
    document.querySelector('button[onclick="processUploadedFile()"]')?.addEventListener('click', window.fileHandling.processUploadedFile);
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Disrepair Analysis Tool initializing...');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load sample data for first use
    window.fileHandling.loadJsonSample();
    
    console.log('Disrepair Analysis Tool initialized');
});

// Make functions available globally for HTML inline event handlers during transition
// These can be removed once all inline event handlers are replaced
window.showMessage = showMessage;
window.toggleLoading = toggleLoading;
window.testConnection = window.apiClient?.testConnection;
window.loadJsonSample = window.fileHandling?.loadJsonSample;
window.loadCsvSample = window.fileHandling?.loadCsvSample;
window.validateInputData = window.validation?.validateInputData;
window.clearData = window.fileHandling?.clearData;
window.analyzeData = window.apiClient?.analyzeData;
window.downloadExampleCsv = window.fileHandling?.downloadExampleCsv;
window.downloadExampleJson = window.fileHandling?.downloadExampleJson;
window.processUploadedFile = window.fileHandling?.processUploadedFile;
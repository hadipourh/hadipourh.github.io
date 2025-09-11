/**
 * Terminal Component JS
 * 
 * This file contains the shared functionality for terminal components
 * on both the home and contact pages.
 * 
 * Features:
 * - Typing effect with message queue
 * - Security filtering of messages
 * - Rate limiting with device fingerprinting
 * - Request timeouts and error handling
 * - Command history with arrow key navigation
 * - Auto-saving terminal state
 * 
 * Usage:
 * import { initTerminal } from '../lib/terminal.js';
 * 
 * // Then in your script:
 * initTerminal({
 *   pageSelector: '[data-page="home"]',
 *   outputId: 'home-terminal-output',
 *   inputId: 'home-terminal-input',
 *   sendBtnId: 'home-terminal-send',
 *   clearBtnId: 'home-terminal-clear',
 *   source: 'home_terminal',
 *   storageKey: 'lastHomeMessageSent',
 *   welcomeMessages: [...] // Array of message objects
 * });
 */

// Shared webhook URL
const WEBHOOK_URL = 'https://crypt0grapher.app.n8n.cloud/webhook/3145da13-aca7-4299-8046-07bcae2173a7';

// Version for cache busting and tracking
const TERMINAL_VERSION = '1.1.0';

// Default welcome messages - shared between home and contact pages
export const DEFAULT_WELCOME_MESSAGES = [
  { text: 'Secure Message Terminal - Security Analysis', className: 'text-green-400', withTyping: true, delay: 20 },
  { text: '===========================================', className: 'text-green-400', withTyping: true, delay: 8 },
  { text: '', className: '', withTyping: false },
  { text: 'Security breakdown of this messaging system:', className: 'text-cyan-400', withTyping: true, delay: 15 },
  { text: '1. HTTPS protects messages in transit from browser to website', className: 'text-gray-400', withTyping: true, delay: 12 },
  { text: '2. Messages sent to n8n over HTTPS but accessible within the n8n service', className: 'text-yellow-400', withTyping: true, delay: 12 },
  { text: '3. Messages are then forwarded directly to my Telegram via Telegram\'s API', className: 'text-green-400', withTyping: true, delay: 12 },
  { text: '4. Command and message history saved locally in your browser', className: 'text-gray-400', withTyping: true, delay: 12 },
  { text: '', className: '', withTyping: false },
  { text: 'This demonstrates the need for end-to-end encryption', className: 'text-amber-400', withTyping: true, delay: 15 },
  { text: 'Type your message and press Enter... trust issues? a cryptographer would understand ;)', className: 'text-yellow-400', withTyping: true, delay: 20 },
  { text: '', className: '', withTyping: false },
  { text: 'Type /help to see available commands', className: 'text-blue-400', withTyping: true, delay: 12 },
  { text: '', className: '', withTyping: false }
];

// Constants
const MAX_MESSAGE_LENGTH = 1000;
const RATE_LIMIT_MS = 5000;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_HISTORY_ITEMS = 10;

// Suspicious content patterns
const SUSPICIOUS_PATTERNS = [
  /script[^>]*>/i,
  /javascript:/i,
  /data:text\/html/i,
  /<iframe/i,
  /eval\(/i,
  /document\.cookie/i,
  /on\w+\s*=/i,  // Event handlers like onclick, onerror, etc.
  /expression\s*\(/i,  // CSS expression attacks
  /vbscript:/i,  // VBScript protocol
  /livescript:/i,  // LiveScript protocol
  /url\s*\(/i,  // CSS url injection
  /&#/i,  // HTML entity encoding attempts
  /%3c/i,  // URL encoded < character
  /%3e/i,  // URL encoded > character
  /base64/i,  // Base64 encoded content
  /String\.fromCharCode/i,  // Character code conversion
];

/**
 * Initialize a terminal component with all functionality
 * @param {Object} config Configuration object
 */
export function initTerminal(config) {
  const {
    pageSelector,
    outputId,
    inputId,
    sendBtnId,
    clearBtnId,
    source,
    storageKey,
    welcomeMessages = DEFAULT_WELCOME_MESSAGES, // Use default messages if none provided
    alwaysRefresh = false // Option to always refresh terminal on page load
  } = config;
  
  // Periodic cleanup of localStorage items
  function cleanupLocalStorage() {
    try {
      // Get all localStorage keys
      const keys = Object.keys(localStorage);
      const now = Date.now();
      
      // Scan for old terminal state and history entries
      keys.forEach(key => {
        // Process terminal state entries
        if (key.endsWith('_state')) {
          try {
            const state = JSON.parse(localStorage.getItem(key));
            // Remove if older than 7 days or invalid
            if (!state || !state.timestamp || (now - state.timestamp > 7 * 86400000)) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        }
        
        // Process terminal history entries
        if (key.endsWith('_history')) {
          try {
            const history = JSON.parse(localStorage.getItem(key));
            // Remove if invalid or extremely large
            if (!history || !Array.isArray(history) || history.length > 50) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {
      console.error('Error during localStorage cleanup:', e);
    }
  }

  document.addEventListener('astro:page-load', () => {
    // Run storage cleanup on page load (once per session)
    if (sessionStorage.getItem('terminal_cleanup_run') !== 'true') {
      cleanupLocalStorage();
      sessionStorage.setItem('terminal_cleanup_run', 'true');
    }
    
    // Only run this code when on the specified page
    if (!document.querySelector(pageSelector)) return;
    
    // Reference to key elements
    const output = document.getElementById(outputId);
    const input = document.getElementById(inputId);
    const sendBtn = document.getElementById(sendBtnId);
    const clearBtn = document.getElementById(clearBtnId);
    
    if (!output || !input || !sendBtn || !clearBtn) return;
    
    // Typing effect state
    const typingIntervals = [];
    const messages = [];
    let isProcessing = false;
    
    // Clean up all typing effects and clear terminal
    function resetTerminal() {
      // Clear all typing intervals
      while (typingIntervals.length > 0) {
        clearInterval(typingIntervals.pop());
      }
      
      // Clear output
      if (output) output.innerHTML = '';
      
      // Reset state
      messages.length = 0;
      isProcessing = false;
    }
    
    // Add a message to the terminal
    async function typeMessage(text, className = '', withTyping = true, delay = 12) {
      if (!output) return;
      
      // Create line element
      const line = document.createElement('div');
      if (className) line.className = className;
      output.appendChild(line);
      
      // For empty lines or no typing effect
      if (!text.trim() || !withTyping) {
        line.textContent = text;
        output.scrollTop = output.scrollHeight;
        return Promise.resolve();
      }
      
      // Apply typing effect
      return new Promise(resolve => {
        let i = 0;
        line.textContent = '';
        
        const interval = setInterval(() => {
          if (i < text.length) {
            line.textContent += text.charAt(i);
            i++;
            output.scrollTop = output.scrollHeight;
          } else {
            clearInterval(interval);
            
            // Remove this interval from tracking
            const index = typingIntervals.indexOf(interval);
            if (index !== -1) typingIntervals.splice(index, 1);
            
            resolve();
          }
        }, delay);
        
        typingIntervals.push(interval);
      });
    }
    
    // Process messages in queue
    async function processMessageQueue() {
      if (isProcessing || messages.length === 0) return;
      
      isProcessing = true;
      
      const msg = messages.shift();
      if (msg) {
        await typeMessage(msg.text, msg.className, msg.withTyping, msg.delay);
      }
      
      isProcessing = false;
      
      // Continue processing if there are more messages
      if (messages.length > 0) {
        processMessageQueue();
      }
    }
    
    // Add message to queue
    function queueMessage(text, className = '', withTyping = true, delay = 12) {
      messages.push({ text, className, withTyping, delay });
      
      // Also add system messages to history if they're not empty and not just formatting
      if (text && text.trim() && className !== '' && 
          !text.startsWith('>') && // Skip user inputs that are already tracked
          localStorage.getItem('terminal_no_save') !== 'true') {
        
        // Don't add sensitive content to history
        if (!/password|secret|key|token|login|pwd/i.test(text)) {
          messageHistory.unshift({
            text,
            type: 'system',
            className,
            timestamp: Date.now()
          });
          
          // Limit message history size
          if (messageHistory.length > 20) {
            messageHistory.pop();
          }
          
          // Save to storage
          saveCommandHistory();
        }
      }
      
      processMessageQueue();
    }
    
    // Generate a simple device fingerprint for rate limiting
    function generateFingerprint() {
      const components = [
        navigator.userAgent,
        screen.width,
        screen.height,
        navigator.language,
        new Date().getTimezoneOffset()
      ];
      return btoa(components.join('|')).substring(0, 32);
    }
    
    // Check message content for suspicious patterns
    function hasSuspiciousContent(message) {
      // Check length
      if (message.length > 1000) return true;
      
      // Check for suspicious patterns
      return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(message));
    }
    
// Command and message history management
let commandHistory = [];
let messageHistory = [];
let historyIndex = -1;

// Load command history from localStorage with security validation
function loadCommandHistory() {
  // Skip loading if user has opted out
  if (localStorage.getItem('terminal_no_save') === 'true') {
    commandHistory = [];
    messageHistory = [];
    return;
  }
  
  try {
    const history = localStorage.getItem(`${source}_history`);
    if (history) {
      // Validate it's proper JSON
      const parsed = JSON.parse(history);
      
      // Ensure it's an array
      if (!Array.isArray(parsed)) {
        throw new Error('History is not an array');
      }
      
      // Validate each entry is a string and not malicious
      commandHistory = parsed.filter(cmd => {
        // Must be a string of reasonable length
        if (typeof cmd !== 'string' || cmd.length > 500) {
          return false;
        }
        
        // Skip any potentially malicious content
        if (/<[^>]+>|javascript:|script|onerror=|onclick=|eval\(|document\./i.test(cmd)) {
          return false;
        }
        
        return true;
      });
    } else {
      commandHistory = [];
    }

    // Load full message history if available
    const msgHistory = localStorage.getItem(`${source}_msg_history`);
    if (msgHistory) {
      const parsed = JSON.parse(msgHistory);
      
      if (Array.isArray(parsed)) {
        messageHistory = parsed.filter(entry => {
          // Basic validation and security check
          if (!entry || typeof entry !== 'object' || !entry.text || typeof entry.text !== 'string') {
            return false;
          }
          
          // Skip any potentially malicious content
          if (/<[^>]+>|javascript:|script|onerror=|onclick=|eval\(|document\./i.test(entry.text)) {
            return false;
          }
          
          return true;
        });
      } else {
        messageHistory = [];
      }
    } else {
      messageHistory = [];
    }
  } catch (e) {
    console.error('Error loading history:', e);
    // If loading fails, clear history for safety
    try {
      localStorage.removeItem(`${source}_history`);
      localStorage.removeItem(`${source}_msg_history`);
    } catch (clearErr) {}
    commandHistory = [];
    messageHistory = [];
  }
}    // Save command and message history to localStorage with security checks
    function saveCommandHistory() {
      try {
        // Skip saving if user has opted out
        if (localStorage.getItem('terminal_no_save') === 'true') {
          return;
        }
        
        // Don't save commands that contain sensitive patterns
        const filteredHistory = commandHistory
          .filter(cmd => {
            // Skip any potentially sensitive commands
            return !(
              // Common sensitive information patterns
              /password|token|key|secret|credit|card|ssn|social|security/i.test(cmd) ||
              // Email addresses
              /@\w+\.\w+/i.test(cmd) ||
              // Phone numbers
              /\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}/i.test(cmd) ||
              // Any HTML or script content
              /<[^>]+>|javascript:|script/i.test(cmd)
            );
          })
          // Truncate any extremely long commands
          .map(cmd => cmd.substring(0, 200));
          
        localStorage.setItem(`${source}_history`, JSON.stringify(filteredHistory.slice(0, MAX_HISTORY_ITEMS)));
        
        // Also save the full message history
        const filteredMessageHistory = messageHistory
          .filter(entry => {
            // Skip sensitive messages using same criteria
            return !(
              /password|token|key|secret|credit|card|ssn|social|security/i.test(entry.text) ||
              /@\w+\.\w+/i.test(entry.text) ||
              /\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}/i.test(entry.text) ||
              /<[^>]+>|javascript:|script/i.test(entry.text)
            );
          })
          // Limit message length
          .map(entry => ({
            ...entry,
            text: entry.text.substring(0, 200)
          }));
        
        // Save up to 20 message history entries  
        localStorage.setItem(`${source}_msg_history`, JSON.stringify(filteredMessageHistory.slice(0, 20)));
      } catch (e) {
        console.error('Error saving history:', e);
        // If saving fails, clear history for safety
        try {
          localStorage.removeItem(`${source}_history`);
          localStorage.removeItem(`${source}_msg_history`);
        } catch (clearErr) {}
      }
    }
    
    // Add command to history with security check
    function addToHistory(command) {
      // Don't add commands to history if saving is disabled
      if (localStorage.getItem('terminal_no_save') === 'true') {
        return;
      }
      
      // Don't add duplicates of the last command
      if (commandHistory.length > 0 && commandHistory[0] === command) {
        return;
      }
      
      // Don't add potentially sensitive commands
      if (/password|secret|key|token|login|pwd/i.test(command)) {
        return;
      }
      
      // Add to front of array
      commandHistory.unshift(command);
      
      // Also add to message history with timestamp
      messageHistory.unshift({
        text: command, 
        type: 'command',
        timestamp: Date.now()
      });
      
      // Limit size
      if (commandHistory.length > MAX_HISTORY_ITEMS) {
        commandHistory.pop();
      }
      
      // Limit message history size
      if (messageHistory.length > 20) {
        messageHistory.pop();
      }
      
      // Reset index and save
      historyIndex = -1;
      saveCommandHistory();
    }
    
    // Save terminal state for persistence between visits with security filtering
    function saveTerminalState() {
      try {
        if (!output) return;
        
        // Filter and sanitize terminal lines before saving
        const lines = Array.from(output.children)
          // Skip any lines containing sensitive patterns
          .filter(line => {
            const content = line.textContent || '';
            // Don't save any potentially sensitive information
            return !(
              // Skip lines with potential PII patterns
              /password|token|key|secret|credit|card|ssn|social|security|phone|address|zipcode|email|@gmail|@yahoo/i.test(content) ||
              // Skip any HTML content or scripts that might have been added
              /<\/?[a-z][\s\S]*>/i.test(content)
            );
          })
          // Sanitize the content that is saved
          .map(line => ({
            // Limit the length of saved lines
            text: (line.textContent || '').substring(0, 200),
            className: line.className
          }));
        
        // Only save if user has explicitly interacted with terminal
        // Don't save just the default welcome messages
        const hasUserInteraction = commandHistory.length > 0;
        
        if (hasUserInteraction) {
          localStorage.setItem(`${source}_state`, JSON.stringify({
            lines: lines.slice(-20), // Save last 20 lines only
            timestamp: Date.now(),
            version: TERMINAL_VERSION
          }));
        }
      } catch (e) {
        console.error('Error saving terminal state:', e);
        // If anything goes wrong, clear the saved state for safety
        try {
          localStorage.removeItem(`${source}_state`);
        } catch (clearErr) {}
      }
    }
    
    // Load terminal state if available, with added security checks
    function loadTerminalState() {
      try {
        // If alwaysRefresh is true, always show fresh welcome messages
        if (alwaysRefresh) {
          return false;
        }
        
        // Check if user has opted out of storage
        if (localStorage.getItem('terminal_no_save') === 'true') {
          return false;
        }
        
        const saved = localStorage.getItem(`${source}_state`);
        if (!saved) return false;
        
        // Basic validation before parsing
        if (saved.length > 50000) {
          // State is suspiciously large, don't load it
          localStorage.removeItem(`${source}_state`);
          return false;
        }
        
        let state;
        try {
          state = JSON.parse(saved);
        } catch (parseError) {
          // Invalid JSON, remove it
          localStorage.removeItem(`${source}_state`);
          return false;
        }
        
        // Strict validation of the state object
        if (!state || 
            typeof state !== 'object' ||
            !state.version ||
            !state.timestamp ||
            !Array.isArray(state.lines)) {
          localStorage.removeItem(`${source}_state`);
          return false;
        }
        
        // Only restore if it's the current version and less than 24 hours old
        const isCurrentVersion = state.version === TERMINAL_VERSION;
        const isRecent = Date.now() - state.timestamp < 86400000;
        const hasValidLines = state.lines.every(line => 
          typeof line === 'object' && 
          typeof line.text === 'string' &&
          line.text.length < 500 // Additional length validation
        );
        
        if (isCurrentVersion && isRecent && hasValidLines) {
          // Clear default welcome messages
          resetTerminal();
          
          // Add notice about restored session
          const noticeElem = document.createElement('div');
          noticeElem.className = 'text-blue-400 italic';
          noticeElem.textContent = '(Restored previous session)';
          output.appendChild(noticeElem);
          
          // Restore lines (with additional filtering)
          state.lines.forEach(line => {
            // Don't restore any suspicious content
            if (!/javascript:|<\/?\w+>|script|onerror|eval/i.test(line.text)) {
              const elem = document.createElement('div');
              // Only allow specific safe classes
              if (line.className && /^text-(\w+)-(\d+)$/.test(line.className)) {
                elem.className = line.className;
              }
              elem.textContent = line.text; // Use textContent for sanitization
              output.appendChild(elem);
            }
          });
          
          // Add option to clear saved data
          const clearOption = document.createElement('div');
          clearOption.className = 'text-gray-400 cursor-pointer hover:underline mt-2';
          clearOption.textContent = 'Type /clear to reset terminal or /nosave to disable saving';
          output.appendChild(clearOption);
          
          output.scrollTop = output.scrollHeight;
          return true;
        } else {
          // Invalid or expired state, remove it
          localStorage.removeItem(`${source}_state`);
        }
      } catch (e) {
        console.error('Error loading terminal state:', e);
        try {
          // Clean up on any error
          localStorage.removeItem(`${source}_state`);
        } catch (cleanupError) {}
      }
      return false;
    }
    
    // Send message handler with enhanced security
    async function sendMessage() {
      const messageText = input.value.trim();
      
      if (!messageText) {
        queueMessage('Error: Please enter a message', 'text-red-400');
        return;
      }
      
      // Add to command history
      addToHistory(messageText);
      
      // Display user message
      queueMessage('> ' + messageText, 'text-green-400');
      input.value = '';
      
      // Enhanced rate limiting with fingerprinting
      const now = Date.now();
      const lastSent = localStorage.getItem(storageKey);
      
      if (lastSent && now - parseInt(lastSent) < RATE_LIMIT_MS) {
        const remaining = Math.ceil((RATE_LIMIT_MS - (now - parseInt(lastSent))) / 1000);
        queueMessage(`Rate limit: Please wait ${remaining} seconds before sending another message`, 'text-red-400');
        return;
      }
      
      // Enhanced content filtering
      if (hasSuspiciousContent(messageText)) {
        queueMessage('Error: Message contains disallowed content or is too long', 'text-red-400');
        return;
      }
      
      // Check for special commands
      if (messageText.startsWith('/')) {
        handleSpecialCommand(messageText);
        return;
      }
      
      try {
        queueMessage('Establishing secure connection...', 'text-blue-400', true, 25);
        
        // Add request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        
        // Start a loading indicator
        const loadingIndicator = startLoadingIndicator();
        
        try {
          const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Client-Version': TERMINAL_VERSION,
              'X-Client-Source': source
            },
            body: JSON.stringify({
              message: messageText.substring(0, MAX_MESSAGE_LENGTH),
              timestamp: new Date().toISOString(),
              source: source,
              fingerprint: generateFingerprint()
            }),
            signal: controller.signal
          });
          
          // Stop loading indicator
          stopLoadingIndicator(loadingIndicator);
          clearTimeout(timeoutId);
          localStorage.setItem(storageKey, now.toString());
          
          if (response.ok) {
            queueMessage('✓ Message delivered to automation server', 'text-green-400', true, 10);
            queueMessage('✓ Forwarding to Hosein\'s Telegram now...', 'text-cyan-400', true, 10);
          } else {
            // Handle HTTP error responses
            const status = response.status;
            if (status === 429) {
              queueMessage('⚠️ Rate limit exceeded on server side', 'text-yellow-400', true, 10);
            } else if (status >= 500) {
              queueMessage('⚠️ Server error - message delivery uncertain', 'text-yellow-400', true, 10);
            } else {
              queueMessage(`⚠️ Error ${status} - message delivery failed`, 'text-yellow-400', true, 10);
            }
          }
        } catch (error) {
          // Stop loading indicator
          stopLoadingIndicator(loadingIndicator);
          
          if (error.name === 'AbortError') {
            queueMessage('⚠️ Request timeout - please try again later', 'text-red-400', true, 10);
          } else {
            queueMessage('⚠️ Network error - check your connection', 'text-red-400', true, 10);
          }
        }
      } catch (error) {
        queueMessage('⚠️ Unexpected error - please try again', 'text-red-400', true, 10);
        console.error('Terminal error:', error);
      } finally {
        queueMessage('', '');
        // Save terminal state after sending a message
        saveTerminalState();
      }
      
      // Handle special commands
      function handleSpecialCommand(command) {
        const cmd = command.toLowerCase();
        
        if (cmd === '/help') {
          queueMessage('Available commands:', 'text-blue-400', true, 8);
          queueMessage('/help - Show this help message', 'text-gray-400', true, 5);
          queueMessage('/clear - Clear the terminal', 'text-gray-400', true, 5);
          queueMessage('/about - Show information about this terminal', 'text-gray-400', true, 5);
          queueMessage('/version - Show terminal version', 'text-gray-400', true, 5);
          queueMessage('/privacy - Show privacy information', 'text-gray-400', true, 5);
          queueMessage('/nosave - Disable terminal state saving', 'text-gray-400', true, 5);
          queueMessage('/save - Re-enable terminal state saving', 'text-gray-400', true, 5);
          queueMessage('/age - Check saved data age', 'text-gray-400', true, 5);
          queueMessage('/clearstorage - Remove all saved terminal data', 'text-gray-400', true, 5);
        } 
        else if (cmd === '/clear') {
          resetTerminal();
          queueMessage('Terminal cleared', 'text-green-400', true, 8);
        }
        else if (cmd === '/about') {
          queueMessage('Secure Terminal Interface', 'text-green-400', true, 8);
          queueMessage('-------------------------', 'text-green-400', true, 5);
          queueMessage('This terminal allows you to send secure messages directly to Hosein.', 'text-gray-400', true, 8);
          queueMessage('Messages are transmitted via HTTPS and forwarded to Telegram.', 'text-gray-400', true, 8);
          queueMessage('Features: Command history, message persistence, rate limiting.', 'text-gray-400', true, 8);
        }
        else if (cmd === '/version') {
          queueMessage(`Terminal version: ${TERMINAL_VERSION}`, 'text-blue-400', true, 8);
        }
        else if (cmd === '/privacy') {
          queueMessage('Privacy Information', 'text-green-400', true, 8);
          queueMessage('-----------------', 'text-green-400', true, 5);
          queueMessage('• Your terminal state is saved locally in your browser only', 'text-gray-400', true, 8);
          queueMessage('• Command and message history are stored using localStorage', 'text-gray-400', true, 8);
          queueMessage('• Terminal interactions are saved for 24 hours for convenience', 'text-gray-400', true, 8);
          queueMessage('• Messages you send are forwarded to Telegram via webhook', 'text-gray-400', true, 8);
          queueMessage('• No analytics or tracking is used in this terminal', 'text-gray-400', true, 8);
          queueMessage('• Use /age to view your saved messages and commands', 'text-gray-400', true, 8);
          queueMessage('• Use /nosave to disable all local storage features', 'text-gray-400', true, 8);
          queueMessage('• Use /clearstorage to remove all saved data', 'text-gray-400', true, 8);
        }
        else if (cmd === '/age') {
          // Display information about the age of saved terminal state
          try {
            queueMessage('Saved Data Age Information', 'text-green-400', true, 8);
            queueMessage('------------------------', 'text-green-400', true, 5);
            
            // Check if terminal state is saved
            const state = localStorage.getItem(`${source}_state`);
            if (state) {
              try {
                const parsedState = JSON.parse(state);
                if (parsedState && parsedState.timestamp) {
                  const ageMs = Date.now() - parsedState.timestamp;
                  const ageMinutes = Math.floor(ageMs / 60000);
                  const ageHours = Math.floor(ageMinutes / 60);
                  const ageDays = Math.floor(ageHours / 24);
                  
                  if (ageDays > 0) {
                    queueMessage(`Terminal state is ${ageDays} days, ${ageHours % 24} hours old`, 'text-blue-400', true, 8);
                  } else if (ageHours > 0) {
                    queueMessage(`Terminal state is ${ageHours} hours, ${ageMinutes % 60} minutes old`, 'text-blue-400', true, 8);
                  } else {
                    queueMessage(`Terminal state is ${ageMinutes} minutes old`, 'text-blue-400', true, 8);
                  }
                  
                  queueMessage(`Saved lines: ${parsedState.lines ? parsedState.lines.length : 0}`, 'text-gray-400', true, 8);
                } else {
                  queueMessage('Terminal state format is invalid', 'text-yellow-400', true, 8);
                }
              } catch (e) {
                queueMessage('Terminal state data is corrupted', 'text-yellow-400', true, 8);
              }
            } else {
              queueMessage('No terminal state is saved', 'text-gray-400', true, 8);
            }
            
            // Check command history
            const history = localStorage.getItem(`${source}_history`);
            if (history) {
              try {
                const parsedHistory = JSON.parse(history);
                if (Array.isArray(parsedHistory)) {
                  queueMessage(`Command history entries: ${parsedHistory.length}`, 'text-gray-400', true, 8);
                  
                  // List the recent commands
                  if (parsedHistory.length > 0) {
                    queueMessage(`Recent commands:`, 'text-blue-400', true, 8);
                    parsedHistory.slice(0, 5).forEach(cmd => {
                      queueMessage(`• ${cmd}`, 'text-cyan-400', true, 5);
                    });
                    if (parsedHistory.length > 5) {
                      queueMessage(`... and ${parsedHistory.length - 5} more`, 'text-gray-400', true, 5);
                    }
                  }
                } else {
                  queueMessage('Command history format is invalid', 'text-yellow-400', true, 8);
                }
              } catch (e) {
                queueMessage('Command history data is corrupted', 'text-yellow-400', true, 8);
              }
            } else {
              queueMessage('No command history is saved', 'text-gray-400', true, 8);
            }
            
            // Check message history
            const msgHistory = localStorage.getItem(`${source}_msg_history`);
            if (msgHistory) {
              try {
                const parsedMsgHistory = JSON.parse(msgHistory);
                if (Array.isArray(parsedMsgHistory)) {
                  queueMessage(`Message history entries: ${parsedMsgHistory.length}`, 'text-gray-400', true, 8);
                  
                  // List the recent messages with timestamps
                  if (parsedMsgHistory.length > 0) {
                    queueMessage(`Recent interactions:`, 'text-blue-400', true, 8);
                    parsedMsgHistory.slice(0, 5).forEach(msg => {
                      const date = new Date(msg.timestamp);
                      const timeStr = date.toLocaleTimeString();
                      const dateStr = date.toLocaleDateString();
                      const typeIcon = msg.type === 'command' ? '💬' : '🖥️';
                      queueMessage(`${typeIcon} [${dateStr} ${timeStr}] ${msg.text.substring(0, 50)}${msg.text.length > 50 ? '...' : ''}`, 
                                 msg.type === 'command' ? 'text-green-400' : 'text-cyan-400', true, 5);
                    });
                    
                    if (parsedMsgHistory.length > 5) {
                      queueMessage(`... and ${parsedMsgHistory.length - 5} more interactions`, 'text-gray-400', true, 5);
                    }
                  }
                } else {
                  queueMessage('Message history format is invalid', 'text-yellow-400', true, 8);
                }
              } catch (e) {
                queueMessage('Message history data is corrupted', 'text-yellow-400', true, 8);
              }
            } else {
              queueMessage('No message history is saved', 'text-gray-400', true, 8);
            }
          } catch (e) {
            queueMessage('Error checking saved data age', 'text-red-400', true, 8);
          }
        }
        else if (cmd === '/nosave') {
          // Disable saving feature
          localStorage.setItem('terminal_no_save', 'true');
          
          // Clear any existing saved state
          localStorage.removeItem(`${source}_state`);
          localStorage.removeItem(`${source}_history`);
          localStorage.removeItem(`${source}_msg_history`);
          
          // Also reset in-memory command history to be consistent
          commandHistory = [];
          messageHistory = [];
          historyIndex = -1;
          
          queueMessage('✓ Terminal state saving has been disabled', 'text-green-400', true, 8);
          queueMessage('Your terminal activity will not be saved between sessions', 'text-gray-400', true, 8);
          queueMessage('Previous command and message history has been cleared', 'text-gray-400', true, 8);
        }
        else if (cmd === '/save') {
          // Re-enable saving feature
          localStorage.removeItem('terminal_no_save');
          queueMessage('✓ Terminal state saving has been re-enabled', 'text-green-400', true, 8);
          queueMessage('Your terminal activity will be saved for 24 hours', 'text-gray-400', true, 8);
          
          // Save current state
          saveTerminalState();
        }
        else if (cmd === '/clearstorage') {
          // Clear all terminal-related storage
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('terminal') || key.includes('_state') || key.includes('_history') || key.includes('_msg_history'))) {
              localStorage.removeItem(key);
            }
          }
          
          // Reset in-memory command history
          commandHistory = [];
          messageHistory = [];
          historyIndex = -1;
          
          // Reset the terminal completely, then show confirmation
          resetTerminal();
          queueMessage('✓ All terminal storage has been cleared', 'text-green-400', true, 8);
          queueMessage('Terminal state, command history, and message history have been reset', 'text-gray-400', true, 8);
        }
        else {
          queueMessage(`Unknown command: ${command}`, 'text-red-400', true, 8);
          queueMessage('Type /help for available commands', 'text-gray-400', true, 8);
        }
        
        queueMessage('', '');
        
        // Only save state if saving is enabled
        if (localStorage.getItem('terminal_no_save') !== 'true') {
          saveTerminalState();
        }
      }
      
      // Loading indicator functions
      function startLoadingIndicator() {
        const loadingLine = document.createElement('div');
        loadingLine.className = 'text-blue-300';
        loadingLine.id = 'loading-' + Date.now();
        output.appendChild(loadingLine);
        
        const loadingChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;
        
        const intervalId = setInterval(() => {
          loadingLine.textContent = `${loadingChars[i]} Processing request...`;
          i = (i + 1) % loadingChars.length;
          output.scrollTop = output.scrollHeight;
        }, 100);
        
        return { id: loadingLine.id, intervalId: intervalId };
      }
      
      function stopLoadingIndicator(indicator) {
        if (!indicator) return;
        
        clearInterval(indicator.intervalId);
        
        const loadingLine = document.getElementById(indicator.id);
        if (loadingLine) {
          loadingLine.remove();
        }
      }
    }
    
    // Initialize terminal content
    function initializeTerminal() {
      resetTerminal();
      
      // Display welcome messages
      welcomeMessages.forEach(msg => {
        queueMessage(msg.text, msg.className, msg.withTyping, msg.delay);
      });
      
      // Focus input field
      setTimeout(() => input.focus(), 100);
    }
    
    // Set up event listeners
    function setupEventListeners() {
      // Send button click
      sendBtn.addEventListener('click', sendMessage);
      
      // Handle keyboard events for command history
      input.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            sendMessage();
            break;
            
          case 'ArrowUp':
            e.preventDefault();
            // Navigate up through command history
            if (commandHistory.length > 0) {
              historyIndex = Math.min(commandHistory.length - 1, historyIndex + 1);
              input.value = commandHistory[historyIndex];
              // Position cursor at end of input
              setTimeout(() => {
                input.selectionStart = input.selectionEnd = input.value.length;
              }, 0);
            }
            break;
            
          case 'ArrowDown':
            e.preventDefault();
            // Navigate down through command history
            if (historyIndex > 0) {
              historyIndex--;
              input.value = commandHistory[historyIndex];
            } else if (historyIndex === 0) {
              historyIndex = -1;
              input.value = '';
            }
            break;
            
          case 'Escape':
            // Clear input field
            input.value = '';
            historyIndex = -1;
            break;
        }
      });
      
      // Clear button
      clearBtn.addEventListener('click', () => {
        resetTerminal();
        queueMessage('Terminal cleared - ready for new message', 'text-green-400', true, 8);
        queueMessage('', '');
        input.value = '';
        input.focus();
        
        // Save empty state
        saveTerminalState();
      });
      
      // Add auto-saving functionality
      const saveStateDebounced = debounce(() => {
        saveTerminalState();
      }, 1000);
      
      // Save terminal state when output changes
      const outputObserver = new MutationObserver(saveStateDebounced);
      outputObserver.observe(output, { childList: true });
      
      // Clean up when navigating away
      document.addEventListener('astro:before-preparation', () => {
        outputObserver.disconnect();
        saveTerminalState(); // Save final state before navigating
        resetTerminal();
      });
    }
    
    // Utility: Debounce function to prevent excessive saving
    function debounce(func, wait) {
      let timeout;
      return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    }
    
    // Load command history
    loadCommandHistory();
    
    // Try to load saved state, if it fails, show welcome messages
    if (!loadTerminalState()) {
      initializeTerminal();
    } else {
      // If we loaded state, just focus the input
      setTimeout(() => input.focus(), 100);
    }
    
    // Set up all event listeners
    setupEventListeners();
    
    // Return public API for potential external use
    return {
      queueMessage,
      resetTerminal,
      sendMessage
    };
  });
}

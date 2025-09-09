/**
 * Terminal Component JS
 * 
 * This file contains the shared functionality for terminal components
 * on both the home and contact pages.
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
  /&#/i,  // HTML entity encoding attempts
  /%3c/i,  // URL encoded < character
  /%3e/i,  // URL encoded > character
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
    welcomeMessages
  } = config;
  
  document.addEventListener('astro:page-load', () => {
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
    async function typeMessage(text, className = '', withTyping = true, delay = 30) {
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
    function queueMessage(text, className = '', withTyping = true, delay = 30) {
      messages.push({ text, className, withTyping, delay });
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
    
    // Send message handler with enhanced security
    async function sendMessage() {
      const messageText = input.value.trim();
      
      if (!messageText) {
        queueMessage('Error: Please enter a message', 'text-red-400');
        return;
      }
      
      // Display user message
      queueMessage('> ' + messageText, 'text-green-400');
      input.value = '';
      
      // Enhanced rate limiting with fingerprinting
      const now = Date.now();
      const lastSent = localStorage.getItem(storageKey);
      const minInterval = 5000; // 5 seconds
      
      if (lastSent && now - parseInt(lastSent) < minInterval) {
        const remaining = Math.ceil((minInterval - (now - parseInt(lastSent))) / 1000);
        queueMessage(`Rate limit: Please wait ${remaining} seconds before sending another message`, 'text-red-400');
        return;
      }
      
      // Enhanced content filtering
      if (hasSuspiciousContent(messageText)) {
        queueMessage('Error: Message contains disallowed content or is too long', 'text-red-400');
        return;
      }
      
      try {
        queueMessage('Establishing secure connection...', 'text-blue-400', true, 25);
        
        // Add request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Client-Version': '1.0.0'
          },
          body: JSON.stringify({
            message: messageText.substring(0, 1000),
            timestamp: new Date().toISOString(),
            source: source,
            fingerprint: generateFingerprint()
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        localStorage.setItem(storageKey, now.toString());
        
        queueMessage('Message delivered to automation server', 'text-green-400', true, 30);
        queueMessage('Forwarding to Hosein\'s Telegram now...', 'text-cyan-400', true, 25);
        queueMessage('', '');
        
      } catch (error) {
        if (error.name === 'AbortError') {
          queueMessage('Request timeout - please try again later', 'text-red-400');
        } else {
          queueMessage('Network error - please try again', 'text-red-400');
        }
        queueMessage('', '');
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
      
      // Enter key in input field
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendMessage();
        }
      });
      
      // Clear button
      clearBtn.addEventListener('click', () => {
        resetTerminal();
        queueMessage('Terminal cleared - ready for new message', 'text-green-400', true, 40);
        queueMessage('', '');
        input.value = '';
        input.focus();
      });
      
      // Clean up when navigating away
      document.addEventListener('astro:before-preparation', resetTerminal);
    }
    
    // Initialize terminal on page load
    initializeTerminal();
    setupEventListeners();
  });
}

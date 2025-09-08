#!/usr/bin/env node

/**
 * Encrypt CV LaTeX file for secure storage
 * Usage: node scripts/encrypt-cv.js
 * This will encrypt public/cv/CV.tex and create public/cv/CV.tex.encrypted
 */

import fs from 'fs/promises';
import path from 'path';
import CryptoJS from 'crypto-js';
import { createRequire } from 'module';

// Import CommonJS module
const require = createRequire(import.meta.url);
const { read } = require('read');

// Disable output that might leak sensitive data
process.on('uncaughtException', (err) => {
  console.error('❌ Encryption error occurred');
  process.exit(1);
});

const CV_PATH = path.join(process.cwd(), 'public', 'cv', 'CV.tex');
const ENCRYPTED_CV_PATH = path.join(process.cwd(), 'public', 'cv', 'CV.tex.encrypted');

/**
 * Prompt for password securely (completely hidden input)
 */
function getPassword(prompt) {
  return new Promise((resolve, reject) => {
    read({
      prompt: prompt,
      silent: true,
      replace: '*'
    }, (err, password) => {
      if (err) {
        reject(err);
      } else {
        resolve(password);
      }
    });
  });
}

/**
 * Encrypt CV file
 */
async function encryptCV() {
  try {
    // Check if CV.tex exists
    try {
      await fs.access(CV_PATH);
    } catch (error) {
      console.error('❌ CV.tex not found at:', CV_PATH);
      console.log('📁 Please ensure your CV.tex is in public/cv/CV.tex');
      process.exit(1);
    }

    console.log('🔐 Encrypting CV.tex...');
    
    // Get password securely
    const password = await getPassword('Enter encryption password: ');
    
    if (!password || password.trim().length === 0) {
      console.error('❌ Password cannot be empty');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Read CV content
    const cvContent = await fs.readFile(CV_PATH, 'utf-8');
    
    // Encrypt using AES with stronger settings
    const encrypted = CryptoJS.AES.encrypt(cvContent, password, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();
    
    // Write encrypted file
    await fs.writeFile(ENCRYPTED_CV_PATH, encrypted);
    
    // Clear sensitive data from memory (password is a primitive, so this is informational)
    let clearedPassword = password.replace(/./g, '\0');
    clearedPassword = null;
    
    console.log('✅ CV encrypted successfully!');
    console.log('📄 Encrypted file:', ENCRYPTED_CV_PATH);
    console.log('🔒 Keep your password safe - you\'ll need it for the parser!');
    
    // Ask if user wants to remove the original
    const removeOriginal = await new Promise((resolve) => {
      read({
        prompt: '\n🗑️  Remove original CV.tex? (y/N): ',
        default: 'N'
      }, (err, answer) => {
        resolve(answer || 'N');
      });
    });
    
    if (removeOriginal.toLowerCase() === 'y' || removeOriginal.toLowerCase() === 'yes') {
      await fs.unlink(CV_PATH);
      console.log('🗑️  Original CV.tex removed');
      console.log('⚠️  Make sure to backup your original LaTeX file elsewhere!');
    }
    
  } catch (error) {
    console.error('❌ Encryption failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  encryptCV().catch(console.error);
}

export { encryptCV };

import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  // This should match your backend encryption key or be provided by your backend
  private readonly encryptionKey = 'YourSecretEncryptionKey12345';

  constructor() { }

  /**
   * Encrypt password or sensitive data
   * @param value String to encrypt
   * @returns Encrypted string
   */
  encrypt(value: string): string {
    if (!value) return '';

    try {
      // Using AES encryption from CryptoJS
      const encrypted = CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return '';
    }
  }

  /**
   * Hash password using SHA-256 (alternative approach)
   * @param password Password to hash
   * @returns Hashed password
   */
  hashPassword(password: string): string {
    if (!password) return '';

    try {
      // Using SHA-256 for hashing
      return CryptoJS.SHA256(password).toString();
    } catch (error) {
      console.error('Hashing error:', error);
      return '';
    }
  }
}
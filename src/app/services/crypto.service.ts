// import { Injectable } from '@angular/core';
// import * as CryptoJS from 'crypto-js';

// @Injectable({
//   providedIn: 'root'
// })
// export class CryptoService {
//   // This should match your backend encryption key or be provided by your backend
//   private readonly encryptionKey = 'YourSecretEncryptionKey12345';

//   constructor() { }

//   /**
//    * Encrypt password or sensitive data
//    * @param value String to encrypt
//    * @returns Encrypted string
//    */
//   encrypt(value: string): string {
//     if (!value) return '';

//     try {
//       // Using AES encryption from CryptoJS
//       const encrypted = CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
//       return encrypted;
//     } catch (error) {
//       console.error('Encryption error:', error);
//       return '';
//     }
//   }

//   /**
//    * Hash password using SHA-256 (alternative approach)
//    * @param password Password to hash
//    * @returns Hashed password
//    */
//   hashPassword(password: string): string {
//     if (!password) return '';

//     try {
//       // Using SHA-256 for hashing
//       return CryptoJS.SHA256(password).toString();
//     } catch (error) {
//       console.error('Hashing error:', error);
//       return '';
//     }
//   }
// }



///////////////////////////////////////////////////////////


import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  // Use the same key that the backend uses for JWT signing
  // This is a shared secret between frontend and backend
  private readonly encryptionKey = 'hGRVQ4dfhOzh4QyP3FeYQ8v9JX83M7K8hG6ZyxUeVxQ=';

  constructor() { }

  /**
   * Encrypt password or sensitive data using AES
   * @param value String to encrypt
   * @returns Encrypted string
   */
  encrypt(value: string): string {
    if (!value) return '';

    try {
      // Using AES encryption with the shared secret key
      const encrypted = CryptoJS.AES.encrypt(value, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return '';
    }
  }

  /**
   * Decrypt data if needed (for testing purposes)
   * @param encryptedValue Encrypted string
   * @returns Decrypted string
   */
  decrypt(encryptedValue: string): string {
    if (!encryptedValue) return '';

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedValue, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }

  /**
   * Hash password using SHA-256 
   * This produces a one-way hash, useful for password storage comparisons
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

  /**
   * Creates an HMAC SHA-256 signature 
   * This matches the HS256 algorithm used in your JWT implementation
   * @param data Data to sign
   * @returns HMAC signature
   */
  createHmacSignature(data: string): string {
    if (!data) return '';

    try {
      return CryptoJS.HmacSHA256(data, this.encryptionKey).toString();
    } catch (error) {
      console.error('HMAC signature error:', error);
      return '';
    }
  }
}
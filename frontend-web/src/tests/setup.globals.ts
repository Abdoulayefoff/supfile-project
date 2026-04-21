// Runs before each test file, before any module imports.
// Provides Vite env vars and browser globals missing from jsdom.

process.env.VITE_API_URL = 'http://localhost:8000/api';

// react-router-dom (v7) requires TextEncoder/TextDecoder from Node.js
import { TextEncoder, TextDecoder } from 'util';
Object.assign(globalThis, { TextEncoder, TextDecoder });

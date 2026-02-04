#!/usr/bin/env node

// Load environment variables before anything else
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Now run the actual test script
require('tsx/cjs').register();
require('./test-revclaw-token-lifecycle.ts');

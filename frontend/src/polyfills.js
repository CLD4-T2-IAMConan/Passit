// Polyfills for Jest environment
const { TextEncoder, TextDecoder } = require("util");

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

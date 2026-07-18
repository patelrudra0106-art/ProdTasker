// js/config.js
// This file is used to expose environment variables to the static frontend.
// It should be added to .gitignore.
// 
// HOW TO USE:
// Copy values from your .env file into the placeholders below.
// This bridge is necessary because static sites cannot read .env files directly.
window.ENV = {
    // --- Groq AI ---
    GROQ_API_KEY: "PASTE_YOUR_GROQ_API_KEY_HERE",

    // --- Firebase ---
    FIREBASE_API_KEY: "PASTE_YOUR_FIREBASE_API_KEY_HERE",
    FIREBASE_AUTH_DOMAIN: "PASTE_YOUR_FIREBASE_AUTH_DOMAIN_HERE",
    FIREBASE_DATABASE_URL: "PASTE_YOUR_FIREBASE_DATABASE_URL_HERE",
    FIREBASE_PROJECT_ID: "PASTE_YOUR_FIREBASE_PROJECT_ID_HERE",
    FIREBASE_STORAGE_BUCKET: "PASTE_YOUR_FIREBASE_STORAGE_BUCKET_HERE",
    FIREBASE_MESSAGING_SENDER_ID: "PASTE_YOUR_FIREBASE_MESSAGING_SENDER_ID_HERE",
    FIREBASE_APP_ID: "PASTE_YOUR_FIREBASE_APP_ID_HERE",
    FIREBASE_MEASUREMENT_ID: "PASTE_YOUR_FIREBASE_MEASUREMENT_ID_HERE"
};

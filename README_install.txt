# Thrivoy Deployment Guide

## Step 1: Google Apps Script (backend)
1. Open the Apps Script project (the one with appscript v3).
2. Open Project Settings → Script properties.
3. Ensure these properties exist:
   - GEMINI_KEYS = (comma-separated Gemini API keys)
   - GITHUB_OWNER = your GitHub username
   - GITHUB_REPO = your GitHub repository name
   - GITHUB_TOKEN = GitHub token (if push is used)
4. Deploy as Web app:
   - Deploy → New deployment → Web app
   - Execute as: Me
   - Who has access: Anyone (or Anyone, even anonymous)
   - Copy the "exec" URL

## Step 2: Frontend (GitHub Pages)
1. Edit `config.js`:
   const APPS_SCRIPT_URL = "YOUR EXEC URL HERE";
2. Upload/replace these files in your GitHub repo:
   - config.js
   - onboard.html
   - thankyou.html
   - dashboard.html
   - styles.css
   - README_install.txt (this guide)
3. Commit and push. Wait 1–2 minutes for GitHub Pages to update.

## Step 3: Test the flow
1. Open `onboard.html` on your GitHub Pages site.
2. Fill Business Name + Email + Intelligence Questions.
3. Submit → you should be redirected to thankyou.html?businessId=...&remember=true
4. On thankyou.html your Business ID should show.
5. Go to dashboard → it should load your AI tagline and 7-day content plan.

## Step 4: Troubleshooting
- If onboarding fails: check APPS_SCRIPT_URL in config.js matches the "exec" URL.
- If dashboard fails: ensure businessId is stored in localStorage (thankyou.html auto-saves it if ?remember=true).
- If "Unknown action" error: check your Apps Script v3 doGet/doPost has that action implemented.
- If "JSONP timeout": check your Apps Script deployment permissions (must allow anonymous).

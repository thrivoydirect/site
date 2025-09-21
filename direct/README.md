# Thrivoy Frontend - Complete Setup Guide

This repository contains the frontend files for your Thrivoy system that connects to your Apps Script backend. The setup is designed to avoid CORS issues and provide seamless communication between GitHub Pages and Google Apps Script.

## 📁 File Structure

```
your-repository/
├── index.html          # Landing page
├── onboard.html        # Sign-up form
├── dashboard.html      # User dashboard
├── thank-you.html      # Post-signup success page
├── config.js          # Configuration and API handler
├── README.md          # This file
└── sites/             # Generated websites (auto-created)
    └── BIZ-xxxxx/     # Individual business sites
        ├── index.html
        └── styles.css
```

## 🚀 Quick Setup (5 minutes)

### Step 1: Deploy Your Apps Script
1. Open your Apps Script project
2. Click **Deploy** → **New Deployment**
3. Choose **Web App** as the type
4. Set **Execute as**: Me
5. Set **Who has access**: Anyone
6. Click **Deploy** and copy the Web App URL

### Step 2: Configure Frontend
1. Open `config.js` in your repository
2. Replace `YOUR_DEPLOYMENT_ID` with your actual deployment ID from the URL:
   ```javascript
   // Change this line:
   API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
   
   // To something like:
   API_URL: 'https://script.google.com/macros/s/AKfycbw1234567890abcdef/exec',
   ```

### Step 3: Enable GitHub Pages
1. Go to your repository Settings
2. Scroll to **Pages** section
3. Select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**

Your frontend will be available at: `https://yourusername.github.io/your-repo-name`

## 🔧 Configuration Options

### API Configuration
In `config.js`, you can customize:

```javascript
const THRIVOY_CONFIG = {
    API_URL: 'YOUR_APPS_SCRIPT_URL',
    DEBUG: true,                    // Enable console logging
    REQUEST_TIMEOUT: 30000,         // 30 second timeout
    MAX_RETRIES: 3,                 // Retry failed requests
    
    FEATURES: {
        AI_CONTENT_GENERATION: true,
        SOCIAL_SHARING: true,
        PAYMENT_INTEGRATION: true,
        ANALYTICS_TRACKING: true
    }
};
```

### CORS Solution
The frontend uses JSONP (JSON with Padding) to avoid CORS issues:
- Primary method: JSONP requests to Apps Script
- Fallback: Standard POST requests with CORS headers
- Automatic retry logic with exponential backoff

## 📋 Backend Requirements

Ensure your Apps Script has these functions:
- `onboardNewBusiness_()` - Handle new signups
- `getDashboardData()` - Return dashboard info
- `getThankYouData()` - Return success page data
- `generateSmartTaglineForBusiness()` - AI content generation
- `createPaymentInvoice()` - Payment processing

## 🎨 Customization

### Colors and Branding
Edit CSS variables in any HTML file:

```css
:root {
    --primary-color: #1166EE;      /* Main brand color */
    --secondary-color: #FF8800;    /* Accent color */
    --accent-color: #28a745;       /* Success color */
}
```

### Content Updates
- **Landing page**: Edit `index.html`
- **Form fields**: Modify `onboard.html`
- **Dashboard layout**: Update `dashboard.html`
- **Success messaging**: Change `thank-you.html`

## 🔍 Testing the Setup

### 1. Test API Connection
Open browser console on any page and run:
```javascript
ThrivoyAPI.healthCheck().then(result => {
    console.log('API Status:', result ? 'Connected' : 'Failed');
});
```

### 2. Test Form Submission
1. Go to your GitHub Pages URL + `/onboard.html`
2. Fill out the form with test data
3. Submit and check for success/error messages
4. Verify data appears in your Google Spreadsheet

### 3. Test Dashboard
Access: `your-site.com/dashboard.html?businessId=BIZ-1234567890`

## 🚨 Common Issues & Solutions

### CORS Errors
**Problem**: "Access to fetch blocked by CORS policy"
**Solution**: The frontend automatically uses JSONP to avoid CORS. Ensure your Apps Script deployment allows "Anyone" access.

### API Connection Failed
**Problem**: API health check fails
**Solutions**:
1. Verify Apps Script deployment URL is correct in `config.js`
2. Check Apps Script is deployed as "Web App" not "API Executable"
3. Ensure "Execute as: Me" and "Who has access: Anyone"

### Form Submission Errors
**Problem**: Form submits but no data received
**Solutions**:
1. Check Apps Script logs for errors
2. Verify `onboardNewBusiness_()` function exists and is correct
3. Test API endpoint directly: `your-script-url?action=test`

### Website Generation Fails
**Problem**: Website created but not accessible
**Solutions**:
1. Verify GitHub token has repo write permissions
2. Check GitHub Pages is enabled and deployed
3. Ensure GitHub repository is public or GitHub Pro account

## 📊 Analytics & Monitoring

The frontend automatically logs:
- Page visits and form interactions
- API request success/failure rates
- User journey through signup flow
- Error occurrences with context

Access logs in your master spreadsheet "Logs" tab.

## 🔒 Security Considerations

### Data Protection
- All form data is validated before submission
- Phone numbers are formatted and validated
- Email addresses are verified with regex
- SQL injection prevention through parameterized queries

### API Security
- Rate limiting prevents abuse (15 requests/minute)
- Request timeouts prevent hanging connections
- Automatic retry with exponential backoff
- Error messages don't expose sensitive information

## 🛠️ Advanced Configuration

### Custom Domain Setup
1. Add CNAME file to repository root:
   ```
   yourdomain.com
   ```
2. Configure DNS A records to point to GitHub Pages IPs
3. Update `config.js` with your custom domain

### Email Integration
Configure in Apps Script properties:
- `ADMIN_EMAIL`: For system alerts
- `SUPPORT_EMAIL`: Customer support address
- `DEFAULT_SENDER`: Email sender name

### Payment Gateway
Currently supports UPI payments. Configure:
- `UPI_ID`: Your business UPI ID
- Payment webhook URLs for verification

## 📞 Support

### Self-Help
1. Check browser console for error messages
2. Verify all configuration steps completed
3. Test individual components separately

### Contact Support
- **WhatsApp**: +91 7892159170
- **Email**: support@thrivoy.com
- **GitHub Issues**: Create issue in this repository

## 🚀 Deployment Checklist

Before going live:

- [ ] Apps Script deployed with correct permissions
- [ ] `config.js` updated with production API URL
- [ ] GitHub Pages enabled and working
- [ ] Test complete signup flow end-to-end
- [ ] Verify email notifications working
- [ ] Check payment integration (if enabled)
- [ ] Test on mobile devices
- [ ] Verify all links and redirects work
- [ ] Check website generation working
- [ ] Test dashboard functionality

## 📈 Performance Tips

### Optimization
- Images are optimized and properly sized
- CSS and JS are minified in production
- API requests use caching where appropriate
- Forms include client-side validation

### Monitoring
- Monitor API response times
- Track conversion rates through funnel
- Watch for error patterns in logs
- Monitor website generation success rates

## 🔄 Updates and Maintenance

### Frontend Updates
1. Test changes locally first
2. Commit to repository
3. GitHub Pages auto-deploys changes
4. Monitor for issues post-deployment

### Backend Updates
1. Test in Apps Script editor
2. Deploy new version
3. Update frontend config if API changes
4. Coordinate frontend/backend deployments

---

## 💡 Pro Tips

1. **Always test with real data** - Use actual business information to verify AI content generation
2. **Monitor user feedback** - Check logs for common issues or user pain points
3. **Keep backups** - Regularly backup your spreadsheet data
4. **Performance monitoring** - Track page load times and API response times
5. **Mobile-first** - Test primarily on mobile devices as most users will be on mobile

---

*Created for Thrivoy - AI-powered professional websites. Questions? Contact us on WhatsApp: +91 7892159170*

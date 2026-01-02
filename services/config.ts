
/**
 * CONFIGURATION FOR GOOGLE SHEETS INTEGRATION
 * 
 * 1. Open your "Slack Activity" Sheet.
 * 2. Extensions > Apps Script > Paste the provided doGet() function.
 * 3. Deploy > New Deployment > Web App > Access: Anyone.
 * 4. Paste the resulting URL below.
 */
export const CONFIG = {
  /**
   * BRANDING
   * To use a Google Drive logo:
   * 1. Share the file to "Anyone with the link"
   * 2. Use format: https://lh3.googleusercontent.com/d/FILE_ID
   */
  LOGO_URL: "https://lh3.googleusercontent.com/d/1CxBpmZlInT4DtK1wjeBArTevN7_drrMI", // Change this to your Google Drive direct link if needed

  /**
   * PASTE YOUR GOOGLE APPS SCRIPT URL HERE
   */
  GOOGLE_SHEET_API_URL: "https://script.google.com/macros/s/AKfycbxJwvPkcTtjsByd3a9qfSrwvhEotU7jr-_fvzODQ5V84wgQcmoDGeGsMouZ57xZOR9USA/exec", 
  
  // Program Rules
  PROGRAM_SETTINGS: {
    MIN_DAYS_FOR_CERTIFICATE: 60,
    MIN_HOURS_PER_DAY: 2.5,
    MAX_ALLOWED_GAP_DAYS: 3,
    TOTAL_INTERNSHIP_MONTHS: 3
  }
};

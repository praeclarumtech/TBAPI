/**
 * Google Drive OAuth callback routes (mounted at /tb).
 * Used so production https://app.praeclarumtech.com/tb/callback is handled by the main app (no 502).
 * GET /tb         → redirect to Google sign-in
 * GET /tb/callback → exchange code for refresh token, show token in HTML and log to server
 */
import express from 'express';
import { google } from 'googleapis';
import logger from '../../loggers/logger.js';

const router = express.Router();
const SCOPES = ['https://www.googleapis.com/auth/drive'];

function getRedirectUri(req) {
  const uri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  if (uri) return uri;
  const protocol = req.protocol || 'https';
  const host = req.get('host') || req.hostname;
  const isLocal =
    host === 'localhost' ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('localhost:');
  const path = isLocal ? '/callback' : '/tb/callback';
  return `${protocol}://${host}${path}`;
}
// redirect_uri_mismatch? Add the exact redirect URI above to Google Cloud Console:
// APIs & Services > Credentials > your OAuth 2.0 Client ID > Authorized redirect URIs

router.get('/', (req, res) => {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res
      .status(500)
      .send(
        '<h1>Config missing</h1><p>Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET in .env</p>'
      );
    return;
  }
  const redirectUri = getRedirectUri(req);
  logger.info(
    'Google Drive OAuth redirect_uri (add this in Google Console): ' +
      redirectUri
  );
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.redirect(302, authUrl);
});

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    res.redirect(302, '/tb');
    return;
  }
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res
      .status(500)
      .send(
        '<h1>Config missing</h1><p>Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET in .env</p>'
      );
    return;
  }
  try {
    const redirectUri = getRedirectUri(req);
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;
    if (!refreshToken) {
      res
        .status(500)
        .send(
          '<h1>No refresh token</h1><p>Revoke app access at <a href="https://myaccount.google.com/permissions" target="_blank">Google Account permissions</a>, then open <a href="/tb">/tb</a> again and sign in.</p>'
        );
      return;
    }
    logger.info(
      'Google Drive refresh token obtained (add to .env as GOOGLE_DRIVE_REFRESH_TOKEN)'
    );
    console.log('\n---------- COPY THIS REFRESH TOKEN TO .env ----------\n');
    console.log(refreshToken);
    console.log('\n---------- END REFRESH TOKEN ----------\n');
    res.send(
      `<h1>Success</h1><p>Copy the refresh token from your <strong>server logs</strong> (or terminal) and add it to .env as <code>GOOGLE_DRIVE_REFRESH_TOKEN</code>. You can close this tab.</p>`
    );
  } catch (err) {
    logger.error('Drive token exchange failed: ' + err.message);
    if (!res.headersSent) {
      res
        .status(500)
        .send('<h1>Error</h1><pre>' + String(err.message) + '</pre>');
    }
  }
});

export default router;

/**
 * One-time script to get a Google Drive OAuth2 refresh token for a Gmail/personal account.
 * Run: node scripts/getDriveRefreshToken.js
 *
 * Prerequisites:
 * 1. In Google Cloud Console: APIs & Services > Credentials > Create Credentials > OAuth client ID
 * 2. Application type: "Web application" (or Desktop)
 * 3. Add redirect URI(s): http://localhost:4000 and/or https://app.praeclarumtech.com/tb
 * 4. In .env set: GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET
 *
 * Local: run script, open http://localhost:4000, sign in, copy refresh token to .env
 * Production redirect: set GOOGLE_DRIVE_REDIRECT_URI=https://app.praeclarumtech.com/tb in .env,
 *   run this script on the server that serves /tb (or proxy /tb to this script's port), then open the printed auth URL.
 */

import { google } from 'googleapis';
import http from 'http';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', '.env') });

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const REDIRECT_URI =
  process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:4000';
const REDIRECT_PATH = new URL(REDIRECT_URI).pathname || '/';
const DRIVE_TOKEN_ENV_PREFIX = process.env.DRIVE_TOKEN_ENV_PREFIX || 'GOOGLE_DRIVE';
const refreshTokenEnvName = `${DRIVE_TOKEN_ENV_PREFIX}_REFRESH_TOKEN`;
// Use DRIVE_TOKEN_PORT for this script so it doesn't conflict with main app (PORT=4000)
const PORT = process.env.DRIVE_TOKEN_PORT
  ? parseInt(process.env.DRIVE_TOKEN_PORT, 10)
  : process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 4000;

const clientId =
  process.env[`${DRIVE_TOKEN_ENV_PREFIX}_CLIENT_ID`] ||
  process.env.GOOGLE_DRIVE_CLIENT_ID;
const clientSecret =
  process.env[`${DRIVE_TOKEN_ENV_PREFIX}_CLIENT_SECRET`] ||
  process.env.GOOGLE_DRIVE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(
    `Missing ${DRIVE_TOKEN_ENV_PREFIX}_CLIENT_ID or ${DRIVE_TOKEN_ENV_PREFIX}_CLIENT_SECRET in .env`
  );
  console.error(
    'Create an OAuth 2.0 Client ID (Web application) in Google Cloud Console and add the redirect URI:',
    REDIRECT_URI
  );
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  REDIRECT_URI
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // force consent so we get refresh_token every time
});

async function handleRequest(req, res) {
  const host = req.headers.host || `localhost:${4001}`;
  const url = new URL(req.url || '/', `http://${host}`);
  const pathMatch =
    url.pathname === '/callback' ||
    url.pathname === '/' ||
    url.pathname === REDIRECT_PATH;
  const server = req.socket?.server;
  if (pathMatch) {
    const code = url.searchParams.get('code');
    if (!code) {
      res.writeHead(302, { Location: authUrl });
      res.end();
      return;
    }
    try {
      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;
      if (!refreshToken) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          '<h1>No refresh token</h1><p>Revoke app access at <a href="https://myaccount.google.com/permissions" target="_blank">Google Account permissions</a>, then run this script again and sign in.</p>'
        );
        if (server) server.close();
        process.exit(1);
      }
      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Drive token</title>
<style>
  body { font-family: system-ui,sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
  h1 { color: #0d6; }
  pre { background: #f4f4f4; padding: 1rem; border-radius: 8px; overflow-x: auto; word-break: break-all; }
  button { margin-top: 0.5rem; padding: 0.5rem 1rem; cursor: pointer; }
</style>
</head>
<body>
  <h1>Success</h1>
      <p>Copy the token below and add it to .env as <code>${refreshTokenEnvName}</code>:</p>
  <pre id="token">${refreshToken}</pre>
  <button onclick="navigator.clipboard.writeText(document.getElementById('token').innerText); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy to clipboard', 2000)">Copy to clipboard</button>
</body>
</html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      console.log('\n---------- COPY THIS REFRESH TOKEN TO .env ----------\n');
      console.log(refreshToken);
      console.log('\n---------- END REFRESH TOKEN ----------\n');
      console.log(`Add to .env: ${refreshTokenEnvName}=${refreshToken}`);
      if (server) server.close();
      process.exit(0);
    } catch (err) {
      console.error('Token exchange failed:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h1>Error</h1><pre>' + err.message + '</pre>');
      if (server) server.close();
      process.exit(1);
    }
    return;
  }
  res.writeHead(302, { Location: authUrl });
  res.end();
}

function startServer(port) {
  const server = http.createServer(handleRequest);
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const fallback = port === 4000 ? 4001 : port + 1;
      console.warn(`Port ${port} in use, trying ${fallback}...`);
      startServer(fallback);
    } else {
      throw err;
    }
  });
  server.listen(port, () => {
    if (REDIRECT_URI.startsWith('http://localhost')) {
      console.log(
        `\nOpen this URL in your browser (sign in with the Google account that owns the Drive folder):\n  http://localhost:${port}\n`
      );
    } else {
      console.log(
        `\nRedirect URI: ${REDIRECT_URI}\nOpen this URL in your browser, sign in, then you will be redirected back to your app:\n  ${authUrl}\n`
      );
    }
  });
}
startServer(PORT);

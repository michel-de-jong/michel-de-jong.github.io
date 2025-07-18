# Debug Directory

This directory contains debugging and deployment tools for the ROI Calculator application.

## Files

### deployment-config.js
- **Purpose**: Configuration for GitHub Pages deployment and debugging
- **Usage**: Automatically loaded by index.html when present
- **Note**: This is NOT the main application configuration (which is in `js/config/config.js`)

### diagnostic.html
- **Purpose**: Diagnostic tool to troubleshoot deployment issues
- **Usage**: Navigate to `https://[username].github.io/[repo]/debug/diagnostic.html`
- **Features**:
  - Environment detection
  - File availability checking
  - Module loading tests
  - Error reporting

## Important Notes

1. **This directory is for debugging only** - It can be safely removed in production
2. **Main app config remains in `js/config/`** - Don't confuse the two
3. **deployment-config.js is optional** - The app will work without it

## Using deployment-config.js

To use the deployment configuration:

1. Edit `debug/deployment-config.js`
2. Set your repository name:
   ```javascript
   GITHUB_REPO_NAME: 'your-repo-name'
   ```
3. Enable/disable debug features as needed
4. Commit and push changes

## Debug Mode

When debug mode is enabled, you'll see detailed logging in the browser console:
- Module loading attempts
- Path resolution
- Performance metrics
- Error details

To disable debug mode, set:
```javascript
DEBUG_MODE: false
```

## Production Deployment

For production deployment, you can:
1. Keep the debug directory but disable debug mode
2. Remove the entire debug directory
3. Remove the script tag loading deployment-config.js from index.html

The application will continue to work correctly in all cases.
# Deployment Guide for Rook Game

## Quick Start

Your Rook game is now ready to deploy to GitHub Pages!

## What's Been Set Up

1. **Vite Configuration** (`rook-game/vite.config.ts`)
   - Added `base: '/RookGame/'` for GitHub Pages compatibility

2. **GitHub Actions Workflow** (`.github/workflows/deploy.yml`)
   - Automatically builds and deploys on push to main branch
   - Can also be triggered manually from GitHub Actions tab

## Deployment Steps

### 1. Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: Select **GitHub Actions**

### 2. Push Your Code

```bash
# Make sure you're in the root directory
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

### 3. Monitor Deployment

1. Go to the **Actions** tab in your GitHub repository
2. Watch the "Deploy to GitHub Pages" workflow run
3. Once complete (green checkmark), your site is live!

### 4. Access Your Game

Your game will be available at:
```
https://[your-github-username].github.io/RookGame/
```

For example, if your username is `johndoe`:
```
https://johndoe.github.io/RookGame/
```

## Troubleshooting

### Build Fails
- Check the Actions tab for error details
- Ensure all tests pass: `cd rook-game && npm test`
- Ensure build works locally: `cd rook-game && npm run build`

### 404 Error After Deployment
- Verify GitHub Pages is enabled in Settings
- Check that the workflow completed successfully
- Wait a few minutes for DNS propagation

### Assets Not Loading
- Verify `base: '/RookGame/'` is set in `vite.config.ts`
- If deploying to a different repo name, update the base path

## Manual Deployment

If you prefer to deploy manually or to a different hosting provider:

```bash
cd rook-game
npm run build
```

The `dist` folder will contain your production-ready files. Upload these to any static hosting service:
- Netlify
- Vercel
- AWS S3 + CloudFront
- Azure Static Web Apps
- etc.

## Updating the Deployment

Every time you push to the main branch, GitHub Actions will automatically:
1. Install dependencies
2. Run the build
3. Deploy to GitHub Pages

No manual intervention needed!

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to `rook-game/public/` with your domain
2. Configure DNS settings with your domain provider
3. Update GitHub Pages settings with your custom domain

## Notes

- The workflow runs on Node.js 20
- Build artifacts are cached for faster deployments
- The deployment uses the official GitHub Pages action
- All 160 unit tests pass ✅

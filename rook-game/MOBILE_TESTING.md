# Mobile Testing Guide

## Quick Start

There are three ways to test your Rook game on mobile devices while developing:

## 1. Browser DevTools (Fastest)

### Chrome/Edge
1. Start dev server: `npm run dev`
2. Open DevTools: `F12` or `Cmd+Option+I` (Mac)
3. Toggle device toolbar: `Ctrl+Shift+M` or `Cmd+Shift+M` (Mac)
4. Select a device preset:
   - iPhone 14 Pro
   - iPhone SE
   - iPad Air
   - Samsung Galaxy S20
   - Or set custom dimensions

### Firefox
1. Start dev server: `npm run dev`
2. Open DevTools: `F12`
3. Toggle Responsive Design Mode: `Ctrl+Shift+M` or `Cmd+Option+M` (Mac)
4. Choose device or custom size

### Tips
- Test both portrait and landscape orientations
- Test different screen sizes (small phone, large phone, tablet)
- Use the touch simulation mode
- Check the console for any mobile-specific errors

## 2. Test on Your Real Phone (Recommended)

This gives you the most accurate testing experience with real touch interactions.

### Setup Steps:

1. **Make sure your phone and computer are on the same WiFi network**

2. **Start the dev server:**
   ```bash
   cd rook-game
   npm run dev
   ```

3. **Find your computer's local IP address:**
   - The dev server will show it when it starts
   - Look for a line like: `Network: http://192.168.11.133:5173/`

4. **On your phone:**
   - Open your mobile browser (Safari, Chrome, etc.)
   - Navigate to: `http://192.168.11.133:5173/`
   - Replace `192.168.11.133` with your actual IP address

5. **Bookmark it** for easy access during development

### Troubleshooting:

**Can't connect from phone?**
- Verify both devices are on the same WiFi network
- Check if your firewall is blocking port 5173
- Try disabling VPN if you're using one
- Make sure the dev server is running

**Page loads but looks broken?**
- Clear your mobile browser cache
- Try hard refresh (close and reopen the browser)

## 3. QR Code Access (Bonus)

You can generate a QR code to quickly access your dev server:

1. Install a QR code generator:
   ```bash
   npm install -g qrcode-terminal
   ```

2. Generate QR code for your local IP:
   ```bash
   qrcode-terminal "http://192.168.11.133:5173"
   ```

3. Scan with your phone's camera

## Testing Checklist

When testing on mobile, check:

- [ ] All cards are visible and properly sized
- [ ] Touch interactions work (tap, swipe)
- [ ] Buttons are large enough to tap easily (44px minimum)
- [ ] Text is readable without zooming
- [ ] Modals and overlays display correctly
- [ ] Animations are smooth
- [ ] Game fits in viewport without horizontal scrolling
- [ ] Both portrait and landscape orientations work
- [ ] Help modal is readable and scrollable
- [ ] Settings modal works properly
- [ ] Score displays are visible

## Responsive Breakpoints

The game uses these breakpoints:

- **Desktop**: 1024px and above
- **Tablet**: 768px - 1023px
- **Mobile**: Below 768px
- **Small Mobile**: Below 480px

Test at each breakpoint to ensure proper layout.

## Browser Compatibility

Test on multiple mobile browsers:
- Safari (iOS)
- Chrome (Android/iOS)
- Firefox (Android)
- Samsung Internet (Android)

## Performance Testing

On mobile devices, also check:
- Page load time
- Animation smoothness (60fps target)
- Memory usage (check DevTools)
- Battery impact during gameplay

## Hot Reload

The dev server supports hot module replacement (HMR), so changes you make will automatically update on your phone without refreshing!

## Current Configuration

Your dev server is configured to:
- Listen on all network interfaces (`host: true`)
- Run on port 5173
- Support hot module replacement
- Allow access from any device on your local network

Your current local IP: `192.168.11.133`
Access URL: `http://192.168.11.133:5173/`

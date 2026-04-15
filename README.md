# Simple Health Tracker

A lightweight, privacy-focused health tracking web app optimized for iPhone. Track your food intake, calories, macros, and weight with a simple text-based input interface.

## Features

- **Quick Food Entry**: Type "chicken breast 220g" and hit enter - that's it!
- **Automatic Calorie Calculation**: Built-in food database with common foods
- **Macro Tracking**: Track protein, carbs, and fat
- **Weight Tracking**: Log your daily weight
- **Goal Setting**: Set daily calorie and macro goals
- **Trends & Analytics**: View your progress over time
- **100% Private**: All data stored locally on your device
- **Offline Support**: Works without internet (PWA)
- **iPhone Optimized**: Designed for mobile-first experience

## Quick Start

### Option 1: GitHub Pages (Free & Easy)

1. **Enable GitHub Pages**:
   - Go to your repository Settings
   - Navigate to Pages (under Code and automation)
   - Under "Source", select "Deploy from a branch"
   - Select the `claude/add-simple-food-input` branch (or merge to main and use main)
   - Select `/ (root)` folder
   - Click Save

2. **Access your app**:
   - Your app will be available at: `https://connercattaneo.github.io/simple_health_tracker/`
   - Wait a few minutes for deployment

3. **Add to iPhone Home Screen**:
   - Open the URL in Safari on your iPhone
   - Tap the Share button (square with arrow)
   - Scroll down and tap "Add to Home Screen"
   - Tap "Add"
   - Now you have a standalone app icon!

### Option 2: Netlify (Free with custom domain)

1. Go to [Netlify](https://netlify.com)
2. Sign up/login with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose GitHub and select this repository
5. Build settings:
   - Branch: `claude/add-simple-food-input` (or main after merge)
   - Build command: (leave empty)
   - Publish directory: `/`
6. Click "Deploy site"
7. Your app will be at a random URL like `random-name-123.netlify.app`
8. You can customize the domain in Site settings

### Option 3: Vercel (Free)

1. Go to [Vercel](https://vercel.com)
2. Sign up/login with GitHub
3. Click "Add New" → "Project"
4. Import this repository
5. Framework Preset: "Other"
6. Root Directory: `./`
7. Click "Deploy"

### Option 4: Local Testing

```bash
# Clone the repository
git clone https://github.com/connercattaneo/simple_health_tracker.git
cd simple_health_tracker

# Serve locally with Python
python3 -m http.server 8000

# Or with Node.js
npx serve .

# Open http://localhost:8000 in your browser
```

## How to Use

### Adding Food

Just type naturally in the food input box:
- `chicken breast 220g`
- `2 eggs`
- `banana`
- `rice 150g`
- `protein shake`

The app will automatically calculate calories and macros based on its built-in food database.

### Logging Weight

Enter your weight in the weight input field and click "Log Weight". This will save your weight for the current day.

### Setting Goals

1. Tap the Settings icon (⚙️) at the bottom
2. Enter your daily calorie goal
3. Enter your macro goals (protein, carbs, fat in grams)
4. Tap "Save Goals"

### Viewing Trends

Tap the Trends icon (📊) to see:
- Weight trend over the last 30 days
- Calorie intake over the last 7 days
- Current weight and average calories

### Navigating Dates

Use the arrow buttons (‹ ›) next to the date to view previous or future days.

## Supported Foods

The app includes a built-in database of common foods:

**Proteins**: chicken, salmon, tuna, eggs, steak, turkey, etc.
**Carbs**: rice, pasta, bread, oats, quinoa, potato, etc.
**Fruits**: banana, apple, orange, berries, etc.
**Vegetables**: broccoli, spinach, carrots, tomato, etc.
**Fats/Nuts**: almonds, peanut butter, avocado, olive oil, etc.
**Dairy**: milk, cheese, greek yogurt, etc.

The database will be expanded in future updates. For now, unlisted foods will use estimated values.

## Data Privacy

- **100% Local Storage**: All your data stays on your device
- **No Server**: No data is sent to any server
- **No Tracking**: No analytics or tracking
- **No Account Required**: No signup, no login

Your data is stored in your browser's localStorage. To backup your data:
1. Go to Settings
2. Tap "Export Data"
3. Save the JSON file somewhere safe

To restore data:
1. Go to Settings
2. Tap "Import Data"
3. Select your backup JSON file

## PWA Installation

This is a Progressive Web App (PWA), which means you can install it on your iPhone like a native app:

**On iPhone**:
1. Open the app URL in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Tap "Add"

**On Android**:
1. Open the app URL in Chrome
2. Tap the menu (⋮)
3. Tap "Add to Home Screen"
4. Tap "Add"

## Browser Compatibility

- **Safari** (iOS 14+): ✅ Full support
- **Chrome** (Android): ✅ Full support
- **Chrome** (Desktop): ✅ Full support
- **Firefox**: ✅ Full support
- **Edge**: ✅ Full support

## Future Enhancements

Potential features to add:
- [ ] AI-powered food parsing using Claude API
- [ ] USDA FoodData Central API integration for comprehensive food database
- [ ] Barcode scanning
- [ ] Photo-based food logging
- [ ] Meal templates/favorites
- [ ] Custom foods
- [ ] Cloud sync (optional)
- [ ] Dark mode
- [ ] Weekly/monthly reports
- [ ] Export to CSV
- [ ] Nutrition goals by percentage
- [ ] Water tracking
- [ ] Exercise tracking

## Customization

### Adding More Foods

Edit the `foodDB` object in `app.js` to add more foods:

```javascript
const foodDB = {
    'your food name': {
        calories: 100,
        protein: 10,
        carbs: 5,
        fat: 2,
        per: 100  // or 'item' for per-item foods
    },
    // ... more foods
};
```

### Changing Colors

Edit the CSS variables in `styles.css`:

```css
:root {
    --primary-color: #007AFF;  /* Change to your preferred color */
    --secondary-color: #34C759;
    /* ... etc */
}
```

## Tech Stack

- **Frontend**: Vanilla JavaScript (no frameworks)
- **Storage**: localStorage API
- **PWA**: Service Worker for offline support
- **Styling**: Pure CSS with CSS variables
- **Icons**: Emoji (no icon libraries needed)

## File Structure

```
simple_health_tracker/
├── index.html          # Main HTML structure
├── styles.css          # All styling
├── app.js              # Main application logic
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline support
├── create-icons.html   # Icon generator utility
└── README.md           # This file
```

## Contributing

Feel free to fork this repository and customize it for your needs!

## License

MIT License - feel free to use this however you want.

## Support

This is a personal project. No official support is provided, but feel free to open issues for bug reports or feature requests.

---

**Privacy Notice**: This app stores all data locally on your device. No data is transmitted to any server. Your health data remains private and under your control.

# Simple Health Tracker

A lightweight, privacy-focused health tracking web app optimized for iPhone. Track your food intake, calories, macros, and weight with a simple text-based input interface.

## Features

- **Quick Food Entry**: Type "chicken breast 220g" and hit enter - that's it!
- **Meal Organization**: Separate foods by breakfast, lunch, dinner, and snacks
- **Copy Meals**: Repeat meals from previous days with one click
- **Barcode Scanner**: Scan product barcodes to automatically lookup nutrition information
- **External Food Database**: Searches USDA FoodData Central with 300,000+ foods
- **Smart Food Matching**: Shows multiple options when there are similar foods
- **Advanced Food Parsing**: Supports lean meat percentages (e.g., "ground beef 88/12")
- **Automatic Calorie Calculation**: Accurate nutrition data from comprehensive database
- **Offline Fallback**: Built-in food database for when API is unavailable
- **Macro Tracking**: Track protein, carbs, and fat
- **Flexible Goal Setting**: Set goals by absolute grams OR by percentage of calories
- **Edit Food Entries**: Modify calories and macros for any logged food
- **Weight Tracking**: Log your daily weight (auto-hides after logging)
- **Trends & Analytics**: View your progress over time with interactive charts
- **Dark Mode**: Easy on the eyes with full dark mode support
- **Smart UI**: Weight logging section hides after entry for cleaner interface
- **Single Point Charts**: Charts display properly even with just one data point
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

The app will:
1. Search the USDA food database for matches
2. If multiple foods match, show you options to choose from
3. Calculate calories and macros based on your quantity
4. Fall back to the built-in database if the API is unavailable

### Setting Up Your USDA API Key (Recommended)

The app uses a public demo API key limited to 30 requests/hour. For better performance:

1. Go to https://fdc.nal.usda.gov/api-key-signup.html
2. Sign up for a free API key (no credit card required)
3. Open the app and go to Settings (⚙️)
4. Paste your API key in the "USDA API Configuration" section
5. Click "Save Settings"

**Security Note:** Your API key is stored locally in your browser's localStorage and is never committed to the repository or shared with anyone.

### Using Meal Categories

When adding food, select the meal type from the dropdown:
- 🍳 Breakfast
- 🥗 Lunch
- 🍽️ Dinner
- 🍎 Snack

Your foods will be organized by meal type with calorie subtotals for each meal.

### Copying Meals from Previous Days

Save time by repeating meals:
1. Click the "📋 Copy Meal" button in the food log
2. Select a previous date (last 7 days)
3. Choose which meal (breakfast, lunch, dinner, or snacks) to copy
4. All foods from that meal will be added to today

### Logging Weight

Enter your weight in the weight input field and click "Log Weight". This will save your weight for the current day.

### Setting Goals

1. Tap the Settings icon (⚙️) at the bottom
2. **Appearance**: Toggle dark mode on/off
3. **API Configuration**: (Optional) Add your USDA API key for better food search results
4. **Goal Type**: Choose between:
   - **Absolute (grams)**: Set exact gram amounts for protein, carbs, and fat
   - **Percentage of calories**: Set macros as a percentage (e.g., 30% protein, 40% carbs, 30% fat)
5. Enter your daily calorie goal
6. Enter your macro goals (based on your chosen goal type)
7. Tap "Save Settings"

### Viewing Trends

Tap the Trends icon (📊) to see:
- Weight trend over the last 30 days
- Calorie intake over the last 7 days
- Current weight and average calories

### Navigating Dates

Use the arrow buttons (‹ ›) next to the date to view previous or future days.

## Supported Foods

The app searches the **USDA FoodData Central database** with over 300,000 foods including:

**All Categories**: Meats, seafood, dairy, vegetables, fruits, grains, snacks, beverages, and more
**Branded Foods**: Thousands of packaged foods with accurate nutrition labels
**Restaurant Foods**: Common chain restaurant items
**Generic Foods**: Standard USDA entries for basic ingredients

If a food isn't found in the external database, the app falls back to a built-in database with common foods for offline support.

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
- [ ] AI-powered food parsing using Claude API (improve free-form text interpretation)
- [ ] Photo-based food logging
- [ ] Meal templates/favorites (save custom meal combinations)
- [ ] Custom foods (add your own recipes with nutrition info)
- [ ] Cloud sync (optional, for multi-device usage)
- [ ] Weekly/monthly reports
- [ ] Export to CSV
- [ ] Water tracking
- [ ] Exercise tracking
- [ ] Nutrition insights and recommendations

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

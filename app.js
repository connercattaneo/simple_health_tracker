// Simple Health Tracker App
// All data stored locally in browser localStorage

class HealthTracker {
    constructor() {
        this.currentDate = new Date().toISOString().split('T')[0];
        this.init();
    }

    init() {
        this.loadSettings();
        this.loadData();
        this.setupEventListeners();
        this.updateDateDisplay();
        this.renderTodayView();
        this.switchView('today');
    }

    // Settings Management
    loadSettings() {
        const defaultSettings = {
            calorieGoal: 2000,
            proteinGoal: 150,
            carbGoal: 200,
            fatGoal: 65
        };

        const saved = localStorage.getItem('healthTrackerSettings');
        this.settings = saved ? JSON.parse(saved) : defaultSettings;

        // Update UI
        document.getElementById('goalCalories').textContent = this.settings.calorieGoal;
    }

    saveSettings() {
        localStorage.setItem('healthTrackerSettings', JSON.stringify(this.settings));
    }

    // Data Management
    loadData() {
        const saved = localStorage.getItem('healthTrackerData');
        this.data = saved ? JSON.parse(saved) : {
            foodEntries: {},
            weightEntries: {}
        };
    }

    saveData() {
        localStorage.setItem('healthTrackerData', JSON.stringify(this.data));
    }

    // Event Listeners
    setupEventListeners() {
        // Food input
        document.getElementById('addFood').addEventListener('click', () => this.addFood());
        document.getElementById('foodInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addFood();
        });

        // Weight input
        document.getElementById('addWeight').addEventListener('click', () => this.addWeight());
        document.getElementById('weightInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWeight();
        });

        // Date navigation
        document.getElementById('prevDay').addEventListener('click', () => this.changeDate(-1));
        document.getElementById('nextDay').addEventListener('click', () => this.changeDate(1));

        // Bottom navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Settings
        document.getElementById('saveSettings').addEventListener('click', () => this.updateSettings());
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
    }

    // Food Entry
    addFood() {
        const input = document.getElementById('foodInput');
        const text = input.value.trim();

        if (!text) return;

        const parsed = this.parseFood(text);
        const entry = {
            id: Date.now(),
            date: this.currentDate,
            rawInput: text,
            foodName: parsed.name,
            quantity: parsed.quantity,
            unit: parsed.unit,
            calories: parsed.calories,
            protein: parsed.protein,
            carbs: parsed.carbs,
            fat: parsed.fat,
            timestamp: new Date().toISOString()
        };

        // Add to data
        if (!this.data.foodEntries[this.currentDate]) {
            this.data.foodEntries[this.currentDate] = [];
        }
        this.data.foodEntries[this.currentDate].push(entry);

        this.saveData();
        input.value = '';
        this.renderTodayView();
    }

    parseFood(text) {
        // Simple parsing logic - can be enhanced with AI later
        const patterns = {
            // Pattern: "food name XXXg" or "food name XXX g"
            withGrams: /^(.+?)\s+(\d+\.?\d*)\s*g$/i,
            // Pattern: "number food name" (e.g., "2 eggs")
            withCount: /^(\d+\.?\d*)\s+(.+)$/,
            // Pattern: just food name
            nameOnly: /^(.+)$/
        };

        let name = text;
        let quantity = 100;
        let unit = 'g';

        if (patterns.withGrams.test(text)) {
            const match = text.match(patterns.withGrams);
            name = match[1].trim();
            quantity = parseFloat(match[2]);
            unit = 'g';
        } else if (patterns.withCount.test(text)) {
            const match = text.match(patterns.withCount);
            quantity = parseFloat(match[1]);
            name = match[2].trim();
            unit = 'count';
        }

        // Get nutrition from database
        const nutrition = this.getNutrition(name, quantity, unit);

        return {
            name,
            quantity,
            unit,
            ...nutrition
        };
    }

    getNutrition(foodName, quantity, unit) {
        // Simple food database - nutritional values per 100g or per item
        const foodDB = {
            // Proteins
            'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6, per: 100 },
            'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6, per: 100 },
            'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13, per: 100 },
            'tuna': { calories: 144, protein: 30, carbs: 0, fat: 1, per: 100 },
            'egg': { calories: 78, protein: 6, carbs: 0.6, fat: 5, per: 'item' },
            'eggs': { calories: 78, protein: 6, carbs: 0.6, fat: 5, per: 'item' },
            'greek yogurt': { calories: 97, protein: 10, carbs: 3.6, fat: 5, per: 100 },
            'steak': { calories: 271, protein: 25, carbs: 0, fat: 19, per: 100 },
            'ground beef': { calories: 250, protein: 26, carbs: 0, fat: 17, per: 100 },
            'turkey': { calories: 135, protein: 30, carbs: 0, fat: 1, per: 100 },
            'pork chop': { calories: 231, protein: 23, carbs: 0, fat: 15, per: 100 },

            // Carbs
            'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, per: 100 },
            'white rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, per: 100 },
            'brown rice': { calories: 111, protein: 2.6, carbs: 23, fat: 0.9, per: 100 },
            'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, per: 100 },
            'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, per: 100 },
            'oats': { calories: 389, protein: 17, carbs: 66, fat: 7, per: 100 },
            'oatmeal': { calories: 389, protein: 17, carbs: 66, fat: 7, per: 100 },
            'quinoa': { calories: 120, protein: 4.4, carbs: 21, fat: 1.9, per: 100 },
            'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, per: 100 },
            'sweet potato': { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, per: 100 },

            // Fruits
            'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, per: 'item' },
            'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, per: 'item' },
            'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, per: 'item' },
            'strawberries': { calories: 32, protein: 0.7, carbs: 8, fat: 0.3, per: 100 },
            'blueberries': { calories: 57, protein: 0.7, carbs: 14, fat: 0.3, per: 100 },

            // Vegetables
            'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, per: 100 },
            'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, per: 100 },
            'carrots': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, per: 100 },
            'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, per: 100 },

            // Fats/Nuts
            'almonds': { calories: 579, protein: 21, carbs: 22, fat: 50, per: 100 },
            'peanut butter': { calories: 588, protein: 25, carbs: 20, fat: 50, per: 100 },
            'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15, per: 100 },
            'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, per: 100 },

            // Dairy
            'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, per: 100 },
            'cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33, per: 100 },
            'cheddar cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33, per: 100 },

            // Common meals
            'protein shake': { calories: 120, protein: 24, carbs: 3, fat: 1.5, per: 'item' },
            'pizza': { calories: 266, protein: 11, carbs: 33, fat: 10, per: 100 },
        };

        // Normalize food name
        const normalizedName = foodName.toLowerCase().trim();

        // Find matching food
        let foodData = foodDB[normalizedName];

        // Try partial matches if exact match not found
        if (!foodData) {
            for (const [key, value] of Object.entries(foodDB)) {
                if (normalizedName.includes(key) || key.includes(normalizedName)) {
                    foodData = value;
                    break;
                }
            }
        }

        // Default if not found
        if (!foodData) {
            foodData = { calories: 100, protein: 5, carbs: 10, fat: 3, per: 100 };
        }

        // Calculate based on quantity
        let multiplier = 1;
        if (foodData.per === 'item' && unit === 'count') {
            multiplier = quantity;
        } else if (foodData.per === 'item' && unit === 'g') {
            // If database is per item but user entered grams, estimate
            multiplier = quantity / 100;
        } else if (foodData.per === 100 && unit === 'g') {
            multiplier = quantity / 100;
        } else if (foodData.per === 100 && unit === 'count') {
            multiplier = quantity;
        }

        return {
            calories: Math.round(foodData.calories * multiplier),
            protein: Math.round(foodData.protein * multiplier * 10) / 10,
            carbs: Math.round(foodData.carbs * multiplier * 10) / 10,
            fat: Math.round(foodData.fat * multiplier * 10) / 10
        };
    }

    deleteFood(id) {
        const entries = this.data.foodEntries[this.currentDate];
        if (entries) {
            this.data.foodEntries[this.currentDate] = entries.filter(e => e.id !== id);
            this.saveData();
            this.renderTodayView();
        }
    }

    // Weight Entry
    addWeight() {
        const input = document.getElementById('weightInput');
        const weight = parseFloat(input.value);

        if (!weight || weight <= 0) return;

        this.data.weightEntries[this.currentDate] = {
            weight,
            date: this.currentDate,
            timestamp: new Date().toISOString()
        };

        this.saveData();
        input.value = '';
        alert(`Weight logged: ${weight} lbs`);
    }

    // Date Navigation
    changeDate(days) {
        const date = new Date(this.currentDate);
        date.setDate(date.getDate() + days);
        this.currentDate = date.toISOString().split('T')[0];
        this.updateDateDisplay();
        this.renderTodayView();
    }

    updateDateDisplay() {
        const date = new Date(this.currentDate);
        const today = new Date().toISOString().split('T')[0];

        let displayText;
        if (this.currentDate === today) {
            displayText = 'Today';
        } else {
            displayText = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }

        document.getElementById('currentDate').textContent = displayText;
    }

    // View Rendering
    renderTodayView() {
        const entries = this.data.foodEntries[this.currentDate] || [];

        // Calculate totals
        const totals = entries.reduce((acc, entry) => {
            acc.calories += entry.calories;
            acc.protein += entry.protein;
            acc.carbs += entry.carbs;
            acc.fat += entry.fat;
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        // Update summary
        document.getElementById('currentCalories').textContent = totals.calories;
        document.getElementById('currentProtein').textContent = Math.round(totals.protein);
        document.getElementById('currentCarbs').textContent = Math.round(totals.carbs);
        document.getElementById('currentFat').textContent = Math.round(totals.fat);

        // Update progress bar
        const progress = (totals.calories / this.settings.calorieGoal) * 100;
        const progressBar = document.getElementById('calorieProgress');
        progressBar.style.width = `${Math.min(progress, 100)}%`;

        if (progress > 100) {
            progressBar.classList.add('over');
        } else {
            progressBar.classList.remove('over');
        }

        // Render food list
        const foodList = document.getElementById('foodList');
        if (entries.length === 0) {
            foodList.innerHTML = '<div class="empty-state">No foods logged yet today</div>';
        } else {
            foodList.innerHTML = entries.map(entry => `
                <div class="food-item">
                    <div class="food-info">
                        <div class="food-name">${entry.foodName}</div>
                        <div class="food-details">
                            ${entry.quantity}${entry.unit} •
                            P: ${Math.round(entry.protein)}g •
                            C: ${Math.round(entry.carbs)}g •
                            F: ${Math.round(entry.fat)}g
                        </div>
                    </div>
                    <span class="food-calories">${entry.calories}</span>
                    <button class="delete-btn" onclick="app.deleteFood(${entry.id})">✕</button>
                </div>
            `).join('');
        }
    }

    renderTrendsView() {
        // Get current weight
        const currentWeightEntry = this.data.weightEntries[this.currentDate];
        if (currentWeightEntry) {
            document.getElementById('currentWeight').textContent = `${currentWeightEntry.weight} lbs`;
        } else {
            // Get most recent weight
            const dates = Object.keys(this.data.weightEntries).sort().reverse();
            if (dates.length > 0) {
                document.getElementById('currentWeight').textContent =
                    `${this.data.weightEntries[dates[0]].weight} lbs`;
            }
        }

        // Calculate 7-day average calories
        const last7Days = this.getLast7Days();
        const totalCals = last7Days.reduce((sum, date) => {
            const entries = this.data.foodEntries[date] || [];
            return sum + entries.reduce((s, e) => s + e.calories, 0);
        }, 0);
        const avgCals = Math.round(totalCals / 7);
        document.getElementById('avgCalories').textContent = avgCals;

        // Render charts (simplified without Chart.js for now)
        this.renderSimpleCharts();
    }

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    }

    getLast30Days() {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    }

    renderSimpleCharts() {
        // Simple text-based charts for now
        const weightCanvas = document.getElementById('weightChart');
        const calorieCanvas = document.getElementById('calorieChart');

        // We'll add proper chart rendering later or use a lightweight library
        const ctx1 = weightCanvas.getContext('2d');
        const ctx2 = calorieCanvas.getContext('2d');

        // Clear canvases
        ctx1.clearRect(0, 0, weightCanvas.width, weightCanvas.height);
        ctx2.clearRect(0, 0, calorieCanvas.width, calorieCanvas.height);

        // Simple placeholder text
        ctx1.font = '14px Arial';
        ctx1.fillText('Weight trend chart - coming soon', 10, 50);

        ctx2.font = '14px Arial';
        ctx2.fillText('Calorie trend chart - coming soon', 10, 50);
    }

    renderSettingsView() {
        document.getElementById('calorieGoalInput').value = this.settings.calorieGoal;
        document.getElementById('proteinGoalInput').value = this.settings.proteinGoal;
        document.getElementById('carbGoalInput').value = this.settings.carbGoal;
        document.getElementById('fatGoalInput').value = this.settings.fatGoal;
    }

    // View Switching
    switchView(view) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-view') === view) {
                btn.classList.add('active');
            }
        });

        // Hide all sections
        document.querySelector('.quick-input').style.display = view === 'today' ? 'flex' : 'none';
        document.querySelector('.weight-section').style.display = view === 'today' ? 'flex' : 'none';
        document.querySelector('.daily-summary').style.display = view === 'today' ? 'block' : 'none';
        document.querySelector('.food-log').style.display = view === 'today' ? 'block' : 'none';

        document.getElementById('trendsView').classList.toggle('hidden', view !== 'trends');
        document.getElementById('settingsView').classList.toggle('hidden', view !== 'settings');

        // Render appropriate view
        if (view === 'trends') {
            this.renderTrendsView();
        } else if (view === 'settings') {
            this.renderSettingsView();
        }
    }

    // Settings
    updateSettings() {
        this.settings.calorieGoal = parseInt(document.getElementById('calorieGoalInput').value) || 2000;
        this.settings.proteinGoal = parseInt(document.getElementById('proteinGoalInput').value) || 150;
        this.settings.carbGoal = parseInt(document.getElementById('carbGoalInput').value) || 200;
        this.settings.fatGoal = parseInt(document.getElementById('fatGoalInput').value) || 65;

        this.saveSettings();
        document.getElementById('goalCalories').textContent = this.settings.calorieGoal;
        alert('Settings saved!');
    }

    // Data Export/Import
    exportData() {
        const dataStr = JSON.stringify({
            settings: this.settings,
            data: this.data,
            exportDate: new Date().toISOString()
        }, null, 2);

        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (confirm('This will replace all current data. Continue?')) {
                    this.settings = imported.settings || this.settings;
                    this.data = imported.data || this.data;
                    this.saveSettings();
                    this.saveData();
                    alert('Data imported successfully!');
                    location.reload();
                }
            } catch (err) {
                alert('Error importing data: ' + err.message);
            }
        };
        reader.readAsText(file);
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HealthTracker();
});

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker not available, that's okay
        });
    });
}

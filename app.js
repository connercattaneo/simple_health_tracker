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
            dbFoodName: parsed.dbFoodName,
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
            'ground beef 80/20': { calories: 254, protein: 25, carbs: 0, fat: 18, per: 100 },
            'ground beef 85/15': { calories: 215, protein: 26, carbs: 0, fat: 13, per: 100 },
            'ground beef 90/10': { calories: 176, protein: 26, carbs: 0, fat: 10, per: 100 },
            'ground beef 93/7': { calories: 152, protein: 26, carbs: 0, fat: 7, per: 100 },
            'ground beef 95/5': { calories: 145, protein: 26, carbs: 0, fat: 5.5, per: 100 },
            'ground beef 88/12': { calories: 190, protein: 26, carbs: 0, fat: 12, per: 100 },
            'lean ground beef': { calories: 176, protein: 26, carbs: 0, fat: 10, per: 100 },
            'turkey': { calories: 135, protein: 30, carbs: 0, fat: 1, per: 100 },
            'ground turkey': { calories: 170, protein: 28, carbs: 0, fat: 7, per: 100 },
            'pork chop': { calories: 231, protein: 23, carbs: 0, fat: 15, per: 100 },
            'pork': { calories: 242, protein: 27, carbs: 0, fat: 14, per: 100 },
            'bacon': { calories: 541, protein: 37, carbs: 1.4, fat: 42, per: 100 },
            'ham': { calories: 145, protein: 21, carbs: 1.5, fat: 6, per: 100 },
            'shrimp': { calories: 99, protein: 24, carbs: 0.2, fat: 0.3, per: 100 },
            'cod': { calories: 82, protein: 18, carbs: 0, fat: 0.7, per: 100 },
            'tilapia': { calories: 96, protein: 20, carbs: 0, fat: 1.7, per: 100 },

            // Carbs
            'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, per: 100 },
            'white rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, per: 100 },
            'brown rice': { calories: 111, protein: 2.6, carbs: 23, fat: 0.9, per: 100 },
            'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1, per: 100 },
            'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, per: 100 },
            'whole wheat bread': { calories: 247, protein: 13, carbs: 41, fat: 3.4, per: 100 },
            'oats': { calories: 389, protein: 17, carbs: 66, fat: 7, per: 100 },
            'oatmeal': { calories: 389, protein: 17, carbs: 66, fat: 7, per: 100 },
            'quinoa': { calories: 120, protein: 4.4, carbs: 21, fat: 1.9, per: 100 },
            'potato': { calories: 77, protein: 2, carbs: 17, fat: 0.1, per: 100 },
            'sweet potato': { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, per: 100 },
            'tortilla': { calories: 218, protein: 6, carbs: 36, fat: 5, per: 100 },

            // Fruits
            'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, per: 'item' },
            'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, per: 'item' },
            'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, per: 'item' },
            'strawberries': { calories: 32, protein: 0.7, carbs: 8, fat: 0.3, per: 100 },
            'blueberries': { calories: 57, protein: 0.7, carbs: 14, fat: 0.3, per: 100 },
            'grapes': { calories: 69, protein: 0.7, carbs: 18, fat: 0.2, per: 100 },
            'watermelon': { calories: 30, protein: 0.6, carbs: 8, fat: 0.2, per: 100 },

            // Vegetables
            'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, per: 100 },
            'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, per: 100 },
            'carrots': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, per: 100 },
            'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, per: 100 },
            'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, per: 100 },
            'cucumber': { calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, per: 100 },
            'bell pepper': { calories: 31, protein: 1, carbs: 6, fat: 0.3, per: 100 },

            // Fats/Nuts
            'almonds': { calories: 579, protein: 21, carbs: 22, fat: 50, per: 100 },
            'peanuts': { calories: 567, protein: 26, carbs: 16, fat: 49, per: 100 },
            'cashews': { calories: 553, protein: 18, carbs: 30, fat: 44, per: 100 },
            'walnuts': { calories: 654, protein: 15, carbs: 14, fat: 65, per: 100 },
            'peanut butter': { calories: 588, protein: 25, carbs: 20, fat: 50, per: 100 },
            'almond butter': { calories: 614, protein: 21, carbs: 18, fat: 56, per: 100 },
            'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15, per: 100 },
            'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100, per: 100 },
            'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, per: 100 },

            // Dairy
            'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1, per: 100 },
            'whole milk': { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, per: 100 },
            'skim milk': { calories: 34, protein: 3.4, carbs: 5, fat: 0.1, per: 100 },
            'cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33, per: 100 },
            'cheddar cheese': { calories: 402, protein: 25, carbs: 1.3, fat: 33, per: 100 },
            'mozzarella': { calories: 280, protein: 28, carbs: 3.1, fat: 17, per: 100 },
            'cottage cheese': { calories: 98, protein: 11, carbs: 3.4, fat: 4.3, per: 100 },
            'yogurt': { calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3, per: 100 },

            // Common meals
            'protein shake': { calories: 120, protein: 24, carbs: 3, fat: 1.5, per: 'item' },
            'pizza': { calories: 266, protein: 11, carbs: 33, fat: 10, per: 100 },
            'burger': { calories: 295, protein: 17, carbs: 14, fat: 14, per: 100 },
        };

        // Normalize food name
        const normalizedName = foodName.toLowerCase().trim();

        // Find matching food
        let foodData = foodDB[normalizedName];
        let matchedFoodName = normalizedName;

        // Try partial matches if exact match not found
        if (!foodData) {
            for (const [key, value] of Object.entries(foodDB)) {
                if (normalizedName.includes(key) || key.includes(normalizedName)) {
                    foodData = value;
                    matchedFoodName = key;
                    break;
                }
            }
        }

        // Default if not found
        if (!foodData) {
            foodData = { calories: 100, protein: 5, carbs: 10, fat: 3, per: 100 };
            matchedFoodName = 'unknown food (estimated)';
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
            fat: Math.round(foodData.fat * multiplier * 10) / 10,
            dbFoodName: matchedFoodName
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

    editFood(id) {
        const entries = this.data.foodEntries[this.currentDate];
        const entry = entries?.find(e => e.id === id);

        if (!entry) return;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Edit Food Entry</h3>
                <div class="modal-food-name">${entry.foodName}
                    ${entry.dbFoodName ? `<span class="db-match">(${entry.dbFoodName})</span>` : ''}
                </div>
                <div class="modal-quantity">${entry.quantity}${entry.unit}</div>

                <div class="edit-form">
                    <div class="form-group">
                        <label>Calories</label>
                        <input type="number" id="editCalories" value="${entry.calories}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Protein (g)</label>
                        <input type="number" id="editProtein" value="${entry.protein}" min="0" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>Carbs (g)</label>
                        <input type="number" id="editCarbs" value="${entry.carbs}" min="0" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>Fat (g)</label>
                        <input type="number" id="editFat" value="${entry.fat}" min="0" step="0.1">
                    </div>
                </div>

                <div class="modal-buttons">
                    <button class="btn-cancel" onclick="app.closeModal()">Cancel</button>
                    <button class="btn-save" onclick="app.saveEditedFood(${id})">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus first input
        setTimeout(() => document.getElementById('editCalories').focus(), 100);
    }

    saveEditedFood(id) {
        const entries = this.data.foodEntries[this.currentDate];
        const entry = entries?.find(e => e.id === id);

        if (!entry) return;

        // Get updated values
        entry.calories = parseInt(document.getElementById('editCalories').value) || 0;
        entry.protein = parseFloat(document.getElementById('editProtein').value) || 0;
        entry.carbs = parseFloat(document.getElementById('editCarbs').value) || 0;
        entry.fat = parseFloat(document.getElementById('editFat').value) || 0;

        this.saveData();
        this.closeModal();
        this.renderTodayView();
    }

    closeModal() {
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
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

        // Show/hide weight section based on whether weight is already logged today
        const today = new Date().toISOString().split('T')[0];
        const weightSection = document.querySelector('.weight-section');
        if (this.currentDate === today && this.data.weightEntries[today]) {
            weightSection.style.display = 'none';
        } else if (this.currentDate === today) {
            weightSection.style.display = 'flex';
        } else {
            weightSection.style.display = 'none';
        }

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
                        <div class="food-name">
                            ${entry.foodName}
                            ${entry.dbFoodName && entry.dbFoodName !== entry.foodName.toLowerCase() ?
                                `<span class="db-match">(${entry.dbFoodName})</span>` : ''}
                        </div>
                        <div class="food-details">
                            ${entry.quantity}${entry.unit} •
                            P: ${Math.round(entry.protein)}g •
                            C: ${Math.round(entry.carbs)}g •
                            F: ${Math.round(entry.fat)}g
                        </div>
                    </div>
                    <span class="food-calories">${entry.calories}</span>
                    <button class="edit-btn" onclick="app.editFood(${entry.id})">✎</button>
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
        const weightCanvas = document.getElementById('weightChart');
        const calorieCanvas = document.getElementById('calorieChart');

        const ctx1 = weightCanvas.getContext('2d');
        const ctx2 = calorieCanvas.getContext('2d');

        // Set canvas size
        weightCanvas.width = weightCanvas.offsetWidth;
        weightCanvas.height = 200;
        calorieCanvas.width = calorieCanvas.offsetWidth;
        calorieCanvas.height = 200;

        // Clear canvases
        ctx1.clearRect(0, 0, weightCanvas.width, weightCanvas.height);
        ctx2.clearRect(0, 0, calorieCanvas.width, calorieCanvas.height);

        // Render weight chart
        this.renderWeightChart(ctx1, weightCanvas.width, weightCanvas.height);

        // Render calorie chart
        this.renderCalorieChart(ctx2, calorieCanvas.width, calorieCanvas.height);
    }

    renderWeightChart(ctx, width, height) {
        const last30Days = this.getLast30Days();
        const weightData = last30Days.map(date => {
            const entry = this.data.weightEntries[date];
            return entry ? entry.weight : null;
        }).filter(w => w !== null);

        if (weightData.length === 0) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#999';
            ctx.fillText('No weight data yet', 10, height / 2);
            return;
        }

        // Draw simple line chart
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        const minWeight = Math.min(...weightData) - 5;
        const maxWeight = Math.max(...weightData) + 5;
        const weightRange = maxWeight - minWeight;

        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();

        weightData.forEach((weight, i) => {
            const x = padding + (i / Math.max(weightData.length - 1, 1)) * chartWidth;
            const y = height - padding - ((weight - minWeight) / weightRange) * chartHeight;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Draw point
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });

        ctx.stroke();

        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.fillText(`${Math.round(minWeight)} lbs`, 5, height - padding);
        ctx.fillText(`${Math.round(maxWeight)} lbs`, 5, padding);
    }

    renderCalorieChart(ctx, width, height) {
        const last7Days = this.getLast7Days();
        const calorieData = last7Days.map(date => {
            const entries = this.data.foodEntries[date] || [];
            return entries.reduce((sum, e) => sum + e.calories, 0);
        });

        const hasData = calorieData.some(c => c > 0);
        if (!hasData) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#999';
            ctx.fillText('No calorie data yet', 10, height / 2);
            return;
        }

        // Draw simple bar chart
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;

        const maxCalories = Math.max(...calorieData, this.settings.calorieGoal);
        const barWidth = chartWidth / 7 - 5;

        calorieData.forEach((calories, i) => {
            const x = padding + i * (chartWidth / 7);
            const barHeight = (calories / maxCalories) * chartHeight;
            const y = height - padding - barHeight;

            ctx.fillStyle = calories > this.settings.calorieGoal ? '#f44336' : '#2196F3';
            ctx.fillRect(x, y, barWidth, barHeight);
        });

        // Draw goal line
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const goalY = height - padding - (this.settings.calorieGoal / maxCalories) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, goalY);
        ctx.lineTo(width - padding, goalY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.fillText('0', 5, height - padding);
        ctx.fillText(`${Math.round(maxCalories)}`, 5, padding);
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

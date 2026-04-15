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
            fatGoal: 65,
            darkMode: false,
            goalType: 'grams',  // 'grams' or 'percentage'
            proteinPercent: 30,
            carbPercent: 40,
            fatPercent: 30
        };

        const saved = localStorage.getItem('healthTrackerSettings');
        this.settings = saved ? JSON.parse(saved) : defaultSettings;

        // Apply dark mode
        this.applyTheme();

        // Update UI
        document.getElementById('goalCalories').textContent = this.settings.calorieGoal;
    }

    applyTheme() {
        if (this.settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
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

        // Barcode scanner
        document.getElementById('scanBarcode').addEventListener('click', () => this.scanBarcode());

        // Weight input
        document.getElementById('addWeight').addEventListener('click', () => this.addWeight());
        document.getElementById('weightInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addWeight();
        });

        // Date navigation
        document.getElementById('prevDay').addEventListener('click', () => this.changeDate(-1));
        document.getElementById('nextDay').addEventListener('click', () => this.changeDate(1));

        // Copy meal functionality
        document.getElementById('copyMealBtn').addEventListener('click', () => this.showCopyMealModal());

        // Bottom navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Settings
        document.getElementById('saveSettings').addEventListener('click', () => this.updateSettings());
        document.getElementById('darkModeToggle').addEventListener('change', (e) => {
            this.settings.darkMode = e.target.checked;
            this.applyTheme();
        });
        document.getElementById('goalTypeSelect').addEventListener('change', (e) => {
            this.toggleGoalInputs(e.target.value);
        });
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
    }

    toggleGoalInputs(type) {
        const gramsGroup = document.getElementById('gramsGoalsGroup');
        const percentageGroup = document.getElementById('percentageGoalsGroup');

        if (type === 'percentage') {
            gramsGroup.classList.add('hidden');
            percentageGroup.classList.remove('hidden');
        } else {
            gramsGroup.classList.remove('hidden');
            percentageGroup.classList.add('hidden');
        }
    }

    async scanBarcode() {
        try {
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            // Create video element and scanner modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content barcode-scanner-modal">
                    <h3>Scan Barcode</h3>
                    <video id="scannerVideo" autoplay playsinline muted></video>
                    <canvas id="scannerCanvas" style="display:none;"></canvas>
                    <p class="scanner-instructions">Position barcode in the center</p>
                    <button class="btn-cancel" onclick="app.closeBarcodeScanner()">Cancel</button>
                </div>
            `;

            document.body.appendChild(modal);

            const video = document.getElementById('scannerVideo');
            const canvas = document.getElementById('scannerCanvas');
            video.srcObject = stream;
            this.barcodeStream = stream;

            // Use native BarcodeDetector if available, otherwise use ZXing fallback
            if ('BarcodeDetector' in window) {
                // Use native BarcodeDetector API
                const barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });

                const detectBarcode = async () => {
                    try {
                        const barcodes = await barcodeDetector.detect(video);

                        if (barcodes.length > 0) {
                            const barcode = barcodes[0].rawValue;
                            this.closeBarcodeScanner();
                            await this.lookupBarcode(barcode);
                        } else if (this.barcodeStream) {
                            requestAnimationFrame(detectBarcode);
                        }
                    } catch (err) {
                        console.error('Barcode detection error:', err);
                    }
                };

                detectBarcode();
            } else {
                // Fallback: Use ZXing library for Safari and other browsers
                this.initZXingScanner(video, canvas);
            }

        } catch (error) {
            console.error('Camera access error:', error);
            alert('Unable to access camera. Please check permissions or enter food manually.');
        }
    }

    async initZXingScanner(video, canvas) {
        // Dynamically load ZXing library if not already loaded
        if (!window.ZXing) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@zxing/library@0.19.1/umd/index.min.js';
            script.onload = () => {
                this.startZXingScanning(video, canvas);
            };
            script.onerror = () => {
                alert('Failed to load barcode scanner library. Please enter food manually.');
                this.closeBarcodeScanner();
            };
            document.head.appendChild(script);
        } else {
            this.startZXingScanning(video, canvas);
        }
    }

    startZXingScanning(video, canvas) {
        const codeReader = new ZXing.BrowserMultiFormatReader();
        const ctx = canvas.getContext('2d');

        const scanFrame = async () => {
            if (!this.barcodeStream) return;

            try {
                // Set canvas size to match video
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw current video frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Try to decode barcode from canvas
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const result = await codeReader.decodeFromImageData(imageData);

                if (result) {
                    const barcode = result.text;
                    this.closeBarcodeScanner();
                    await this.lookupBarcode(barcode);
                    return;
                }
            } catch (err) {
                // No barcode found in this frame, continue scanning
            }

            // Continue scanning
            if (this.barcodeStream) {
                requestAnimationFrame(scanFrame);
            }
        };

        // Wait for video to be ready
        video.addEventListener('loadedmetadata', () => {
            scanFrame();
        });

        // Start immediately if video is already loaded
        if (video.readyState >= video.HAVE_METADATA) {
            scanFrame();
        }
    }

    closeBarcodeScanner() {
        if (this.barcodeStream) {
            this.barcodeStream.getTracks().forEach(track => track.stop());
            this.barcodeStream = null;
        }
        this.closeModal();
    }

    async lookupBarcode(barcode) {
        try {
            // Use Open Food Facts API to lookup barcode
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            const data = await response.json();

            if (data.status === 1 && data.product) {
                const product = data.product;

                // Extract nutrition per 100g
                const nutrients = product.nutriments || {};

                const foodData = {
                    foodName: product.product_name || 'Unknown Product',
                    dbFoodName: product.product_name || 'Unknown Product',
                    brandName: product.brands || '',
                    calories: nutrients['energy-kcal_100g'] || nutrients['energy_100g'] / 4.184 || 0,
                    protein: nutrients['proteins_100g'] || 0,
                    carbs: nutrients['carbohydrates_100g'] || 0,
                    fat: nutrients['fat_100g'] || 0,
                    servingSize: product.serving_size || 100,
                    servingUnit: 'g'
                };

                // Show confirmation modal with product info
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3>Scanned Product</h3>
                        <div class="modal-food-name">${foodData.foodName}</div>
                        ${foodData.brandName ? `<div class="result-brand">${foodData.brandName}</div>` : ''}
                        <div class="result-nutrition">
                            ${Math.round(foodData.calories)} cal •
                            P: ${Math.round(foodData.protein)}g •
                            C: ${Math.round(foodData.carbs)}g •
                            F: ${Math.round(foodData.fat)}g
                            (per 100g)
                        </div>
                        <div class="form-group" style="margin-top: 20px;">
                            <label>Quantity (grams)</label>
                            <input type="number" id="barcodeQuantity" value="100" min="1">
                        </div>
                        <div class="modal-buttons">
                            <button class="btn-cancel" onclick="app.closeModal()">Cancel</button>
                            <button class="btn-save" onclick="app.addScannedFood()">Add Food</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);

                // Store scanned food data temporarily
                this.scannedFoodData = foodData;

                // Focus quantity input
                setTimeout(() => document.getElementById('barcodeQuantity').focus(), 100);

            } else {
                alert('Product not found in database. Please enter manually.');
            }
        } catch (error) {
            console.error('Barcode lookup error:', error);
            alert('Error looking up product. Please enter manually.');
        }
    }

    addScannedFood() {
        const quantity = parseFloat(document.getElementById('barcodeQuantity').value) || 100;
        const food = this.scannedFoodData;

        // Calculate nutrition based on quantity
        const multiplier = quantity / 100;

        const nutritionData = {
            foodName: food.foodName,
            dbFoodName: food.foodName + (food.brandName ? ` (${food.brandName})` : ''),
            calories: Math.round(food.calories * multiplier),
            protein: Math.round(food.protein * multiplier * 10) / 10,
            carbs: Math.round(food.carbs * multiplier * 10) / 10,
            fat: Math.round(food.fat * multiplier * 10) / 10
        };

        this.addFoodEntry(nutritionData, quantity, 'g', food.foodName);
        this.closeModal();
        delete this.scannedFoodData;
    }

    // Food Entry
    async addFood() {
        const input = document.getElementById('foodInput');
        const text = input.value.trim();

        if (!text) return;

        const parsed = this.parseFood(text);

        // Always try external database first (USDA API)
        const searchResults = await this.searchFoodDatabase(parsed.name);

        if (searchResults && searchResults.length > 1) {
            // Show selection modal if multiple results
            this.showFoodSelectionModal(searchResults, parsed.quantity, parsed.unit, text);
        } else if (searchResults && searchResults.length === 1) {
            // Use the single result
            this.addFoodEntry(searchResults[0], parsed.quantity, parsed.unit, text);
        } else {
            // Only use local database as last resort fallback
            // This happens when API fails or no results found
            const nutrition = this.getNutrition(parsed.name, parsed.quantity, parsed.unit);
            this.addFoodEntry({
                foodName: parsed.name,
                dbFoodName: nutrition.dbFoodName + ' (local fallback)',
                ...nutrition
            }, parsed.quantity, parsed.unit, text);
        }

        input.value = '';
    }

    addFoodEntry(foodData, quantity, unit, rawInput) {
        const mealType = document.getElementById('mealTypeSelect').value;

        const entry = {
            id: Date.now(),
            date: this.currentDate,
            mealType: mealType,  // Add meal type
            rawInput: rawInput,
            foodName: foodData.foodName || foodData.dbFoodName,
            dbFoodName: foodData.dbFoodName,
            quantity: quantity,
            unit: unit,
            calories: foodData.calories,
            protein: foodData.protein,
            carbs: foodData.carbs,
            fat: foodData.fat,
            timestamp: new Date().toISOString()
        };

        // Add to data
        if (!this.data.foodEntries[this.currentDate]) {
            this.data.foodEntries[this.currentDate] = [];
        }
        this.data.foodEntries[this.currentDate].push(entry);

        this.saveData();
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

    async searchFoodDatabase(foodName) {
        try {
            // Get API key from localStorage or use DEMO_KEY
            // Users should set their own key via Settings to avoid rate limits
            const apiKey = localStorage.getItem('usdaApiKey') || 'DEMO_KEY';
            const query = encodeURIComponent(foodName);
            const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${query}&pageSize=10&api_key=${apiKey}`;

            const response = await fetch(url);
            if (!response.ok) {
                console.warn('API request failed, falling back to local database');
                return null;
            }

            const data = await response.json();

            if (!data.foods || data.foods.length === 0) {
                console.log('No foods found in USDA database for:', foodName);
                return null;
            }

            // Parse and return results
            return data.foods.map(food => {
                const nutrients = {};
                food.foodNutrients.forEach(nutrient => {
                    const name = nutrient.nutrientName.toLowerCase();
                    if (name.includes('energy') || name.includes('calorie')) {
                        nutrients.calories = nutrient.value;
                    } else if (name.includes('protein')) {
                        nutrients.protein = nutrient.value;
                    } else if (name.includes('carbohydrate')) {
                        nutrients.carbs = nutrient.value;
                    } else if (name.includes('total lipid') || name.includes('fat')) {
                        nutrients.fat = nutrient.value;
                    }
                });

                return {
                    foodName: food.description,
                    dbFoodName: food.description,
                    brandName: food.brandName || food.brandOwner || '',
                    calories: nutrients.calories || 0,
                    protein: nutrients.protein || 0,
                    carbs: nutrients.carbs || 0,
                    fat: nutrients.fat || 0,
                    servingSize: food.servingSize || 100,
                    servingUnit: food.servingSizeUnit || 'g'
                };
            });
        } catch (error) {
            console.warn('Error searching food database:', error);
            return null;
        }
    }

    showFoodSelectionModal(results, quantity, unit, rawInput) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content food-search-modal">
                <h3>Select Food</h3>
                <p class="search-query">Search: "${rawInput}"</p>
                <div class="food-results">
                    ${results.map((food, index) => `
                        <div class="food-result-item" onclick="app.selectFood(${index}, ${quantity}, '${unit}', '${rawInput.replace(/'/g, "\\'")}')">
                            <div class="result-name">${food.foodName}</div>
                            ${food.brandName ? `<div class="result-brand">${food.brandName}</div>` : ''}
                            <div class="result-nutrition">
                                ${Math.round(food.calories)} cal •
                                P: ${Math.round(food.protein)}g •
                                C: ${Math.round(food.carbs)}g •
                                F: ${Math.round(food.fat)}g
                                (per ${food.servingSize}${food.servingUnit})
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn-cancel" onclick="app.closeModal()">Cancel</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Store results temporarily for selection
        this.tempSearchResults = results;
    }

    selectFood(index, quantity, unit, rawInput) {
        const food = this.tempSearchResults[index];

        // Calculate nutrition based on quantity
        const servingSize = food.servingSize || 100;
        let multiplier = 1;

        if (unit === 'g') {
            multiplier = quantity / servingSize;
        } else if (unit === 'count') {
            // Assume count is serving size
            multiplier = quantity;
        }

        const nutritionData = {
            foodName: food.foodName,
            dbFoodName: food.foodName,
            calories: Math.round(food.calories * multiplier),
            protein: Math.round(food.protein * multiplier * 10) / 10,
            carbs: Math.round(food.carbs * multiplier * 10) / 10,
            fat: Math.round(food.fat * multiplier * 10) / 10
        };

        this.addFoodEntry(nutritionData, quantity, unit, rawInput);
        this.closeModal();
        delete this.tempSearchResults;
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
            'ground beef raw': { calories: 250, protein: 26, carbs: 0, fat: 17, per: 100 },
            'ground beef cooked': { calories: 273, protein: 28, carbs: 0, fat: 18, per: 100 },
            'ground beef 80/20': { calories: 254, protein: 25, carbs: 0, fat: 18, per: 100 },
            'ground beef 80/20 raw': { calories: 254, protein: 25, carbs: 0, fat: 18, per: 100 },
            'ground beef 80/20 cooked': { calories: 289, protein: 26, carbs: 0, fat: 21, per: 100 },
            'ground beef 85/15': { calories: 215, protein: 26, carbs: 0, fat: 13, per: 100 },
            'ground beef 85/15 raw': { calories: 215, protein: 26, carbs: 0, fat: 13, per: 100 },
            'ground beef 85/15 cooked': { calories: 243, protein: 28, carbs: 0, fat: 15, per: 100 },
            'ground beef 88/12': { calories: 197, protein: 26, carbs: 0, fat: 11, per: 100 },
            'ground beef 88/12 raw': { calories: 197, protein: 26, carbs: 0, fat: 11, per: 100 },
            'ground beef 88/12 cooked': { calories: 225, protein: 29, carbs: 0, fat: 12, per: 100 },
            'ground beef 90/10': { calories: 176, protein: 26, carbs: 0, fat: 10, per: 100 },
            'ground beef 90/10 raw': { calories: 176, protein: 26, carbs: 0, fat: 10, per: 100 },
            'ground beef 90/10 cooked': { calories: 197, protein: 29, carbs: 0, fat: 11, per: 100 },
            'ground beef 93/7': { calories: 152, protein: 27, carbs: 0, fat: 7, per: 100 },
            'ground beef 93/7 raw': { calories: 152, protein: 27, carbs: 0, fat: 7, per: 100 },
            'ground beef 93/7 cooked': { calories: 182, protein: 30, carbs: 0, fat: 8, per: 100 },
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

        // Normalize food name and handle special patterns (like "88/12")
        let normalizedName = foodName.toLowerCase().trim();

        // Handle lean percentage patterns (e.g., "ground beef 88/12" or "88/12 ground beef")
        const leanPattern = /(\d{2,3}\/\d{1,2})/;
        const leanMatch = normalizedName.match(leanPattern);
        if (leanMatch) {
            // Rearrange to standard format: "food name XX/XX"
            const leanPart = leanMatch[1];
            const baseName = normalizedName.replace(leanPattern, '').trim();
            normalizedName = `${baseName} ${leanPart}`.trim();
        }

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

    // Copy Meal Functionality
    showCopyMealModal() {
        // Get dates from last 7 days
        const dates = [];
        for (let i = 1; i <= 7; i++) {
            const date = new Date(this.currentDate);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            if (this.data.foodEntries[dateStr] && this.data.foodEntries[dateStr].length > 0) {
                dates.push({
                    date: dateStr,
                    display: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    entries: this.data.foodEntries[dateStr]
                });
            }
        }

        if (dates.length === 0) {
            alert('No previous meals found in the last 7 days');
            return;
        }

        // Group entries by meal type for each date
        const dateOptions = dates.map(d => {
            const mealGroups = {
                breakfast: d.entries.filter(e => e.mealType === 'breakfast'),
                lunch: d.entries.filter(e => e.mealType === 'lunch'),
                dinner: d.entries.filter(e => e.mealType === 'dinner'),
                snack: d.entries.filter(e => e.mealType === 'snack' || !e.mealType)
            };

            const mealLabels = {
                breakfast: '🍳 Breakfast',
                lunch: '🥗 Lunch',
                dinner: '🍽️ Dinner',
                snack: '🍎 Snacks'
            };

            let mealsHtml = '';
            for (const [mealType, meals] of Object.entries(mealGroups)) {
                if (meals.length > 0) {
                    const totalCals = meals.reduce((sum, e) => sum + e.calories, 0);
                    mealsHtml += `
                        <div class="copy-meal-option" onclick="app.copyMeal('${d.date}', '${mealType}')">
                            <div class="copy-meal-label">${mealLabels[mealType]}</div>
                            <div class="copy-meal-items">${meals.map(e => e.foodName).join(', ')}</div>
                            <div class="copy-meal-calories">${totalCals} cal</div>
                        </div>
                    `;
                }
            }

            return `
                <div class="copy-date-group">
                    <h4>${d.display}</h4>
                    ${mealsHtml}
                </div>
            `;
        }).join('');

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content copy-meal-modal">
                <h3>Copy Meal from Previous Day</h3>
                <p class="help-text">Select a meal to copy to today</p>
                <div class="copy-meal-list">
                    ${dateOptions}
                </div>
                <button class="btn-cancel" onclick="app.closeModal()">Cancel</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    copyMeal(fromDate, mealType) {
        const sourceEntries = this.data.foodEntries[fromDate].filter(e => e.mealType === mealType);

        if (sourceEntries.length === 0) return;

        // Create new entries for today
        sourceEntries.forEach(entry => {
            const newEntry = {
                ...entry,
                id: Date.now() + Math.random(),  // Unique ID
                date: this.currentDate,
                timestamp: new Date().toISOString()
            };

            if (!this.data.foodEntries[this.currentDate]) {
                this.data.foodEntries[this.currentDate] = [];
            }
            this.data.foodEntries[this.currentDate].push(newEntry);
        });

        this.saveData();
        this.closeModal();
        this.renderTodayView();

        const mealLabels = {
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            snack: 'Snacks'
        };

        alert(`${mealLabels[mealType]} copied successfully!`);
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

        // Hide weight section after logging
        this.updateWeightSectionVisibility();

        alert(`Weight logged: ${weight} lbs`);
    }

    updateWeightSectionVisibility() {
        const weightSection = document.querySelector('.weight-section');
        const today = new Date().toISOString().split('T')[0];

        if (this.currentDate === today && this.data.weightEntries[this.currentDate]) {
            // Hide if weight already logged for today
            weightSection.style.display = 'none';
        } else {
            // Show if viewing another day or no weight logged today
            weightSection.style.display = 'flex';
        }
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

        // Render food list grouped by meal type
        const foodList = document.getElementById('foodList');
        if (entries.length === 0) {
            foodList.innerHTML = '<div class="empty-state">No foods logged yet today</div>';
        } else {
            // Group by meal type
            const mealGroups = {
                breakfast: entries.filter(e => e.mealType === 'breakfast'),
                lunch: entries.filter(e => e.mealType === 'lunch'),
                dinner: entries.filter(e => e.mealType === 'dinner'),
                snack: entries.filter(e => e.mealType === 'snack' || !e.mealType)  // Default for old entries
            };

            const mealLabels = {
                breakfast: '🍳 Breakfast',
                lunch: '🥗 Lunch',
                dinner: '🍽️ Dinner',
                snack: '🍎 Snacks'
            };

            let html = '';
            for (const [mealType, mealEntries] of Object.entries(mealGroups)) {
                if (mealEntries.length > 0) {
                    const mealTotal = mealEntries.reduce((sum, e) => sum + e.calories, 0);
                    html += `
                        <div class="meal-group">
                            <div class="meal-header">
                                <h3>${mealLabels[mealType]}</h3>
                                <span class="meal-total">${mealTotal} cal</span>
                            </div>
                            ${mealEntries.map(entry => `
                                <div class="food-item">
                                    <div class="food-info">
                                        <div class="food-name">
                                            ${entry.foodName}
                                            ${entry.dbFoodName ? `<span class="db-match">(${entry.dbFoodName})</span>` : ''}
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
                            `).join('')}
                        </div>
                    `;
                }
            }
            foodList.innerHTML = html;
        }

        // Update weight section visibility
        this.updateWeightSectionVisibility();
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
        this.renderWeightChart();
        this.renderCalorieChart();
    }

    renderWeightChart() {
        const canvas = document.getElementById('weightChart');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get weight data for last 30 days
        const last30Days = this.getLast30Days();
        const weightData = last30Days.map(date => ({
            date,
            weight: this.data.weightEntries[date]?.weight || null
        })).filter(d => d.weight !== null);

        if (weightData.length === 0) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#8E8E93';
            ctx.fillText('No weight data yet', width / 2 - 60, height / 2);
            return;
        }

        // For single data point, add some padding to the range
        if (weightData.length === 1) {
            const singleWeight = weightData[0].weight;
            const minWeight = singleWeight - 2;
            const maxWeight = singleWeight + 2;
            const range = maxWeight - minWeight;

            // Chart dimensions
            const padding = 40;
            const chartWidth = width - padding * 2;
            const chartHeight = height - padding * 2;

            // Draw axes
            ctx.strokeStyle = '#C6C6C8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.stroke();

            // Draw single point
            const x = padding + chartWidth / 2;
            const y = height - padding - chartHeight / 2;

            ctx.fillStyle = '#007AFF';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Draw labels
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.fillText(`${Math.round(maxWeight)} lbs`, 5, padding + 5);
            ctx.fillText(`${Math.round(minWeight)} lbs`, 5, height - padding - 5);

            return;
        }

        // Calculate min/max for scaling
        const weights = weightData.map(d => d.weight);
        const minWeight = Math.min(...weights) - 2;
        const maxWeight = Math.max(...weights) + 2;
        const range = maxWeight - minWeight;

        // Chart dimensions
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Draw axes
        ctx.strokeStyle = '#C6C6C8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw line chart
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 2;
        ctx.beginPath();

        weightData.forEach((point, index) => {
            const x = padding + (chartWidth / (weightData.length - 1 || 1)) * index;
            const y = height - padding - ((point.weight - minWeight) / range) * chartHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        ctx.fillStyle = '#007AFF';
        weightData.forEach((point, index) => {
            const x = padding + (chartWidth / (weightData.length - 1 || 1)) * index;
            const y = height - padding - ((point.weight - minWeight) / range) * chartHeight;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw labels
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(`${Math.round(maxWeight)} lbs`, 5, padding + 5);
        ctx.fillText(`${Math.round(minWeight)} lbs`, 5, height - padding - 5);
    }

    renderCalorieChart() {
        const canvas = document.getElementById('calorieChart');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get calorie data for last 7 days
        const last7Days = this.getLast7Days();
        const calorieData = last7Days.map(date => {
            const entries = this.data.foodEntries[date] || [];
            const totalCals = entries.reduce((sum, e) => sum + e.calories, 0);
            return { date, calories: totalCals };
        });

        // Check if there's any data at all
        const hasData = calorieData.some(d => d.calories > 0);

        if (!hasData) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#8E8E93';
            ctx.fillText('No calorie data yet', width / 2 - 60, height / 2);
            return;
        }

        // Calculate max for scaling
        const maxCalories = Math.max(...calorieData.map(d => d.calories), this.settings.calorieGoal);

        // Chart dimensions
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const barWidth = chartWidth / 7 - 10;

        // Draw axes
        ctx.strokeStyle = '#C6C6C8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw goal line
        const goalY = height - padding - (this.settings.calorieGoal / maxCalories) * chartHeight;
        ctx.strokeStyle = '#FF3B30';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, goalY);
        ctx.lineTo(width - padding, goalY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw bars
        calorieData.forEach((point, index) => {
            const x = padding + index * (chartWidth / 7) + 5;
            const barHeight = (point.calories / maxCalories) * chartHeight;
            const y = height - padding - barHeight;

            ctx.fillStyle = point.calories > this.settings.calorieGoal ? '#FF9500' : '#34C759';
            ctx.fillRect(x, y, barWidth, barHeight);
        });

        // Draw labels
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        last7Days.forEach((date, index) => {
            const x = padding + index * (chartWidth / 7);
            const label = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            ctx.fillText(label, x, height - padding + 15);
        });
    }

    renderSettingsView() {
        document.getElementById('calorieGoalInput').value = this.settings.calorieGoal;
        document.getElementById('proteinGoalInput').value = this.settings.proteinGoal;
        document.getElementById('carbGoalInput').value = this.settings.carbGoal;
        document.getElementById('fatGoalInput').value = this.settings.fatGoal;

        // Dark mode
        document.getElementById('darkModeToggle').checked = this.settings.darkMode || false;

        // Goal type
        const goalType = this.settings.goalType || 'grams';
        document.getElementById('goalTypeSelect').value = goalType;
        this.toggleGoalInputs(goalType);

        // Percentage goals
        document.getElementById('proteinPercentInput').value = this.settings.proteinPercent || 30;
        document.getElementById('carbPercentInput').value = this.settings.carbPercent || 40;
        document.getElementById('fatPercentInput').value = this.settings.fatPercent || 30;

        // Load API key (show placeholder if using DEMO_KEY)
        const apiKey = localStorage.getItem('usdaApiKey');
        document.getElementById('apiKeyInput').value = apiKey || '';
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
        document.querySelector('.daily-summary').style.display = view === 'today' ? 'block' : 'none';
        document.querySelector('.food-log').style.display = view === 'today' ? 'block' : 'none';

        // Hide weight section when not on today view
        if (view !== 'today') {
            document.querySelector('.weight-section').style.display = 'none';
        }

        document.getElementById('trendsView').classList.toggle('hidden', view !== 'trends');
        document.getElementById('settingsView').classList.toggle('hidden', view !== 'settings');

        // Render appropriate view
        if (view === 'trends') {
            this.renderTrendsView();
        } else if (view === 'settings') {
            this.renderSettingsView();
        } else if (view === 'today') {
            // Update weight section visibility when switching to today view
            this.updateWeightSectionVisibility();
        }
    }

    // Settings
    updateSettings() {
        this.settings.calorieGoal = parseInt(document.getElementById('calorieGoalInput').value) || 2000;

        // Get goal type
        this.settings.goalType = document.getElementById('goalTypeSelect').value;

        if (this.settings.goalType === 'percentage') {
            // Save percentage goals
            this.settings.proteinPercent = parseFloat(document.getElementById('proteinPercentInput').value) || 30;
            this.settings.carbPercent = parseFloat(document.getElementById('carbPercentInput').value) || 40;
            this.settings.fatPercent = parseFloat(document.getElementById('fatPercentInput').value) || 30;

            // Calculate gram goals from percentages
            const caloriesFromProtein = (this.settings.calorieGoal * this.settings.proteinPercent / 100);
            const caloriesFromCarbs = (this.settings.calorieGoal * this.settings.carbPercent / 100);
            const caloriesFromFat = (this.settings.calorieGoal * this.settings.fatPercent / 100);

            this.settings.proteinGoal = Math.round(caloriesFromProtein / 4);  // 4 cal per g of protein
            this.settings.carbGoal = Math.round(caloriesFromCarbs / 4);  // 4 cal per g of carbs
            this.settings.fatGoal = Math.round(caloriesFromFat / 9);  // 9 cal per g of fat
        } else {
            // Use absolute gram goals
            this.settings.proteinGoal = parseInt(document.getElementById('proteinGoalInput').value) || 150;
            this.settings.carbGoal = parseInt(document.getElementById('carbGoalInput').value) || 200;
            this.settings.fatGoal = parseInt(document.getElementById('fatGoalInput').value) || 65;
        }

        this.saveSettings();

        // Save API key to localStorage (not in settings file for security)
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        if (apiKey) {
            localStorage.setItem('usdaApiKey', apiKey);
        } else {
            localStorage.removeItem('usdaApiKey');
        }

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

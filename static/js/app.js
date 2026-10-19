/**
 * app.js
 * Main Application Orchestrator for "Sales Dashboard Using Data Visualization"
 * Manages State, Global Filters, AI Analyst, Modals, File Upload & Share
 */

const App = {
    // Current Application State
    state: {
        filters: {
            start_date: '',
            end_date: '',
            category: 'All',
            product: 'All',
            location: 'All',
            region: 'All',
            min_sales: 0,
            min_profit_margin: -10,
            search: ''
        },
        trendMetric: 'combo',
        topProductsLimit: 5,
        topProductsSort: 'sales',
        activePreset: 'all',
        selectedUploadFile: null,
        theme: localStorage.getItem('dashboard_theme') || 'dark'
    },

    debounceTimer: null,

    async init() {
        this.applyTheme(this.state.theme);
        this.initLucide();
        this.bindGlobalEvents();
        DataTable.init();

        // Check if loading a shared snapshot from URL
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');

        try {
            await this.loadFilterOptions();

            if (shareId) {
                await this.loadSharedSnapshot(shareId);
            } else {
                await this.refreshAll();
            }
        } catch (err) {
            console.error('Initialization error:', err);
            this.showToast('Error loading initial dashboard data', 'error');
        }
    },

    initLucide() {
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.state.theme = theme;
        localStorage.setItem('dashboard_theme', theme);

        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
            this.initLucide();
        }

        // Re-render charts with new theme colors if data exists
        if (this.lastAnalyticsData) {
            Charts.renderMonthlyTrend(this.lastAnalyticsData.monthly_trend, this.state.trendMetric);
            Charts.renderCategoryShare(this.lastAnalyticsData.category_analysis);
            Charts.renderCategoryBar(this.lastAnalyticsData.category_analysis);
            Charts.renderTopProducts(this.lastAnalyticsData.top_products, this.state.topProductsSort);
            Charts.renderGeoMap(this.lastAnalyticsData.region_analysis);
        }
    },

    toggleTheme() {
        const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    },

    async loadFilterOptions() {
        const options = await API.getFilterOptions();
        
        // Populate Category Dropdown
        const catSelect = document.getElementById('filterCategory');
        if (catSelect) {
            catSelect.innerHTML = options.categories.map(c => `<option value="${c}">${c === 'All' ? 'All Categories' : c}</option>`).join('');
        }

        // Populate Location Dropdown
        const locSelect = document.getElementById('filterLocation');
        if (locSelect) {
            locSelect.innerHTML = options.locations.map(l => `<option value="${l}">${l === 'All' ? 'All Locations' : l}</option>`).join('');
        }

        // Populate Region Dropdown
        const regSelect = document.getElementById('filterRegion');
        if (regSelect) {
            regSelect.innerHTML = options.regions.map(r => `<option value="${r}">${r === 'All' ? 'All Regions' : r}</option>`).join('');
        }

        // Populate Product Dropdown
        const prodSelect = document.getElementById('filterProduct');
        if (prodSelect) {
            prodSelect.innerHTML = options.products.map(p => `<option value="${p}">${p === 'All' ? 'All Products' : p}</option>`).join('');
        }

        // Set Date limits
        const startInput = document.getElementById('filterStartDate');
        const endInput = document.getElementById('filterEndDate');
        if (startInput && endInput) {
            startInput.min = options.min_date;
            startInput.max = options.max_date;
            endInput.min = options.min_date;
            endInput.max = options.max_date;
        }

        // Set Min Sales limit
        const minSalesInput = document.getElementById('filterMinSales');
        if (minSalesInput) {
            minSalesInput.max = Math.ceil(options.max_sales || 1000);
        }
    },

    getActiveFilters() {
        const clean = {};
        for (const [k, v] of Object.entries(this.state.filters)) {
            if (v !== '' && v !== 'All' && v !== null && v !== undefined) {
                clean[k] = v;
            }
        }
        return clean;
    },

    async refreshAll() {
        const activeFilters = this.getActiveFilters();
        this.updateActiveChipsRibbon();

        try {
            const data = await API.getAnalytics(
                activeFilters,
                this.state.topProductsLimit,
                this.state.topProductsSort
            );
            this.lastAnalyticsData = data;

            // Render KPIs
            this.renderKPIs(data.kpis, data.total_records);

            // Render Automated Insights
            this.renderInsights(data.insights);

            // Render Charts
            Charts.renderMonthlyTrend(data.monthly_trend, this.state.trendMetric);
            Charts.renderCategoryShare(data.category_analysis);
            Charts.renderCategoryBar(data.category_analysis);
            Charts.renderTopProducts(data.top_products, this.state.topProductsSort);
            Charts.renderGeoMap(data.region_analysis);

            // Refresh Data Table
            DataTable.currentPage = 1;
            await DataTable.load();

            // Update badge count
            const badge = document.getElementById('activeFilterCountBadge');
            if (badge) {
                const count = Object.keys(activeFilters).length;
                badge.textContent = count > 0 ? `${count} Active Filter${count > 1 ? 's' : ''}` : 'All Data';
            }

            // Update DB Status indicator
            const dbCountText = document.getElementById('dbRecordCountText');
            if (dbCountText) {
                dbCountText.textContent = `Database: ${data.total_records} Records`;
            }

            this.initLucide();
        } catch (err) {
            console.error('Failed to refresh dashboard analytics:', err);
            this.showToast('Failed to refresh data', 'error');
        }
    },

    renderKPIs(kpis, totalRecords) {
        if (!kpis) return;

        // Total Sales
        const salesEl = document.getElementById('kpiTotalSales');
        if (salesEl) salesEl.textContent = `$${kpis.total_sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const salesGrowthEl = document.getElementById('kpiSalesGrowth');
        if (salesGrowthEl && kpis.growth) {
            const g = kpis.growth.sales_pct;
            salesGrowthEl.className = `kpi-delta ${g >= 0 ? 'delta-up' : 'delta-down'}`;
            salesGrowthEl.innerHTML = `<i data-lucide="${g >= 0 ? 'trending-up' : 'trending-down'}"></i> ${g >= 0 ? '+' : ''}${g}%`;
        }

        // Total Profit
        const profitEl = document.getElementById('kpiTotalProfit');
        if (profitEl) profitEl.textContent = `$${kpis.total_profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const profitGrowthEl = document.getElementById('kpiProfitGrowth');
        if (profitGrowthEl && kpis.growth) {
            const g = kpis.growth.profit_pct;
            profitGrowthEl.className = `kpi-delta ${g >= 0 ? 'delta-up' : 'delta-down'}`;
            profitGrowthEl.innerHTML = `<i data-lucide="${g >= 0 ? 'trending-up' : 'trending-down'}"></i> ${g >= 0 ? '+' : ''}${g}%`;
        }

        // Total Orders
        const ordersEl = document.getElementById('kpiTotalOrders');
        if (ordersEl) ordersEl.textContent = kpis.total_orders.toLocaleString();

        const ordersGrowthEl = document.getElementById('kpiOrdersGrowth');
        if (ordersGrowthEl && kpis.growth) {
            const g = kpis.growth.orders_pct;
            ordersGrowthEl.className = `kpi-delta ${g >= 0 ? 'delta-up' : 'delta-down'}`;
            ordersGrowthEl.innerHTML = `<i data-lucide="${g >= 0 ? 'trending-up' : 'trending-down'}"></i> ${g >= 0 ? '+' : ''}${g}%`;
        }

        // Total Customers
        const custEl = document.getElementById('kpiTotalCustomers');
        if (custEl) custEl.textContent = kpis.total_customers.toLocaleString();

        // Total Quantity
        const qtyEl = document.getElementById('kpiTotalQuantity');
        if (qtyEl) qtyEl.textContent = kpis.total_quantity.toLocaleString();

        const qtyGrowthEl = document.getElementById('kpiQtyGrowth');
        if (qtyGrowthEl && kpis.growth) {
            const g = kpis.growth.quantity_pct;
            qtyGrowthEl.className = `kpi-delta ${g >= 0 ? 'delta-up' : 'delta-down'}`;
            qtyGrowthEl.innerHTML = `<i data-lucide="${g >= 0 ? 'trending-up' : 'trending-down'}"></i> ${g >= 0 ? '+' : ''}${g}%`;
        }

        // Average Profit Margin
        const marginEl = document.getElementById('kpiProfitMargin');
        if (marginEl) marginEl.textContent = `${kpis.profit_margin}%`;

        const marginBadge = document.getElementById('kpiMarginHealthBadge');
        if (marginBadge) {
            const m = kpis.profit_margin;
            if (m >= 25) {
                marginBadge.className = 'kpi-badge badge-success';
                marginBadge.textContent = 'Healthy (>25%)';
            } else if (m >= 15) {
                marginBadge.className = 'kpi-badge badge-warning';
                marginBadge.textContent = 'Moderate (15-25%)';
            } else {
                marginBadge.className = 'kpi-badge badge-danger';
                marginBadge.textContent = 'Low Margin (<15%)';
            }
        }
    },

    renderInsights(insights) {
        const container = document.getElementById('insightsContainer');
        if (!container) return;

        if (!insights || insights.length === 0) {
            container.innerHTML = '<div class="insight-card"><p>No dynamic insights available.</p></div>';
            return;
        }

        const iconMap = {
            'trophy': { icon: 'trophy', color: 'icon-amber' },
            'dollar-sign': { icon: 'dollar-sign', color: 'icon-emerald' },
            'pie-chart': { icon: 'pie-chart', color: 'icon-indigo' },
            'alert-circle': { icon: 'alert-circle', color: 'icon-rose' },
            'map-pin': { icon: 'map-pin', color: 'icon-cyan' },
            'trending-up': { icon: 'trending-up', color: 'icon-violet' },
            'alert-triangle': { icon: 'alert-triangle', color: 'icon-rose' }
        };

        container.innerHTML = insights.map(item => {
            const iconConfig = iconMap[item.icon] || { icon: 'info', color: 'icon-cyan' };
            return `
                <div class="insight-card">
                    <div class="insight-icon ${iconConfig.color}">
                        <i data-lucide="${iconConfig.icon}"></i>
                    </div>
                    <div class="insight-content">
                        <h4>${item.title}</h4>
                        <p>${item.message}</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    updateActiveChipsRibbon() {
        const ribbon = document.getElementById('activeChipsRibbon');
        if (!ribbon) return;

        const chips = [];
        const f = this.state.filters;

        if (f.start_date || f.end_date) {
            chips.push({ key: 'date', label: `Date: ${f.start_date || 'Start'} to ${f.end_date || 'End'}` });
        }
        if (f.category && f.category !== 'All') {
            chips.push({ key: 'category', label: `Category: ${f.category}` });
        }
        if (f.product && f.product !== 'All') {
            chips.push({ key: 'product', label: `Product: ${f.product}` });
        }
        if (f.location && f.location !== 'All') {
            chips.push({ key: 'location', label: `City: ${f.location}` });
        }
        if (f.region && f.region !== 'All') {
            chips.push({ key: 'region', label: `Region: ${f.region}` });
        }
        if (f.min_sales > 0) {
            chips.push({ key: 'min_sales', label: `Min Sales: $${f.min_sales}` });
        }
        if (f.min_profit_margin > -10) {
            chips.push({ key: 'min_profit_margin', label: `Min Margin: ${f.min_profit_margin}%` });
        }
        if (f.search) {
            chips.push({ key: 'search', label: `Search: "${f.search}"` });
        }

        if (chips.length === 0) {
            ribbon.innerHTML = '<span style="color: var(--text-muted); font-size: 0.78rem;">Displaying complete sales dataset across all dimensions.</span>';
            return;
        }

        ribbon.innerHTML = chips.map(c => `
            <span class="filter-chip">
                ${c.label}
                <span class="filter-chip-remove" onclick="window.App.clearFilter('${c.key}')">
                    <i data-lucide="x" style="width: 12px; height: 12px;"></i>
                </span>
            </span>
        `).join('');

        this.initLucide();
    },

    clearFilter(key) {
        if (key === 'date') {
            this.state.filters.start_date = '';
            this.state.filters.end_date = '';
            document.getElementById('filterStartDate').value = '';
            document.getElementById('filterEndDate').value = '';
            this.setActivePreset('all');
        } else if (key === 'category') {
            this.state.filters.category = 'All';
            document.getElementById('filterCategory').value = 'All';
        } else if (key === 'product') {
            this.state.filters.product = 'All';
            document.getElementById('filterProduct').value = 'All';
        } else if (key === 'location') {
            this.state.filters.location = 'All';
            document.getElementById('filterLocation').value = 'All';
        } else if (key === 'region') {
            this.state.filters.region = 'All';
            document.getElementById('filterRegion').value = 'All';
        } else if (key === 'min_sales') {
            this.state.filters.min_sales = 0;
            document.getElementById('filterMinSales').value = 0;
            document.getElementById('filterMinSalesVal').textContent = '$0';
        } else if (key === 'min_profit_margin') {
            this.state.filters.min_profit_margin = -10;
            document.getElementById('filterMinMargin').value = -10;
            document.getElementById('filterMinMarginVal').textContent = 'Any';
        } else if (key === 'search') {
            this.state.filters.search = '';
            document.getElementById('filterSearchInput').value = '';
        }
        this.refreshAll();
    },

    resetAllFilters() {
        this.state.filters = {
            start_date: '',
            end_date: '',
            category: 'All',
            product: 'All',
            location: 'All',
            region: 'All',
            min_sales: 0,
            min_profit_margin: -10,
            search: ''
        };

        document.getElementById('filterStartDate').value = '';
        document.getElementById('filterEndDate').value = '';
        document.getElementById('filterCategory').value = 'All';
        document.getElementById('filterProduct').value = 'All';
        document.getElementById('filterLocation').value = 'All';
        document.getElementById('filterRegion').value = 'All';
        document.getElementById('filterMinSales').value = 0;
        document.getElementById('filterMinSalesVal').textContent = '$0';
        document.getElementById('filterMinMargin').value = -10;
        document.getElementById('filterMinMarginVal').textContent = 'Any';
        document.getElementById('filterSearchInput').value = '';

        this.setActivePreset('all');
        this.refreshAll();
        this.showToast('All filters have been reset to default', 'info');
    },

    applyCityFilter(city) {
        this.state.filters.location = city;
        const locSelect = document.getElementById('filterLocation');
        if (locSelect) locSelect.value = city;
        this.refreshAll();
        this.showToast(`Filtered dashboard to ${city}`, 'info');
    },

    applyRegionFilter(region) {
        this.state.filters.region = region;
        const regSelect = document.getElementById('filterRegion');
        if (regSelect) regSelect.value = region;
        this.refreshAll();
        this.showToast(`Filtered dashboard to ${region} region`, 'info');
    },

    setActivePreset(preset) {
        this.state.activePreset = preset;
        document.querySelectorAll('#datePresetsContainer .preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-preset') === preset);
        });

        const startInput = document.getElementById('filterStartDate');
        const endInput = document.getElementById('filterEndDate');

        if (preset === 'all') {
            this.state.filters.start_date = '';
            this.state.filters.end_date = '';
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';
        } else if (preset === '2024') {
            this.state.filters.start_date = '2024-01-01';
            this.state.filters.end_date = '2024-12-31';
            if (startInput) startInput.value = '2024-01-01';
            if (endInput) endInput.value = '2024-12-31';
        } else if (preset === '2023') {
            this.state.filters.start_date = '2023-01-01';
            this.state.filters.end_date = '2023-12-31';
            if (startInput) startInput.value = '2023-01-01';
            if (endInput) endInput.value = '2023-12-31';
        } else if (preset === 'q1_2024') {
            this.state.filters.start_date = '2024-01-01';
            this.state.filters.end_date = '2024-03-31';
            if (startInput) startInput.value = '2024-01-01';
            if (endInput) endInput.value = '2024-03-31';
        } else if (preset === 'q2_2024') {
            this.state.filters.start_date = '2024-04-01';
            this.state.filters.end_date = '2024-06-30';
            if (startInput) startInput.value = '2024-04-01';
            if (endInput) endInput.value = '2024-06-30';
        } else if (preset === 'last90') {
            const today = new Date('2024-06-30'); // Anchor to dataset upper bound
            const d90 = new Date(today);
            d90.setDate(d90.getDate() - 90);
            const sStr = d90.toISOString().split('T')[0];
            const eStr = today.toISOString().split('T')[0];
            this.state.filters.start_date = sStr;
            this.state.filters.end_date = eStr;
            if (startInput) startInput.value = sStr;
            if (endInput) endInput.value = eStr;
        }

        this.refreshAll();
    },

    bindGlobalEvents() {
        // Theme Toggle Button
        const btnTheme = document.getElementById('btnThemeToggle');
        if (btnTheme) btnTheme.addEventListener('click', () => this.toggleTheme());

        // Reset Filters Button
        const btnReset = document.getElementById('btnResetFilters');
        if (btnReset) btnReset.addEventListener('click', () => this.resetAllFilters());

        // Date Presets
        document.querySelectorAll('#datePresetsContainer .preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.getAttribute('data-preset');
                this.setActivePreset(preset);
            });
        });

        // Filter Controls
        const startInput = document.getElementById('filterStartDate');
        const endInput = document.getElementById('filterEndDate');
        const catSelect = document.getElementById('filterCategory');
        const prodSelect = document.getElementById('filterProduct');
        const locSelect = document.getElementById('filterLocation');
        const regSelect = document.getElementById('filterRegion');
        const minSalesInput = document.getElementById('filterMinSales');
        const minMarginInput = document.getElementById('filterMinMargin');
        const searchInput = document.getElementById('filterSearchInput');

        if (startInput) startInput.addEventListener('change', (e) => { this.state.filters.start_date = e.target.value; this.refreshAll(); });
        if (endInput) endInput.addEventListener('change', (e) => { this.state.filters.end_date = e.target.value; this.refreshAll(); });
        if (catSelect) catSelect.addEventListener('change', (e) => { this.state.filters.category = e.target.value; this.refreshAll(); });
        if (prodSelect) prodSelect.addEventListener('change', (e) => { this.state.filters.product = e.target.value; this.refreshAll(); });
        if (locSelect) locSelect.addEventListener('change', (e) => { this.state.filters.location = e.target.value; this.refreshAll(); });
        if (regSelect) regSelect.addEventListener('change', (e) => { this.state.filters.region = e.target.value; this.refreshAll(); });

        if (minSalesInput) {
            minSalesInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.state.filters.min_sales = val;
                document.getElementById('filterMinSalesVal').textContent = val > 0 ? `$${val}` : '$0';
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => this.refreshAll(), 250);
            });
        }

        if (minMarginInput) {
            minMarginInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                this.state.filters.min_profit_margin = val;
                document.getElementById('filterMinMarginVal').textContent = val > -10 ? `${val}%` : 'Any';
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => this.refreshAll(), 250);
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.state.filters.search = e.target.value;
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => this.refreshAll(), 300);
            });
        }

        // Monthly Trend Metric Toggle
        document.querySelectorAll('#trendMetricToggle .toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#trendMetricToggle .toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.trendMetric = btn.getAttribute('data-metric');
                if (this.lastAnalyticsData) {
                    Charts.renderMonthlyTrend(this.lastAnalyticsData.monthly_trend, this.state.trendMetric);
                }
            });
        });

        // Top Products Rank By
        const sortProdSelect = document.getElementById('topProductsSort');
        if (sortProdSelect) {
            sortProdSelect.addEventListener('change', (e) => {
                this.state.topProductsSort = e.target.value;
                this.refreshAll();
            });
        }

        // Top Products Limit Buttons
        document.querySelectorAll('.btn-group .toggle-btn-sm').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.btn-group .toggle-btn-sm').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.topProductsLimit = parseInt(btn.getAttribute('data-limit'), 10);
                this.refreshAll();
            });
        });

        // CSV Export
        const btnExport = document.getElementById('btnExportCSV');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                const active = this.getActiveFilters();
                const params = new URLSearchParams(active).toString();
                window.location.href = `/api/export-csv?${params}`;
                this.showToast('Downloading filtered CSV...', 'success');
            });
        }

        // Modal triggers
        this.bindModalEvents();
    },

    bindModalEvents() {
        // AI Modal
        const btnOpenAi = document.getElementById('btnOpenAiModal');
        const btnCloseAi = document.getElementById('btnCloseAiModal');
        const aiBackdrop = document.getElementById('aiModalBackdrop');
        const aiForm = document.getElementById('aiQueryForm');
        const aiInput = document.getElementById('aiQueryInput');

        if (btnOpenAi) btnOpenAi.addEventListener('click', () => aiBackdrop.classList.add('active'));
        if (btnCloseAi) btnCloseAi.addEventListener('click', () => aiBackdrop.classList.remove('active'));
        if (aiBackdrop) {
            aiBackdrop.addEventListener('click', (e) => {
                if (e.target === aiBackdrop) aiBackdrop.classList.remove('active');
            });
        }

        // AI quick prompt pills
        document.querySelectorAll('.ai-suggestions-bar .ai-pill-btn').forEach(pill => {
            pill.addEventListener('click', () => {
                const q = pill.getAttribute('data-query');
                this.submitAiQuery(q);
            });
        });

        if (aiForm) {
            aiForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const q = aiInput.value.trim();
                if (q) {
                    aiInput.value = '';
                    this.submitAiQuery(q);
                }
            });
        }

        // Upload Modal
        const btnOpenUpload = document.getElementById('btnOpenUploadModal');
        const btnCloseUpload = document.getElementById('btnCloseUploadModal');
        const btnCancelUpload = document.getElementById('btnCancelUpload');
        const uploadBackdrop = document.getElementById('uploadModalBackdrop');
        const dropzone = document.getElementById('uploadDropzone');
        const fileInput = document.getElementById('fileInput');
        const btnBrowseFile = document.getElementById('btnBrowseFile');
        const btnSubmitUpload = document.getElementById('btnSubmitUpload');
        const btnRestoreData = document.getElementById('btnRestoreDefaultData');

        if (btnOpenUpload) btnOpenUpload.addEventListener('click', () => uploadBackdrop.classList.add('active'));
        if (btnCloseUpload) btnCloseUpload.addEventListener('click', () => uploadBackdrop.classList.remove('active'));
        if (btnCancelUpload) btnCancelUpload.addEventListener('click', () => uploadBackdrop.classList.remove('active'));

        if (btnBrowseFile) btnBrowseFile.addEventListener('click', () => fileInput.click());

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileSelected(e.target.files[0]);
                }
            });
        }

        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
            dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    this.handleFileSelected(e.dataTransfer.files[0]);
                }
            });
        }

        if (btnSubmitUpload) {
            btnSubmitUpload.addEventListener('click', async () => {
                if (!this.state.selectedUploadFile) return;
                const mode = document.querySelector('input[name="uploadMode"]:checked').value;
                const formData = new FormData();
                formData.append('file', this.state.selectedUploadFile);
                formData.append('mode', mode);

                btnSubmitUpload.disabled = true;
                btnSubmitUpload.innerHTML = '<i data-lucide="loader"></i> Uploading...';
                this.initLucide();

                try {
                    const res = await API.uploadDataset(formData);
                    if (res.success) {
                        this.showToast(res.message, 'success');
                        uploadBackdrop.classList.remove('active');
                        await this.loadFilterOptions();
                        await this.refreshAll();
                    } else {
                        this.showToast(res.error || 'Upload failed', 'error');
                    }
                } catch (err) {
                    this.showToast('Upload failed: ' + err.message, 'error');
                } finally {
                    btnSubmitUpload.disabled = false;
                    btnSubmitUpload.innerHTML = '<i data-lucide="check"></i> Ingest & Update Dashboard';
                    this.initLucide();
                }
            });
        }

        if (btnRestoreData) {
            btnRestoreData.addEventListener('click', async () => {
                if (!confirm('Restore default 500 sales records? Any custom uploads will be replaced.')) return;
                try {
                    const res = await API.resetData();
                    if (res.success) {
                        this.showToast(res.message, 'success');
                        uploadBackdrop.classList.remove('active');
                        await this.loadFilterOptions();
                        await this.refreshAll();
                    }
                } catch (err) {
                    this.showToast('Reset failed', 'error');
                }
            });
        }

        // Share Modal
        const btnOpenShare = document.getElementById('btnOpenShareModal');
        const btnCloseShare = document.getElementById('btnCloseShareModal');
        const shareBackdrop = document.getElementById('shareModalBackdrop');
        const btnGenShare = document.getElementById('btnGenerateShareLink');
        const btnCopyUrl = document.getElementById('btnCopyShareUrl');
        const btnPrint = document.getElementById('btnPrintDashboard');

        if (btnOpenShare) btnOpenShare.addEventListener('click', () => shareBackdrop.classList.add('active'));
        if (btnCloseShare) btnCloseShare.addEventListener('click', () => shareBackdrop.classList.remove('active'));

        if (btnGenShare) {
            btnGenShare.addEventListener('click', async () => {
                const title = document.getElementById('shareSnapshotTitle').value.trim() || 'Sales Dashboard Snapshot';
                const notes = document.getElementById('shareSnapshotNotes').value.trim();
                const active = this.getActiveFilters();

                try {
                    const res = await API.saveShareSnapshot(active, title, notes);
                    if (res.success) {
                        const fullUrl = `${window.location.origin}${res.share_url}`;
                        const linkBox = document.getElementById('shareLinkBox');
                        const urlInput = document.getElementById('shareUrlInput');
                        linkBox.style.display = 'block';
                        urlInput.value = fullUrl;
                        this.showToast('Share link created successfully!', 'success');
                    }
                } catch (err) {
                    this.showToast('Failed to create snapshot link', 'error');
                }
            });
        }

        if (btnCopyUrl) {
            btnCopyUrl.addEventListener('click', () => {
                const urlInput = document.getElementById('shareUrlInput');
                urlInput.select();
                navigator.clipboard.writeText(urlInput.value);
                this.showToast('Permalink copied to clipboard!', 'success');
            });
        }

        if (btnPrint) {
            btnPrint.addEventListener('click', () => {
                window.print();
            });
        }

        // Add Order Modal
        const btnOpenAddOrder = document.getElementById('btnOpenAddOrderModal');
        const btnCloseAddOrder = document.getElementById('btnCloseAddOrderModal');
        const btnCancelAddOrder = document.getElementById('btnCancelAddOrder');
        const addOrderBackdrop = document.getElementById('addOrderModalBackdrop');
        const addOrderForm = document.getElementById('addOrderForm');

        if (btnOpenAddOrder) {
            btnOpenAddOrder.addEventListener('click', () => {
                // Set default order date to today
                const todayStr = new Date().toISOString().split('T')[0];
                document.getElementById('newOrderDate').value = todayStr;
                addOrderBackdrop.classList.add('active');
            });
        }
        if (btnCloseAddOrder) btnCloseAddOrder.addEventListener('click', () => addOrderBackdrop.classList.remove('active'));
        if (btnCancelAddOrder) btnCancelAddOrder.addEventListener('click', () => addOrderBackdrop.classList.remove('active'));

        if (addOrderForm) {
            addOrderForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const payload = {
                    product_name: document.getElementById('newProdName').value.trim(),
                    category: document.getElementById('newCategory').value,
                    sales_amount: parseFloat(document.getElementById('newSalesAmount').value),
                    profit: parseFloat(document.getElementById('newProfit').value),
                    quantity_sold: parseInt(document.getElementById('newQuantity').value, 10),
                    order_date: document.getElementById('newOrderDate').value,
                    customer_location: document.getElementById('newLocation').value
                };

                try {
                    const res = await API.addOrder(payload);
                    if (res.success) {
                        this.showToast(res.message, 'success');
                        addOrderBackdrop.classList.remove('active');
                        addOrderForm.reset();
                        await this.refreshAll();
                    } else {
                        this.showToast(res.error || 'Failed to add order', 'error');
                    }
                } catch (err) {
                    this.showToast('Error recording order', 'error');
                }
            });
        }
    },

    handleFileSelected(file) {
        this.state.selectedUploadFile = file;
        const info = document.getElementById('selectedFileInfo');
        const btnSubmit = document.getElementById('btnSubmitUpload');
        if (info) {
            info.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        }
        if (btnSubmit) {
            btnSubmit.disabled = false;
        }
    },

    async submitAiQuery(query) {
        const thread = document.getElementById('aiChatThread');
        if (!thread) return;

        // Append User Message
        const userMsg = document.createElement('div');
        userMsg.className = 'ai-message msg-user';
        userMsg.innerHTML = `<div class="msg-bubble"><p>${query}</p></div>`;
        thread.appendChild(userMsg);

        // Append Typing Assistant placeholder
        const assistantMsg = document.createElement('div');
        assistantMsg.className = 'ai-message msg-assistant';
        assistantMsg.innerHTML = `<div class="msg-bubble"><p><em>Analyzing real-time data...</em></p></div>`;
        thread.appendChild(assistantMsg);
        thread.scrollTop = thread.scrollHeight;

        try {
            const activeFilters = this.getActiveFilters();
            const res = await API.askAi(query, activeFilters);

            let metricsHtml = '';
            if (res.metrics && Object.keys(res.metrics).length > 0) {
                metricsHtml = `
                    <div class="ai-metric-box">
                        ${Object.entries(res.metrics).map(([k, v]) => `
                            <div class="ai-metric-item">
                                <span class="ai-metric-label">${k}</span>
                                <span class="ai-metric-val">${v}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            let recHtml = '';
            if (res.recommendation) {
                recHtml = `
                    <div class="ai-rec-box">
                        <strong>Strategic Recommendation:</strong> ${res.recommendation}
                    </div>
                `;
            }

            // Convert simple markdown **bold** to <strong>
            let formattedAnswer = res.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            assistantMsg.innerHTML = `
                <div class="msg-bubble">
                    <p>${formattedAnswer}</p>
                    ${metricsHtml}
                    ${recHtml}
                </div>
            `;
            thread.scrollTop = thread.scrollHeight;
        } catch (err) {
            assistantMsg.innerHTML = `<div class="msg-bubble"><p style="color: var(--accent-rose);">Failed to consult AI analyst. Please try again.</p></div>`;
        }
    },

    async loadSharedSnapshot(shareId) {
        try {
            const snapshot = await API.getShareSnapshot(shareId);
            if (snapshot.success && snapshot.filters) {
                this.state.filters = { ...this.state.filters, ...snapshot.filters };

                // Populate UI inputs
                if (snapshot.filters.start_date) document.getElementById('filterStartDate').value = snapshot.filters.start_date;
                if (snapshot.filters.end_date) document.getElementById('filterEndDate').value = snapshot.filters.end_date;
                if (snapshot.filters.category) document.getElementById('filterCategory').value = snapshot.filters.category;
                if (snapshot.filters.product) document.getElementById('filterProduct').value = snapshot.filters.product;
                if (snapshot.filters.location) document.getElementById('filterLocation').value = snapshot.filters.location;
                if (snapshot.filters.region) document.getElementById('filterRegion').value = snapshot.filters.region;
                if (snapshot.filters.min_sales) {
                    document.getElementById('filterMinSales').value = snapshot.filters.min_sales;
                    document.getElementById('filterMinSalesVal').textContent = `$${snapshot.filters.min_sales}`;
                }
                if (snapshot.filters.search) document.getElementById('filterSearchInput').value = snapshot.filters.search;

                await this.refreshAll();
                this.showToast(`Loaded Shared Snapshot: "${snapshot.title}"`, 'success');
            }
        } catch (err) {
            this.showToast('Could not load shared snapshot', 'error');
            await this.refreshAll();
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-triangle';

        toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        this.initLucide();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

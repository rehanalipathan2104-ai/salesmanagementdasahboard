/**
 * charts.js
 * Plotly & Leaflet Chart Visualizations with Dark/Light Mode Adaptability
 */

const Charts = {
    leafletMap: null,
    markersGroup: null,

    getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return {
            isDark,
            fontColor: isDark ? '#f8fafc' : '#0f172a',
            gridColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
            bgPaper: 'rgba(0,0,0,0)',
            bgPlot: 'rgba(0,0,0,0)',
            fontFamily: "'Plus Jakarta Sans', sans-serif"
        };
    },

    // 1. Monthly Sales & Profit Trend Chart
    renderMonthlyTrend(trendData, metricMode = 'combo') {
        const dom = document.getElementById('chartMonthlyTrend');
        if (!dom) return;

        if (!trendData || !trendData.months || trendData.months.length === 0) {
            Plotly.purge(dom);
            dom.innerHTML = '<div class="empty-state">No trend records found for current filters</div>';
            return;
        }

        const theme = this.getThemeColors();
        const traces = [];

        if (metricMode === 'combo' || metricMode === 'sales') {
            traces.push({
                x: trendData.months,
                y: trendData.sales,
                name: 'Sales ($)',
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#06b6d4', width: 3, shape: 'spline' },
                marker: { size: 6, color: '#06b6d4', line: { color: '#ffffff', width: 1.5 } },
                fill: 'tozeroy',
                fillcolor: theme.isDark ? 'rgba(6, 182, 212, 0.08)' : 'rgba(6, 182, 212, 0.12)',
                hovertemplate: '<b>%{x}</b><br>Sales: <b>$%{y:,.2f}</b><extra></extra>'
            });
        }

        if (metricMode === 'combo' || metricMode === 'profit') {
            traces.push({
                x: trendData.months,
                y: trendData.profit,
                name: 'Profit ($)',
                type: 'scatter',
                mode: 'lines+markers',
                line: { color: '#10b981', width: 3, shape: 'spline', dash: 'solid' },
                marker: { size: 6, color: '#10b981', line: { color: '#ffffff', width: 1.5 } },
                hovertemplate: '<b>%{x}</b><br>Profit: <b>$%{y:,.2f}</b><extra></extra>'
            });
        }

        if (metricMode === 'orders') {
            traces.push({
                x: trendData.months,
                y: trendData.orders,
                name: 'Total Orders',
                type: 'bar',
                marker: {
                    color: '#8b5cf6',
                    opacity: 0.85,
                    line: { color: '#a78bfa', width: 1 }
                },
                hovertemplate: '<b>%{x}</b><br>Orders: <b>%{y}</b><extra></extra>'
            });
        }

        const layout = {
            autosize: true,
            margin: { l: 55, r: 25, t: 20, b: 45 },
            paper_bgcolor: theme.bgPaper,
            plot_bgcolor: theme.bgPlot,
            font: { family: theme.fontFamily, color: theme.fontColor, size: 12 },
            showlegend: traces.length > 1,
            legend: { orientation: 'h', y: 1.12, x: 0.5, xanchor: 'center' },
            hovermode: 'x unified',
            xaxis: {
                showgrid: true,
                gridcolor: theme.gridColor,
                linecolor: theme.gridColor,
                tickfont: { size: 11, color: theme.fontColor }
            },
            yaxis: {
                showgrid: true,
                gridcolor: theme.gridColor,
                linecolor: theme.gridColor,
                tickprefix: metricMode === 'orders' ? '' : '$',
                tickfont: { size: 11, color: theme.fontColor },
                separatethousands: true
            }
        };

        const config = { responsive: true, displayModeBar: false };
        Plotly.newPlot(dom, traces, layout, config);
    },

    // 2. Category Share Donut Chart
    renderCategoryShare(catData) {
        const dom = document.getElementById('chartCategoryShare');
        if (!dom) return;

        if (!catData || !catData.categories || catData.categories.length === 0) {
            Plotly.purge(dom);
            dom.innerHTML = '<div class="empty-state">No category records</div>';
            return;
        }

        const theme = this.getThemeColors();
        const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

        const trace = {
            labels: catData.categories,
            values: catData.sales,
            type: 'pie',
            hole: 0.62,
            marker: {
                colors: colors.slice(0, catData.categories.length),
                line: { color: theme.isDark ? '#0f172a' : '#ffffff', width: 2 }
            },
            textinfo: 'label+percent',
            textposition: 'outside',
            automargin: true,
            hovertemplate: '<b>%{label}</b><br>Sales: <b>$%{value:,.2f}</b><br>Share: <b>%{percent}</b><extra></extra>'
        };

        const layout = {
            autosize: true,
            margin: { l: 20, r: 20, t: 20, b: 20 },
            paper_bgcolor: theme.bgPaper,
            plot_bgcolor: theme.bgPlot,
            font: { family: theme.fontFamily, color: theme.fontColor, size: 11 },
            showlegend: false,
            annotations: [{
                font: { family: theme.fontFamily, size: 14, color: theme.fontColor, weight: 700 },
                showarrow: false,
                text: 'Category<br>Sales',
                x: 0.5,
                y: 0.5
            }]
        };

        const config = { responsive: true, displayModeBar: false };
        Plotly.newPlot(dom, [trace], layout, config);
    },

    // 3. Sales & Profit by Category Bar Chart
    renderCategoryBar(catData) {
        const dom = document.getElementById('chartCategoryBar');
        if (!dom) return;

        if (!catData || !catData.categories || catData.categories.length === 0) {
            Plotly.purge(dom);
            dom.innerHTML = '<div class="empty-state">No category data</div>';
            return;
        }

        const theme = this.getThemeColors();

        const traceSales = {
            x: catData.categories,
            y: catData.sales,
            name: 'Sales ($)',
            type: 'bar',
            marker: { color: '#6366f1', borderRadius: 4 },
            hovertemplate: '<b>%{x}</b><br>Sales: <b>$%{y:,.2f}</b><extra></extra>'
        };

        const traceProfit = {
            x: catData.categories,
            y: catData.profit,
            name: 'Profit ($)',
            type: 'bar',
            marker: { color: '#10b981', borderRadius: 4 },
            hovertemplate: '<b>%{x}</b><br>Profit: <b>$%{y:,.2f}</b><extra></extra>'
        };

        const layout = {
            barmode: 'group',
            autosize: true,
            margin: { l: 55, r: 20, t: 20, b: 45 },
            paper_bgcolor: theme.bgPaper,
            plot_bgcolor: theme.bgPlot,
            font: { family: theme.fontFamily, color: theme.fontColor, size: 12 },
            showlegend: true,
            legend: { orientation: 'h', y: 1.12, x: 0.5, xanchor: 'center' },
            xaxis: {
                showgrid: false,
                linecolor: theme.gridColor,
                tickfont: { size: 11, color: theme.fontColor }
            },
            yaxis: {
                showgrid: true,
                gridcolor: theme.gridColor,
                linecolor: theme.gridColor,
                tickprefix: '$',
                tickfont: { size: 11, color: theme.fontColor },
                separatethousands: true
            }
        };

        const config = { responsive: true, displayModeBar: false };
        Plotly.newPlot(dom, [traceSales, traceProfit], layout, config);
    },

    // 4. Top Products Horizontal Bar Chart
    renderTopProducts(products, sortBy = 'sales') {
        const dom = document.getElementById('chartTopProducts');
        if (!dom) return;

        if (!products || products.length === 0) {
            Plotly.purge(dom);
            dom.innerHTML = '<div class="empty-state">No products match current filters</div>';
            return;
        }

        const theme = this.getThemeColors();

        // Sort ascending for horizontal bar (highest on top)
        const sorted = [...products].reverse();
        const names = sorted.map(p => p.product_name);
        
        let vals = [];
        let hoverText = [];
        let prefix = '$';
        let barColor = '#6366f1';

        if (sortBy === 'sales') {
            vals = sorted.map(p => p.sales);
            hoverText = sorted.map(p => `Revenue: <b>$${p.sales.toLocaleString()}</b><br>Profit: $${p.profit.toLocaleString()} (${p.margin}%)<br>Qty: ${p.quantity}`);
            barColor = '#6366f1';
        } else if (sortBy === 'profit') {
            vals = sorted.map(p => p.profit);
            hoverText = sorted.map(p => `Profit: <b>$${p.profit.toLocaleString()}</b><br>Margin: ${p.margin}%<br>Sales: $${p.sales.toLocaleString()}`);
            barColor = '#10b981';
        } else if (sortBy === 'quantity') {
            vals = sorted.map(p => p.quantity);
            prefix = '';
            hoverText = sorted.map(p => `Quantity Sold: <b>${p.quantity} units</b><br>Sales: $${p.sales.toLocaleString()}`);
            barColor = '#06b6d4';
        } else if (sortBy === 'margin') {
            vals = sorted.map(p => p.margin);
            prefix = '';
            hoverText = sorted.map(p => `Profit Margin: <b>${p.margin}%</b><br>Sales: $${p.sales.toLocaleString()}<br>Profit: $${p.profit.toLocaleString()}`);
            barColor = '#f59e0b';
        }

        const trace = {
            x: vals,
            y: names,
            type: 'bar',
            orientation: 'h',
            marker: {
                color: barColor,
                opacity: 0.9,
                line: { color: barColor, width: 1 }
            },
            hoverinfo: 'text',
            text: hoverText
        };

        const layout = {
            autosize: true,
            margin: { l: 180, r: 35, t: 15, b: 40 },
            paper_bgcolor: theme.bgPaper,
            plot_bgcolor: theme.bgPlot,
            font: { family: theme.fontFamily, color: theme.fontColor, size: 11 },
            xaxis: {
                showgrid: true,
                gridcolor: theme.gridColor,
                linecolor: theme.gridColor,
                tickprefix: prefix,
                ticksuffix: sortBy === 'margin' ? '%' : '',
                separatethousands: true,
                tickfont: { size: 10, color: theme.fontColor }
            },
            yaxis: {
                automargin: true,
                showgrid: false,
                linecolor: theme.gridColor,
                tickfont: { size: 11, color: theme.fontColor }
            }
        };

        const config = { responsive: true, displayModeBar: false };
        Plotly.newPlot(dom, [trace], layout, config);
    },

    // 5. Geographic Map (Leaflet)
    renderGeoMap(regionData, onCitySelectCallback) {
        const mapDom = document.getElementById('geoMap');
        if (!mapDom) return;

        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

        if (!this.leafletMap) {
            // US Geographic Center
            this.leafletMap = L.map('geoMap', {
                center: [39.5, -98.35],
                zoom: 4,
                zoomControl: true,
                scrollWheelZoom: false
            });

            // Dark Matter or Positron Tiles
            const tileUrl = isDark
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

            this.tileLayer = L.tileLayer(tileUrl, {
                attribution: '&copy; CartoDB &copy; OpenStreetMap',
                maxZoom: 18
            }).addTo(this.leafletMap);

            this.markersGroup = L.layerGroup().addTo(this.leafletMap);
        } else {
            // Update tile layer theme if changed
            const tileUrl = isDark
                ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
            this.tileLayer.setUrl(tileUrl);
            this.markersGroup.clearLayers();
        }

        const cities = regionData.cities || [];
        if (cities.length === 0) return;

        const maxSales = Math.max(...cities.map(c => c.sales), 1);

        cities.forEach(city => {
            if (!city.lat || !city.lon) return;

            // Radius scaled proportionally to sales (between 8 and 24px)
            const radius = Math.max(8, Math.min(26, (city.sales / maxSales) * 26));
            const isHighMargin = city.margin >= 25;
            const markerColor = isHighMargin ? '#10b981' : '#06b6d4';

            const circle = L.circleMarker([city.lat, city.lon], {
                radius: radius,
                fillColor: markerColor,
                color: '#ffffff',
                weight: 1.5,
                opacity: 0.9,
                fillOpacity: 0.75
            });

            const popupContent = `
                <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; min-width: 150px;">
                    <strong style="font-size: 14px; color: ${markerColor};">${city.city}, ${city.state}</strong>
                    <div style="margin-top: 5px; color: #475569;">Region: <b>${city.region}</b></div>
                    <div style="color: #475569;">Sales: <b>$${city.sales.toLocaleString()}</b></div>
                    <div style="color: #475569;">Profit: <b>$${city.profit.toLocaleString()}</b></div>
                    <div style="color: #475569;">Margin: <b style="color: ${isHighMargin ? '#10b981' : '#f43f5e'};">${city.margin}%</b></div>
                    <div style="color: #475569;">Orders: <b>${city.orders}</b></div>
                    <button class="btn btn-sm btn-primary" style="margin-top: 8px; width: 100%;" onclick="window.App.applyCityFilter('${city.city}')">
                        Filter by ${city.city}
                    </button>
                </div>
            `;

            circle.bindPopup(popupContent);
            this.markersGroup.addLayer(circle);
        });

        // Update regional summary pills overlay
        const overlay = document.getElementById('regionStatsOverlay');
        if (overlay && regionData.regions) {
            overlay.innerHTML = regionData.regions.map(r => `
                <div class="region-pill" onclick="window.App.applyRegionFilter('${r.region}')">
                    <strong>${r.region}</strong>: $${r.sales.toLocaleString()} (${r.margin}% margin)
                </div>
            `).join('');
        }
    }
};

window.Charts = Charts;

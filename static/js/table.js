/**
 * table.js
 * Sortable, Paginated, Searchable Data Table Component
 */

const DataTable = {
    currentPage: 1,
    pageSize: 10,
    sortCol: 'Order ID',
    sortDir: 'desc',
    totalRecords: 0,
    totalPages: 1,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Table Header Sorting
        const ths = document.querySelectorAll('#salesDataTable th.sortable');
        ths.forEach(th => {
            th.addEventListener('click', () => {
                const col = th.getAttribute('data-sort');
                if (this.sortCol === col) {
                    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortCol = col;
                    this.sortDir = 'desc';
                }
                this.updateHeaderIcons();
                this.load();
            });
        });

        // Page Size Selector
        const pageSizeSelect = document.getElementById('tablePageSize');
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', (e) => {
                this.pageSize = parseInt(e.target.value, 10);
                this.currentPage = 1;
                this.load();
            });
        }

        // Pagination Buttons
        const btnFirst = document.getElementById('btnFirstPage');
        const btnPrev = document.getElementById('btnPrevPage');
        const btnNext = document.getElementById('btnNextPage');
        const btnLast = document.getElementById('btnLastPage');

        if (btnFirst) btnFirst.addEventListener('click', () => { if (this.currentPage > 1) { this.currentPage = 1; this.load(); } });
        if (btnPrev) btnPrev.addEventListener('click', () => { if (this.currentPage > 1) { this.currentPage--; this.load(); } });
        if (btnNext) btnNext.addEventListener('click', () => { if (this.currentPage < this.totalPages) { this.currentPage++; this.load(); } });
        if (btnLast) btnLast.addEventListener('click', () => { if (this.currentPage < this.totalPages) { this.currentPage = this.totalPages; this.load(); } });
    },

    updateHeaderIcons() {
        const ths = document.querySelectorAll('#salesDataTable th.sortable');
        ths.forEach(th => {
            const col = th.getAttribute('data-sort');
            const icon = th.querySelector('i');
            if (icon) {
                if (col === this.sortCol) {
                    icon.setAttribute('data-lucide', this.sortDir === 'asc' ? 'arrow-up' : 'arrow-down');
                } else {
                    icon.setAttribute('data-lucide', 'arrow-up-down');
                }
            }
        });
        if (window.lucide) lucide.createIcons();
    },

    async load() {
        const filters = window.App ? window.App.getActiveFilters() : {};
        try {
            const data = await API.getTableData(
                filters,
                this.currentPage,
                this.pageSize,
                this.sortCol,
                this.sortDir
            );

            this.totalRecords = data.total_records;
            this.totalPages = data.total_pages || 1;
            this.currentPage = data.page;

            this.renderRows(data.records);
            this.renderPagination();
        } catch (err) {
            console.error('Failed to load table records:', err);
        }
    },

    renderRows(records) {
        const tbody = document.getElementById('salesTableBody');
        const badgeTotal = document.getElementById('tableRecordCountBadge');
        if (badgeTotal) badgeTotal.textContent = `${this.totalRecords.toLocaleString()} Records`;

        if (!tbody) return;

        if (!records || records.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                        No sales transactions found matching active filters.
                    </td>
                </tr>
            `;
            return;
        }

        const categoryColors = {
            'Electronics': 'background: rgba(99, 102, 241, 0.15); color: #818cf8;',
            'Furniture': 'background: rgba(245, 158, 11, 0.15); color: #fbbf24;',
            'Appliances': 'background: rgba(6, 182, 212, 0.15); color: #22d3ee;',
            'Clothing': 'background: rgba(16, 185, 129, 0.15); color: #34d399;',
            'Beauty': 'background: rgba(236, 72, 153, 0.15); color: #f472b6;'
        };

        tbody.innerHTML = records.map(r => {
            const isProfitPos = r.profit >= 0;
            const profitColor = isProfitPos ? 'var(--accent-emerald)' : 'var(--accent-rose)';
            const profitSign = isProfitPos ? '+' : '';
            const catStyle = categoryColors[r.category] || 'background: rgba(255,255,255,0.1); color: var(--text-primary);';

            return `
                <tr>
                    <td style="font-family: var(--font-mono); font-weight: 600;">#${r.order_id}</td>
                    <td style="font-weight: 600;">${r.product_name}</td>
                    <td><span class="cell-badge" style="${catStyle}">${r.category}</span></td>
                    <td class="text-right" style="font-family: var(--font-mono); font-weight: 600;">$${r.sales_amount.toFixed(2)}</td>
                    <td class="text-right" style="font-family: var(--font-mono); font-weight: 600; color: ${profitColor};">
                        ${profitSign}$${r.profit.toFixed(2)}
                    </td>
                    <td class="text-right">
                        <span class="cell-badge ${r.profit_margin >= 25 ? 'badge-success' : (r.profit_margin >= 0 ? 'badge-warning' : 'badge-danger')}">
                            ${r.profit_margin}%
                        </span>
                    </td>
                    <td class="text-center" style="font-weight: 600;">${r.quantity_sold}</td>
                    <td style="font-family: var(--font-mono); color: var(--text-secondary);">${r.order_date}</td>
                    <td>
                        <span style="display: inline-flex; align-items: center; gap: 0.3rem;">
                            <i data-lucide="map-pin" style="width: 12px; height: 12px; color: var(--text-muted);"></i>
                            ${r.customer_location}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    },

    renderPagination() {
        const info = document.getElementById('paginationInfo');
        const indicator = document.getElementById('pageIndicator');
        const btnFirst = document.getElementById('btnFirstPage');
        const btnPrev = document.getElementById('btnPrevPage');
        const btnNext = document.getElementById('btnNextPage');
        const btnLast = document.getElementById('btnLastPage');

        if (this.totalRecords === 0) {
            if (info) info.textContent = 'Showing 0 records';
            if (indicator) indicator.textContent = 'Page 0 of 0';
            if (btnFirst) btnFirst.disabled = true;
            if (btnPrev) btnPrev.disabled = true;
            if (btnNext) btnNext.disabled = true;
            if (btnLast) btnLast.disabled = true;
            return;
        }

        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.totalRecords);

        if (info) info.textContent = `Showing ${start} to ${end} of ${this.totalRecords.toLocaleString()} records`;
        if (indicator) indicator.textContent = `Page ${this.currentPage} of ${this.totalPages}`;

        if (btnFirst) btnFirst.disabled = this.currentPage <= 1;
        if (btnPrev) btnPrev.disabled = this.currentPage <= 1;
        if (btnNext) btnNext.disabled = this.currentPage >= this.totalPages;
        if (btnLast) btnLast.disabled = this.currentPage >= this.totalPages;
    }
};

window.DataTable = DataTable;

/**
 * api.js
 * API Client Layer for communicating with Flask Backend Endpoints
 */

const API = {
    async getFilterOptions() {
        const res = await fetch('/api/filter-options');
        if (!res.ok) throw new Error('Failed to load filter options');
        return await res.json();
    },

    async getAnalytics(filters = {}, topLimit = 10, sortProductsBy = 'sales') {
        const res = await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filters, top_limit: topLimit, sort_products_by: sortProductsBy })
        });
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return await res.json();
    },

    async getTableData(filters = {}, page = 1, pageSize = 10, sortCol = 'Order ID', sortDir = 'desc') {
        const res = await fetch('/api/table', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filters,
                page,
                page_size: pageSize,
                sort_col: sortCol,
                sort_dir: sortDir
            })
        });
        if (!res.ok) throw new Error('Failed to fetch table records');
        return await res.json();
    },

    async askAi(query, filters = {}) {
        const res = await fetch('/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, filters })
        });
        if (!res.ok) throw new Error('AI Query failed');
        return await res.json();
    },

    async uploadDataset(formData) {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        return await res.json();
    },

    async resetData() {
        const res = await fetch('/api/reset-data', { method: 'POST' });
        return await res.json();
    },

    async addOrder(orderData) {
        const res = await fetch('/api/orders/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        return await res.json();
    },

    async saveShareSnapshot(filters, title, notes) {
        const res = await fetch('/api/share/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filters, title, notes })
        });
        return await res.json();
    },

    async getShareSnapshot(shareId) {
        const res = await fetch(`/api/share/${shareId}`);
        if (!res.ok) throw new Error('Snapshot not found');
        return await res.json();
    }
};

window.API = API;

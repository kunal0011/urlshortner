'use strict';

const axios = require('axios');

/**
 * URLShortenerClient – official Node.js SDK for the URL Shortener API.
 *
 * @example
 * const { URLShortenerClient } = require('@urlshortner/sdk');
 * const client = new URLShortenerClient({ baseUrl: 'https://api.urlshortner.example.com', apiKey: 'your-key' });
 *
 * const link = await client.links.create({ long_url: 'https://example.com' });
 * console.log(link.short_url);
 */
class URLShortenerClient {
    constructor({ baseUrl = 'http://localhost:8081', apiKey = '', jwtToken = '' } = {}) {
        this._http = axios.create({
            baseURL: `${baseUrl}/api/v1`,
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { 'X-API-Key': apiKey } : {}),
                ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}),
            },
        });

        this.links = {
            /**
             * Create a short URL.
             * @param {{ long_url: string, alias?: string, expires_at?: string, org_id?: string }} opts
             */
            create: (opts) => this._http.post('/links', opts).then(r => r.data),

            /**
             * List short URLs for an org.
             * @param {{ org_id?: string, page?: number, page_size?: number }} opts
             */
            list: (opts = {}) => this._http.get('/links', { params: opts }).then(r => r.data),

            /**
             * Bulk create (up to 500) short URLs.
             * @param {Array<{ long_url: string }>} items
             */
            bulkCreate: (items) => this._http.post('/links/bulk', items).then(r => r.data),

            /**
             * Soft-delete a link.
             * @param {string} id
             */
            delete: (id) => this._http.delete(`/links/${id}`).then(r => r.data),

            /**
             * Generate a QR code for a short code.
             * @param {string} shortCode
             */
            generateQR: (shortCode) => this._http.post(`/links/${shortCode}/qr`).then(r => r.data),
        };

        this.analytics = {
            /**
             * Get aggregate analytics summary for a short code.
             * @param {string} shortCode
             */
            summary: (shortCode) => this._http.get(`/analytics/${shortCode}/summary`).then(r => r.data),

            /**
             * Get click timeseries for a short code.
             * @param {string} shortCode
             * @param {{ granularity?: 'hour'|'day', from?: string, to?: string }} opts
             */
            timeseries: (shortCode, opts = {}) =>
                this._http.get(`/analytics/${shortCode}/timeseries`, { params: opts }).then(r => r.data),
        };

        this.orgs = {
            create: (opts) => this._http.post('/orgs', opts).then(r => r.data),
            get: (id) => this._http.get(`/orgs/${id}`).then(r => r.data),
            list: (opts = {}) => this._http.get('/orgs', { params: opts }).then(r => r.data),
            delete: (id) => this._http.delete(`/orgs/${id}`).then(r => r.data),
            members: (id) => this._http.get(`/orgs/${id}/members`).then(r => r.data),
        };

        this.users = {
            create: (opts) => this._http.post('/users', opts).then(r => r.data),
            get: (id) => this._http.get(`/users/${id}`).then(r => r.data),
            list: (opts = {}) => this._http.get('/users', { params: opts }).then(r => r.data),
            delete: (id) => this._http.delete(`/users/${id}`).then(r => r.data),
        };
    }
}

module.exports = { URLShortenerClient };

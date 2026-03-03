'use strict';

const { createClient } = require('@clickhouse/client');

/**
 * Creates and returns a ClickHouse HTTP client using env-configured connection params.
 */
function createClickHouseClient() {
    return createClient({
        host: `http://${process.env.CLICKHOUSE_HOST || 'localhost'}:${process.env.CLICKHOUSE_HTTP_PORT || 8123}`,
        username: process.env.CLICKHOUSE_USER || 'default',
        password: process.env.CLICKHOUSE_PASSWORD || '',
        database: process.env.CLICKHOUSE_DB || 'analytics',
    });
}

module.exports = { createClickHouseClient };

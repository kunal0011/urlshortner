'use strict';

/**
 * Super-admin routes for managing all links, users, and organizations.
 *
 * GET    /api/v1/admin/links          — list all links across all orgs
 * DELETE /api/v1/admin/links/:id      — hard delete any link
 * GET    /api/v1/admin/users          — list all users
 * DELETE /api/v1/admin/users/:id      — hard delete any user
 * GET    /api/v1/admin/orgs           — list all orgs
 * DELETE /api/v1/admin/orgs/:id       — hard delete any org
 * GET    /api/v1/admin/stats          — platform-wide counts
 */
async function adminRoutes(fastify) {
    // ─────────── Links ───────────
    fastify.get('/links', async (request) => {
        const { page = 1, page_size = 50 } = request.query;
        const offset = (page - 1) * page_size;
        const [rows, count] = await Promise.all([
            fastify.db.query(
                'SELECT id, short_code, long_url, org_id, status, click_count, created_at FROM links ORDER BY created_at DESC LIMIT $1 OFFSET $2',
                [page_size, offset]
            ),
            fastify.db.query('SELECT COUNT(*) AS total FROM links'),
        ]);
        return { links: rows.rows, total: Number(count.rows[0].total), page, page_size };
    });

    fastify.delete('/links/:id', async (request, reply) => {
        await fastify.db.query('DELETE FROM links WHERE id = $1', [request.params.id]);
        return reply.code(204).send();
    });

    // ─────────── Users ───────────
    fastify.get('/users', async (request) => {
        const { page = 1, page_size = 50 } = request.query;
        const offset = (page - 1) * page_size;
        const result = await fastify.db.query(
            'SELECT id, email, name, org_id, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [page_size, offset]
        );
        return { users: result.rows, page, page_size };
    });

    fastify.delete('/users/:id', async (request, reply) => {
        await fastify.db.query('DELETE FROM users WHERE id = $1', [request.params.id]);
        return reply.code(204).send();
    });

    // ─────────── Orgs ───────────
    fastify.get('/orgs', async (request) => {
        const { page = 1, page_size = 50 } = request.query;
        const offset = (page - 1) * page_size;
        const result = await fastify.db.query(
            'SELECT id, name, plan, owner_id, created_at FROM organizations ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [page_size, offset]
        );
        return { orgs: result.rows, page, page_size };
    });

    fastify.delete('/orgs/:id', async (request, reply) => {
        await fastify.db.query('DELETE FROM organizations WHERE id = $1', [request.params.id]);
        return reply.code(204).send();
    });

    // ─────────── Platform stats ───────────
    fastify.get('/stats', async () => {
        const [links, users, orgs, clicks] = await Promise.all([
            fastify.db.query('SELECT COUNT(*) AS total FROM links'),
            fastify.db.query('SELECT COUNT(*) AS total FROM users'),
            fastify.db.query('SELECT COUNT(*) AS total FROM organizations'),
            fastify.db.query('SELECT COALESCE(SUM(click_count), 0) AS total FROM links'),
        ]);
        return {
            total_links: Number(links.rows[0].total),
            total_users: Number(users.rows[0].total),
            total_orgs: Number(orgs.rows[0].total),
            total_clicks: Number(clicks.rows[0].total),
        };
    });
}

module.exports = adminRoutes;

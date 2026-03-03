'use strict';

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * User routes.
 * GET  /api/v1/users/:id
 * POST /api/v1/users         — create user
 * GET  /api/v1/users         — list users in org
 * DELETE /api/v1/users/:id
 */
async function userRoutes(fastify) {
    fastify.post('/api/v1/users', async (request, reply) => {
        const { email, name, orgId, role = 'member', password } = request.body || {};
        if (!email || !password) {
            return reply.badRequest('email and password are required');
        }
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const id = uuidv4();

        const result = await fastify.db.query(
            `INSERT INTO users (id, email, name, org_id, role, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, org_id, role, created_at`,
            [id, email, name, orgId, role, passwordHash]
        );
        return reply.code(201).send(result.rows[0]);
    });

    fastify.get('/api/v1/users/:id', async (request, reply) => {
        const { id } = request.params;
        const result = await fastify.db.query(
            'SELECT id, email, name, org_id, role, created_at FROM users WHERE id = $1',
            [id]
        );
        if (!result.rows.length) return reply.notFound('user not found');
        return reply.send(result.rows[0]);
    });

    fastify.get('/api/v1/users', async (request) => {
        const { org_id, page = 1, page_size = 20 } = request.query;
        const offset = (page - 1) * page_size;
        const result = await fastify.db.query(
            `SELECT id, email, name, org_id, role, created_at FROM users
       WHERE ($1::text IS NULL OR org_id = $1)
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
            [org_id || null, page_size, offset]
        );
        return { users: result.rows, page: Number(page), page_size: Number(page_size) };
    });

    fastify.delete('/api/v1/users/:id', async (request, reply) => {
        const { id } = request.params;
        await fastify.db.query('DELETE FROM users WHERE id = $1', [id]);
        return reply.code(204).send();
    });
}

module.exports = userRoutes;

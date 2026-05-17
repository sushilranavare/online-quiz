import { verifyToken } from '../utils/generateToken.js';
import { fail } from '../utils/apiResponse.js';

export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return fail(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.substring(7);

    try {
        const decoded = verifyToken(token);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        return fail(res, 'Invalid or expired token', 401);
    }
}

export function adminMiddleware(req, res, next) {
    if (req.user?.role !== 'admin') {
        return fail(res, 'Access denied. Admin privileges required.', 403);
    }
    next();
}
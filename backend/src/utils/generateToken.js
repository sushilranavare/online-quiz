import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function generateToken(userId, role) {
    return jwt.sign(
        { id: userId, role },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn }
    );
}

export function verifyToken(token) {
    return jwt.verify(token, env.jwtSecret);
}
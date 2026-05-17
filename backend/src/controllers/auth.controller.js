import User from '../models/User.js';
import { ok, fail } from '../utils/apiResponse.js';
import { generateToken } from '../utils/generateToken.js';

export async function register(req, res, next) {
    try {
        const { username, email, password, role, adminRegisterCode } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return fail(res, 'User with this email or username already exists', 400);
        }

        // Determine role
        let userRole = 'user';
        if (role === 'admin' || adminRegisterCode === process.env.ADMIN_REGISTER_CODE) {
            userRole = 'admin';
        }

        const user = await User.create({
            username,
            email,
            password,
            role: userRole
        });

        const token = generateToken(user._id, user.role);

        return ok(res, {
            user: user.toJSON(),
            token
        }, 201);
    } catch (error) {
        next(error);
    }
}

export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return fail(res, 'Invalid email or password', 401);
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return fail(res, 'Invalid email or password', 401);
        }

        const token = generateToken(user._id, user.role);

        return ok(res, {
            user: user.toJSON(),
            token
        });
    } catch (error) {
        next(error);
    }
}

export async function getProfile(req, res, next) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return fail(res, 'User not found', 404);
        }

        return ok(res, user.toJSON());
    } catch (error) {
        next(error);
    }
}

export async function updateProfile(req, res, next) {
    try {
        const { username, email } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return fail(res, 'User not found', 404);
        }

        if (username) user.username = username;
        if (email) user.email = email;

        await user.save();

        return ok(res, user.toJSON());
    } catch (error) {
        next(error);
    }
}
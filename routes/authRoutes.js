const { Router } = require('express');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../dbConfig.js");
const authenticate = require('../middleware/authenticate.js');

// Validation
const validate = require("../middleware/validate.js")
const registerSchema = require("../schemas/register-schema.js");
const loginSchema = require("../schemas/login-schema.js");

const authRouter = Router();

const jwtGenerate = (userId) => {
    const payload = {
        user: {
            id: userId
        }
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: 7*24*60*60});
}

authRouter.post("/register", registerSchema, validate, async (req, res) => {
    try {
        const { username, email, password, invitecode } = req.body;

        // Check if user already exists
        const user = await pool.query(`
            SELECT * FROM users
            WHERE user_name=$1 OR user_email=$2`,
            [username, email]
        );
        if (user.rows.length > 0) {
            if (user.rows[0].user_name === username) {
                return res.status(401).json({ error: "Username not available" });
            } else {
                return res.status(401).json({ error: "Email already exists in system" });
            }
        }

        // Check if invite code matches
        if (invitecode !== process.env.INVITE_CODE) {
            return res.status(403).json({ error: "Invalid invite code" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(16);
        const hashPass = await bcrypt.hash(password, salt);

        // Enter new user into database
        const newUser = await pool.query(`
            INSERT INTO users (user_name, user_email, user_password)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [username, email, hashPass]
        );

        // Generate the JWT token
        const jwtToken = jwtGenerate(newUser.rows[0].user_id);
        res.json({jwtToken});

    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Server Error"});
    }
});

authRouter.post('/login', loginSchema, validate, async (req, res) => {
    try {
        const {login, password} = req.body;

        const user = await pool.query(`
            SELECT * FROM users
            WHERE user_name=$1 OR user_email=$1`,
            [login]
        );

        // Check that the user exists
        if (user.rows.length === 0) {
            return res.status(401).json({error: "Login or Password is incorrect"});
        }

        // Check that the password is correct
        const isValid = await bcrypt.compare( password, user.rows[0].user_password);

        if (!isValid) {
            return res.status(401).json({error: "Login or Password is incorrect"});
        }

        // Generate and return the JWT Token
        const jwtToken = jwtGenerate(user.rows[0].user_id);
        res.json(jwtToken);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Server Error"});
    }
});

authRouter.get("/verify", authenticate, async (req, res) => {
    try {
        res.json(true);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Server Error"});
    }
});

module.exports = authRouter;
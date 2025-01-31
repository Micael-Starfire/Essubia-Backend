const { Router } = require('express');
const pool = require("../dbConfig.js");
const authenticate = require("../middleware/authenticate.js");

userRouter = Router();

userRouter.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await pool.query (`
            SELECT user_name, user_email
            FROM users
            WHERE user_id=$1`,
            [req.user.id]
        );

        if (user.rows.length === 0) {
            res.status(404).json({error: 'User not found'});
        }

        res.json(user.rows[0])
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Server error'})
    }
});

module.exports = userRouter;
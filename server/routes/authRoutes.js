// server/routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const { register, login, verifyEmail, reenviarVerificacion } = require('../controllers/authController');

router.post('/register',               register);
router.post('/login',                  login);
router.get('/verificar-email',         verifyEmail);
router.post('/reenviar-verificacion',  reenviarVerificacion);

module.exports = router;
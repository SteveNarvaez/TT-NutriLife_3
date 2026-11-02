const express      = require('express');
const router       = express.Router();
const { register, login, getPerfil } = require('../controllers/authController');
const verifyToken  = require('../middleware/verifyToken');

router.post('/register', register);
router.post('/login',    login);
router.get('/perfil/:id', verifyToken, getPerfil);

module.exports = router;
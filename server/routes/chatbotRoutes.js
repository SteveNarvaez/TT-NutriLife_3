const express     = require('express');
const router      = express.Router();
const { enviarMensaje } = require('../controllers/chatbotController');
const verifyToken = require('../middleware/verifyToken');

router.post('/',        verifyToken, enviarMensaje);
router.post('/message', verifyToken, enviarMensaje);

module.exports = router;
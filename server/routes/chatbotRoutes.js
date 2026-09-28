const express = require('express');
const router  = express.Router();
const { enviarMensaje } = require('../controllers/chatbotController');

router.post('/',        enviarMensaje);
router.post('/message', enviarMensaje);

module.exports = router;
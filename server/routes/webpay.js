const webpayController = require('../controllers/webpay')
const express = require('express');
const router = express.Router();

router.get('/', webpayController.getAmountPage);
router.post('/pagar', webpayController.payment);
router.post('/verificar', webpayController.verify);
router.post('/comprobante', webpayController.getAmountPage);
router.post('/cancelar', webpayController.cancel);

module.exports = router;
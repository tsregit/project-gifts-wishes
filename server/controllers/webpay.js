const WebPay = require('webpay-nodejs');
const cert = require('../certificado/normal');
const onError = require('./onError');
const Payment = require('../models/webpay');
/**
 * 1. Instanciamos la clase WebPay.
 *
 * Notar que los certificados son simples strings, no buffer de archivos ni nada esotérico o místico.
 *
 * @type {WebPay}
 */
let wp = new WebPay({
    commerceCode: cert.commerceCode,
    publicKey: cert.publicKey,
    privateKey: cert.privateKey,
    webpayKey: cert.webpayKey,
    verbose: true,
    env: WebPay.ENV.INTEGRACION
});
let transactions = {};
let transactionsByToken = {};

module.exports = {
    getAmountPage: (req, res, next) => {
        let htmlPage = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Test webpay-nodejs</title>
                    </head>
                    <body>
                        <h1>Test webpay-nodejs</h1>
                        <form action="/pagar" method="post">
                            <input type="number" min="10" placeholder="Monto a pagar" name="amount">
                            <input type="submit" value="Pagar">
                        </form>
                    </body>
                </html>`;
        res.send(htmlPage);
        next();
    },
    payment: (req, res, next) => {

        let buyOrden = Date.now();
        let amount = req.body.amount;
        transactions[buyOrden] = { amount: amount };
        let url = 'http://' + req.get('host');

        /**
         * 2. Enviamos una petición a Transbank para que genere
         * una transacción, como resultado tendremos un token y una url.
         *
         * Nuestra misión es redireccionar al usuario a dicha url y token.
         */
        wp.initTransaction({
            buyOrder: buyOrden,
            sessionId: req.sessionId,
            returnURL: url + '/verificar',
            finalURL: url + '/comprobante',
            amount: amount
        }).then((data) => {
            //console.log(`data: ${data}`);
            // Al ser un ejemplo, se está usando GET.
            // Transbank recomienda POST, el cual se debe hacer por el lado del cliente, obteniendo
            // esta info por AJAX... al final es lo mismo, así que no estresarse.
            res.redirect(data.url + '?token_ws=' + data.token);
        }).catch(onError(res));

    },
    verify: (req, res, next) => {

        let token = req.body.token_ws;
        let transaction;
        // Si toodo está ok, Transbank realizará esta petición para que le vuelvas a confirmar la transacción.

        /**
         * 3. Cuando el usuario ya haya pagado con el banco, Transbank realizará una petición a esta url,
         * porque así se definió en initTransaction
         */
        // console.log('pre token', token);
        wp.getTransactionResult(token).then((transactionResult) => {
            transaction = transactionResult;
            transactions[transaction.buyOrder] = transaction;
            transactionsByToken[token] = transactions[transaction.buyOrder];
            if (transactionResult.detailOutput.responseCode !== 0) {
                let payment = new Payment({
                    description: 'blabla',
                    paymentDate: transactionResult.transactionDate,
                    accountingDate: transactionResult.accountingDate,
                    buyOrder: transactionResult.buyOrder,
                    tbkToken: token,
                    state: 'RECHAZADO'
                });
                payment.save((err, paymentDB) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(paymentDB);
                    }
                });
            }
            // console.log('transaction', transaction);
            /**
             * 4. Como resultado, obtendras transaction, que es un objeto con la información de la transacción.
             * Independiente de si la transacción fue correcta o errónea, debes siempre
             * hacer un llamado a acknowledgeTransaction con el token... Cosas de Transbank.
             *
             * Tienes 30 amplios segundos para hacer esto, sino la transacción se reversará.
             */
            //console.log('re acknowledgeTransaction', token)
            return wp.acknowledgeTransaction(token);

        }).then((result2) => {
            let payment = new Payment({
                description: 'blabla',
                paymentDate: transaction.transactionDate,
                accountingDate: transaction.accountingDate,
                buyOrder: transaction.buyOrder,
                tbkToken: token,
                state: 'APROBADO'
            });
            payment.save((err, paymentDB) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(paymentDB);
                }
            });
            //console.log('pos acknowledgeTransaction', result2);
            // Si llegas aquí, entonces la transacción fue confirmada.
            // Este es un buen momento para guardar la información y actualizar tus registros (disminuir stock, etc).

            // Por reglamento de Transbank, debes retornar una página en blanco con el fondo
            // psicodélico de WebPay. Debes usar este gif: https://webpay3g.transbank.cl/webpayserver/imagenes/background.gif
            // o bien usar la librería.
            res.send(WebPay.getHtmlTransitionPage(transaction.urlRedirection, token));
        }).catch(onError(res));

    },
    voucher: (req, res, next) => {
        //console.log('Mostrar el comprobante');
        const transaction = transactionsByToken[req.body.token_ws];
        let html = JSON.stringify(transaction);
        html += '<hr>';
        html += '<form action="/anular" method="post"><input type="hidden" name="buyOrden" value="' + transaction.buyOrder +
            '"><input type="submit" value="Anular"></form>'
        return res.send(html);
    },
    cancel: (req, res, next) => {
        // Notar que WebPay no permite anular RedCompra. Solo tarjetas de crédito

        const transaction = transactions[req.body.buyOrden];

        wp.nullify({
            authorizationCode: transaction.detailOutput.authorizationCode,
            authorizedAmount: transaction.detailOutput.amount,
            nullifyAmount: transaction.detailOutput.amount,
            buyOrder: transaction.buyOrder
        }).then((result) => {
            // console.log('anulación:', result);
            return res.send('Bla bla comprobante:' + JSON.stringify(transaction));
        }).catch(onError(res));
    }
}
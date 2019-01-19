const express = require('express')
const app = express()

app.use(require('./webpay'));

module.exports = app;
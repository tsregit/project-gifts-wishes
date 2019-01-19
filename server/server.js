require('./config/config');

const express = require('express')
    // Using Node.js `require()`
const mongoose = require('mongoose');
const app = express()
const bodyParser = require('body-parser')
const helmet = require('helmet')
const path = require('path');

// parse application/x-www-form-urlencoded
//cada use es una MDW que siempre pasa por estas lineas

app.use(bodyParser.urlencoded({ extended: false }));
// app.use(helmet())
app.use(require('./routes/index'));

// Habilitar la carpeta public
app.use(express.static(path.resolve(__dirname, '../public')));

mongoose.connect(process.env.URL_DB, (err, res) => {
    // Este callback si no logra abrir la coneccion
    if (err) throw err;
    console.log('Base de datos online');
});

app.listen(process.env.PORT, () => console.log(`Escuchando puerto ${process.env.PORT}`));
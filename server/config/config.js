//=================== 
// Puerto
//===================
process.env.PORT = process.env.PORT || 2000;

//=================== 
// Entorno
//===================

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

//=================== 
// Base de Datos
//===================

let urlDB;

if (process.env.NODE_ENV === 'dev') {
    urlDB = 'mongodb://localhost:27017/cafe';
} else {
    urlDB = process.env.MONGO_URI;
}

process.env.URL_DB = urlDB;

//=================== 
// Vencimiento del Token
//===================
// 60 segundos
// 60 minutos
// 24 horas
// 30 dias
process.env.CADUCIDAD_TOKEN = '48h';


//=================== 
// SEED
//===================
process.env.SEED = process.env.SEED || 'este-es-el-seed-desarrollo';

//=================== 
// GOOGLE CLIENT_ID
//===================

process.env.CLIENT_ID = process.env.CLIENT_ID || '320239123405-6toqieb05ehf3lpc3bogqjq8cgdfdht7.apps.googleusercontent.com';
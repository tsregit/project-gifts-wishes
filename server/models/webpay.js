const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let PaymentSchema = new Schema({
    description: {
        type: String
    },
    paymentDate: {
        type: String
    },
    accountingDate: {
        type: String
    },
    buyOrder: {
        type: String
    },
    createdAt: {
        type: Date
    },
    user_id: {
        type: String
    },
    tbkToken: {
        type: String
    },
    state: {
        type: String,
        enum: ['APROBADO', 'RECHAZADO'],
    }
});
module.exports = mongoose.model('Payment', PaymentSchema);
const mongoose = require('mongoose');
const recordSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    value: { type: String, required: true },
    created: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Record', recordSchema);

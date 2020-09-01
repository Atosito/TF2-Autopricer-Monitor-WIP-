const mongoose = require('mongoose');


let itemSchema = new mongoose.Schema({
    sku: { type: String, required: true },
    name: String,
    clean: String,
    item: {
        defindex: Number,
        quality: Number,
        craftable: Boolean,
        killstreak: Number,
        australium: Boolean,
        effect: Number
    },
    priority: { type: Number, default: 0 },
})

var Item = mongoose.model('Item', itemSchema)

module.exports = Item;

const mongoose = require('mongoose');

let listingSchema = new mongoose.Schema({
    price: {
        keys: { type: Number, required: true },
        scraps: { type: Number, required: true },
        metal: { type: Number, required: true },
        totalInScraps: { type: Number, required: true },
    },
    details: String,
    steamID64: { type: String, required: true },
    timestamp: { type: Number, required: true },
})

let snapshotSchema = new mongoose.Schema({
    sku: { type: String, required: true, unique: true },
    buy: [listingSchema],
    sell: [listingSchema],
    updated: Number
});

var Snapshot = mongoose.model('Snapshot', snapshotSchema)

module.exports = Snapshot;

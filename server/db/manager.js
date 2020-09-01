'use strict'

const request = require('request-promise');

const itemDB = require('./models/item')
const snapshot = require('./models/snapshot')


module.exports = {
    downloadDB: function (options) {
        return new Promise((resolve, reject) => {
            itemDB.find(options).lean().exec(function (err, items) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(items);
                }
            })
        })
    },
    getClassifieds: function (input, name, ignores) {
        return new Promise((resolve, reject) => {
            let errors = 0;
            function req() {
                return request({
                    uri: `https://backpack.tf/api/classifieds/search/v1?`,
                    method: 'GET',
                    qs: input,
                    gzip: true,
                    json: true
                }).then(classifieds => {
                    const timeStamp = Math.floor(Date.now() / 1000);
                    classifieds.buy.listings = classifieds.buy.listings.filter(listing => listing.item.name == name && listing.automatic == 1 && timeStamp - listing.bump <= 1500 && listing.hasOwnProperty('currencies') && listing.item.name.indexOf('Festivized') < 0 );
                    classifieds.sell.listings = classifieds.sell.listings.filter(listing => listing.item.name == name && listing.automatic == 1 && timeStamp - listing.bump <= 1500 && listing.hasOwnProperty('currencies') && listing.item.name.indexOf('Festivized') < 0 );
                    return resolve(classifieds);
                }).catch(e => {
                    errors++;
                    console.log(e)
                    setTimeout(() => {
                        req();
                    }, 650);
                })
            }
            req();
        })
    },
    updateSnapshot: function (sku, newSnap) {
        return new Promise((resolve, reject) => {
            snapshot.findOneAndUpdate({
                sku: sku
            }, newSnap, {
                new: true,
                upsert: true
            }, function (err, doc) {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(doc);
                }
            })
        })
    },
}


const { default: PQueue } = require('p-queue');
const rp = require('request-promise');
const jsonfile = require('jsonfile');
const SKU = require('tf2-sku');

const utils = require('./utils/utils');
const enums = require('./utils/enums');
const dbManager = require('../db/manager');
const itemDB = require('../db/models/item');
const snapDB = require('../db/models/snapshot');

const SKU = require('tf2-sku');

class Updater {
    constructor(io) {
        this.io = io;
        this.taskQueue = new PQueue({
            concurrency: 1
        });
        this.count = 0;
        this.apikeys = [];
        this.itemsList = [];
        this.communityPrices = [];
        this.keyPrice = {};

        this.io.on('connection', socket => {
            this.socket = socket;
        })
    }
    async addItems() {
        let db = this.itemsList;
        for (const item of db) {
            (async () => {
                await this.taskQueue.add(async () => await this.updateSnapshot(item), { priority: 2 });
            })();
        }
    }
    async updateSnapshot(item) {
        try {
            await sleep(utils.getDelay(this.apikeys.length));
            let input = this.getItemInput(item);
            let data = await dbManager.getClassifieds(input, item.name, this.ignores);
            this.checkProfitable(data, item.sku);
            let newSnapshot = this.createSnapshot(data, item.sku);
            let newSave = await dbManager.updateSnapshot(item.sku, newSnapshot);
            if (this.socket) {
                this.socket.emit('snapshot', newSave)
            }
        } catch (error) {
            console.log(error)
        } finally {
            return;
        }
    }
    createSnapshot(data, sku) {
        let obj = {
            sku,
            buy: [],
            sell: [],
            updated: Math.floor(Date.now() / 1000)
        }
        let buyFiltered = [].concat(data.buy.listings);

        for (let i = 0; i < buyFiltered.length; i++) {
            let scraps = Object.is(buyFiltered[i].currencies.keys, undefined) ? 0 : utils.keyToScrap(buyFiltered[i].currencies.keys, this.keyPrice.scraps);
            scraps += Object.is(buyFiltered[i].currencies.metal, undefined) ? 0 : utils.refinedToScrap(buyFiltered[i].currencies.metal);
            obj.buy.push({
                price: {
                    keys: (buyFiltered[i].currencies.keys) ? buyFiltered[i].currencies.keys : 0,
                    metal: (buyFiltered[i].currencies.metal) ? buyFiltered[i].currencies.metal : 0,
                    scraps: (buyFiltered[i].currencies.metal) ? utils.refinedToScrap(buyFiltered[i].currencies.metal) : 0,
                    totalInScraps: scraps,
                    usd_cents: this.scrapsToUsd(scraps)
                },
                details: buyFiltered[i].details,
                steamID64: buyFiltered[i].steamid,
                timestamp: buyFiltered[i].bump
            })
        }
        let sellFiltered = [].concat(data.sell.listings);

        for (let i = 0; i < sellFiltered.length; i++) {
            let scraps = Object.is(sellFiltered[i].currencies.keys, undefined) ? 0 : utils.keyToScrap(sellFiltered[i].currencies.keys, this.keyPrice.scraps);
            scraps += Object.is(sellFiltered[i].currencies.metal, undefined) ? 0 : utils.refinedToScrap(sellFiltered[i].currencies.metal);
            obj.sell.push({
                price: {
                    keys: (sellFiltered[i].currencies.keys) ? sellFiltered[i].currencies.keys : 0,
                    metal: (sellFiltered[i].currencies.metal) ? sellFiltered[i].currencies.metal : 0,
                    scraps: (sellFiltered[i].currencies.metal) ? utils.refinedToScrap(sellFiltered[i].currencies.metal) : 0,
                    totalInScraps: scraps,
                    usd_cents: this.scrapsToUsd(scraps)
                },
                details: sellFiltered[i].details,
                steamID64: sellFiltered[i].steamid,
                timestamp: sellFiltered[i].bump
            })
        }
        return obj;
    }
    getItemInput(item) {
        if (this.count == this.apikeys.length) {
            this.count = 0;
        }
        let apikey = this.apikeys[this.count];
        this.count++;
        let input = {
            "key": apikey,
            "item_names": '1',
            "intent": 'dual',
            "page_size": 30,
            "fold": 0,
            "item": item.clean,
            "quality": item.item.quality,
            "craftable": (item.item.craftable) ? 1 : -1,
            "killstreak_tier": item.item.killstreak,
            "australium": (item.item.australium) ? 1 : -1,
            "tradable": 1
        };
        if (item.item.quality == 5) {
            input.particle = item.item.effect;
        }
        return input;
    }

    async init() {
        try {
            this.apikeys = process.env.APIKEYS.split(',');
            this.itemsList = await itemDB.find({}).lean();
            this.keyPrice = await this.getBPKeyPrice(this.itemsList.filter(obj => obj.sku == '5021;6')[0])
            return;
        } catch (error) {
            throw error;
        }
    }
    calculateSnapKey(data, sku) {
        let obj = {
            sku,
            buy: [],
            sell: [],
            updated: Math.floor(Date.now() / 1000)
        }
        let buyFiltered = [].concat(data.buy.listings);

        for (let i = 0; i < buyFiltered.length; i++) {
            let scraps = Object.is(buyFiltered[i].currencies.metal, undefined) ? 0 : utils.refinedToScrap(buyFiltered[i].currencies.metal);
            obj.buy.push({
                price: {
                    keys: (buyFiltered[i].currencies.keys) ? buyFiltered[i].currencies.keys : 0,
                    metal: (buyFiltered[i].currencies.metal) ? buyFiltered[i].currencies.metal : 0,
                    scraps: (buyFiltered[i].currencies.metal) ? utils.refinedToScrap(buyFiltered[i].currencies.metal) : 0,
                    totalInScraps: scraps,
                },
                details: buyFiltered[i].details,
                steamID64: buyFiltered[i].steamid,
                timestamp: buyFiltered[i].bump
            })
        }

        let sellFiltered = [].concat(data.sell.listings);

        for (let i = 0; i < sellFiltered.length; i++) {
            let scraps = Object.is(sellFiltered[i].currencies.metal, undefined) ? 0 : utils.refinedToScrap(sellFiltered[i].currencies.metal);
            obj.sell.push({
                price: {
                    keys: (sellFiltered[i].currencies.keys) ? sellFiltered[i].currencies.keys : 0,
                    metal: (sellFiltered[i].currencies.metal) ? sellFiltered[i].currencies.metal : 0,
                    scraps: (sellFiltered[i].currencies.metal) ? utils.refinedToScrap(sellFiltered[i].currencies.metal) : 0,
                    totalInScraps: scraps,
                },
                details: sellFiltered[i].details,
                steamID64: sellFiltered[i].steamid,
                timestamp: sellFiltered[i].bump
            })
        }
        return obj;
    }
    async getBPKeyPrice(item) {
        try {
            await sleep(utils.getDelay(this.apikeys.length));
            let input = this.getItemInput(item);
            let data = await dbManager.getClassifieds(input, item.name);
            let newSnapshot = this.calculateSnapKey(data, '5021;6');
            let sellPrice = this.calculateSellPrice(newSnapshot);
            return { metal: utils.scrapToRefined(sellPrice.average - 1), scraps: sellPrice.average - 1 }
        } catch (error) {
            throw error
        }
    }
    calculatePrice(snapshot) {
        try {
            let buyPrice = this.calculateBuyPrice(snapshot);
            let communityPrice = (this.communityPrices.filter(obj => obj.sku == snapshot.sku).length == 1) ? utils.currenciesToScraps(this.communityPrices.filter(obj => obj.sku == snapshot.sku)[0].price, this.keyPrice.scraps) : false;
            let sellPrice = this.calculateSellPrice(snapshot);
            return {
                buy: buyPrice,
                sell: sellPrice,
                communityPrice
            }
        } catch (error) {
            return error
        }
    }
    async setPrices() {
        try {
            this.snapList = await snapDB.find({}).lean();
            this.communityPrices = await this.getCommunityPrices();
            let priceList = {};
            for (let i = 0; i < this.snapList.length; i++) {
                const snapshot = this.snapList[i];
                pricelist[snapshot.sku] = {
                    price: this.calculatePrice(snapshot),
                    updated: snapshot.updated
                }
            }
            return priceList;
        } catch (error) {
            throw error;
        }

    }
    calculateBuyPrice(snapshot) {
        let obj = false;
        snapshot.buy = snapshot.buy.sort((a, b) => {
            return b.price.totalInScraps - a.price.totalInScraps;
        })
        snapshot.sell = snapshot.sell.sort((b, a) => {
            return a.price.totalInScraps - b.price.totalInScraps;
        })
        let buyValues = snapshot.buy.map(obj => obj.price.totalInScraps);
        let sellValues = snapshot.sell.map(obj => obj.price.totalInScraps);
        if (snapshot.buy.length > 2) {
            let prom = 0;
            obj = {};
            obj['first'] = snapshot.buy[0].price.totalInScraps;
            obj['common'] = Number(getMostCommon(buyValues)[0])
            obj['last'] = snapshot.buy[snapshot.buy.length - 1].price.totalInScraps;
            for (var i = 0; i < 2; i++) {
                console.log(snapshot.buy[i].price.totalInScraps)
                prom += snapshot.buy[i].price.totalInScraps
            }
            obj['average'] = (Number(Math.floor(prom / i)) == 0) ? 0.5 : Number(Math.floor(prom / i));
        } else {
            throw 'error not enough data'
        }
        return obj;
    }
    calculateSellPrice(snapshot) {
        let obj = false;
        snapshot.sell = snapshot.sell.sort((a, b) => {
            return a.price.totalInScraps - b.price.totalInScraps;
        })
        let sellValues = snapshot.sell.map(obj => obj.price.totalInScraps);
        if (snapshot.sell.length > 2) {
            let prom = 0;
            obj = {};
            obj['first'] = snapshot.sell[0].price.totalInScraps;
            obj['common'] = Number(getMostCommon(sellValues)[0])
            obj['last'] = snapshot.sell[snapshot.sell.length - 1].price.totalInScraps;
            for (var i = 0; i < 2; i++) {
                console.log(snapshot.sell[i].price.totalInScraps)
                prom += snapshot.sell[i].price.totalInScraps
            }
            obj['average'] = (Number(Math.floor(prom / i)) == 0) ? 0.5 : Number(Math.floor(prom / i));
        } else {
            throw 'error not enough data'
        }
        return obj;
    }
    async getPrices() {
        return rp({
            uri: `https://backpack.tf/api/IGetPrices/v4?raw=1&since=155308876&key=${this.apikeys[0]}`,
            json: true
        }).then(res => {
            if (res.response.items) {
                return res;
            }
            return jsonfile.readFile("communityPrices.json");
        }).catch(e => {
            return jsonfile.readFile("communityPrices.json");
        })
    }
    async getCommunityPrices() {
        try {
            const db = await this.getPrices();
            await jsonfile.writeFile("communityPrices.json", db);
            let items = db.response.items;
            let clean_names = Object.keys(items)
            let res = [];
            let unsuals = Object.keys(enums.UNUSUAL_EFFECT);
            let quality = Object.keys(enums.QUALITY)
            for (let i = 0; i < clean_names.length; i++) {
                const name = clean_names[i];
                let defindex = items[name].defindex[0]
                quality.forEach(num => {
                    if (items[name].prices[num]) {
                        if (num == 5) {
                            unsuals.forEach(index => {
                                if (items[name].prices[num].Tradable.Craftable) {
                                    if (items[name].prices[num].Tradable.Craftable[index]) {
                                        res.push({
                                            clean_name: name,
                                            qualityString: enums.QUALITY[num],
                                            qualityNumber: num,
                                            craftalbe: true,
                                            effect: enums.UNUSUAL_EFFECT[index],
                                            priceIndex: index,
                                            value: items[name].prices[num].Tradable.Craftable[index].value,
                                            currency: items[name].prices[num].Tradable.Craftable[index].currency,
                                            sku: SKU.fromObject({
                                                defindex,
                                                quality: num,
                                                craftable: true,
                                                killstreak: 0,
                                                australium: false,
                                                festive: false,
                                                effect: index,
                                                paintkit: null,
                                                wear: null,
                                                quality2: null,
                                                target: null,
                                                craftnumber: null
                                            }),
                                            price: {
                                                keys: (items[name].prices[num].Tradable.Craftable[index].currency == 'keys') ? items[name].prices[num].Tradable.Craftable[index].value : 0,
                                                metal: (items[name].prices[num].Tradable.Craftable[index].currency == 'metal') ? items[name].prices[num].Tradable.Craftable[index].value : 0,
                                                scraps: (items[name].prices[num].Tradable.Craftable[index].currency == 'metal') ? utils.refinedToScrap(items[name].prices[num].Tradable.Craftable[index].value) : 0,
                                            }
                                        })
                                    }
                                }

                            });
                        } else {
                            if (items[name].prices[num].Tradable["Craftable"]) {
                                if (items[name].prices[num].Tradable["Craftable"][0]) {
                                    res.push({
                                        clean_name: name,
                                        qualityString: enums.QUALITY[num],
                                        qualityNumber: num,
                                        craftalbe: true,
                                        value: items[name].prices[num].Tradable["Craftable"][0].value,
                                        currency: items[name].prices[num].Tradable["Craftable"][0].currency,
                                        sku: SKU.fromObject({
                                            defindex,
                                            quality: num,
                                            craftable: true,
                                            killstreak: 0,
                                            australium: false,
                                            festive: false,
                                            effect: null,
                                            paintkit: null,
                                            wear: null,
                                            quality2: null,
                                            target: null,
                                            craftnumber: null
                                        }),
                                        price: {
                                            keys: (items[name].prices[num].Tradable["Craftable"][0].currency == 'keys') ? items[name].prices[num].Tradable["Craftable"][0].value : 0,
                                            metal: (items[name].prices[num].Tradable["Craftable"][0].currency == 'metal') ? items[name].prices[num].Tradable["Craftable"][0].value : 0,
                                            scraps: (items[name].prices[num].Tradable["Craftable"][0].currency == 'metal') ? utils.refinedToScrap(items[name].prices[num].Tradable["Craftable"][0].value) : 0,
                                        }
                                    })
                                }
                            }
                            if (items[name].prices[num].Tradable["Non-Craftable"]) {
                                if (items[name].prices[num].Tradable["Non-Craftable"][0]) {
                                    res.push({
                                        clean_name: name,
                                        qualityString: enums.QUALITY[num],
                                        qualityNumber: num,
                                        craftalbe: false,
                                        value: items[name].prices[num].Tradable["Non-Craftable"][0].value,
                                        currency: items[name].prices[num].Tradable["Non-Craftable"][0].currency,
                                        sku: SKU.fromObject({
                                            defindex,
                                            quality: num,
                                            craftable: false,
                                            killstreak: 0,
                                            australium: false,
                                            festive: false,
                                            effect: null,
                                            paintkit: null,
                                            wear: null,
                                            quality2: null,
                                            target: null,
                                            craftnumber: null
                                        }),
                                        price: {
                                            keys: (items[name].prices[num].Tradable["Non-Craftable"][0].currency == 'keys') ? items[name].prices[num].Tradable["Non-Craftable"][0].value : 0,
                                            metal: (items[name].prices[num].Tradable["Non-Craftable"][0].currency == 'metal') ? items[name].prices[num].Tradable["Non-Craftable"][0].value : 0,
                                            scraps: (items[name].prices[num].Tradable["Non-Craftable"][0].currency == 'metal') ? utils.refinedToScrap(items[name].prices[num].Tradable["Non-Craftable"][0].value) : 0,
                                        }
                                    })
                                }

                            }
                        }
                    }
                });
            }
            return res;
        } catch (error) {
            throw error;
        }
    }

}
function getMostCommon(array) {
    var count = {};
    array.forEach(function (a) {
        count[a] = (count[a] || 0) + 1;
    });
    return Object.keys(count).reduce(function (r, k, i) {
        if (!i || count[k] > count[r[0]]) {
            return [k];
        }
        if (count[k] === count[r[0]]) {
            r.push(k);
        }
        return r;
    }, []);
}

module.exports = Updater

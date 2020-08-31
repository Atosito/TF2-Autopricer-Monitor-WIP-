'use strict';


function stringToObject(string) {
    let object = parseJSON('{"' + string.replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    return object;
}
function parseJSON(string) {
    try {
        return JSON.parse(string);
    } catch (err) {
        return null;
    }
}
function scrapToRefined(scrap) {
    const refined = trunc(scrap / 9, 2);
    return refined;
}
function refinedToScrap(refined) {
    const scrap = round(refined * 9, 0.5);
    return scrap;
}
function currenciesToScraps(currencie, keyPrice) {
    let scraps = currencie.keys * keyPrice;
    scraps += currencie.scraps;
    return Math.floor(Number(scraps));
}
function currenciesXAmount(currencies, amount) {
    if (!currencies.keys) {
        currencies.keys = 0;
    }
    return {
        keys: currencies.keys * amount,
        scraps: currencies.scraps * amount
    }
}
function scrapsToKeys(scraps, keyPrice) {
    let keys = Math.floor(scraps / keyPrice);
    let scrapsInKeys = keys * keyPrice;
    return {
        scraps: scraps - scrapsInKeys,
        keys: keys
    }
}
function communityToCurrencie(item, keyPrice) {
    if (item.currency == "metal") {
        return { keys: 0, scraps: refinedToScrap(item.value) }
    } if (item.currency == "keys") {
        return { keys: Math.floor(item.value), scraps: Math.round(keyPrice * (item.value - Math.floor(item.value))) }
    }
}

function convertPrice(currencies, keyPrice) {
    let keys = Math.floor(currencies.scraps / keyPrice);
    let metall = currencies.scraps - (keyPrice * keys);
    return {
        scraps: currencies.scraps - (keyPrice * keys),
        keys: currencies.keys + keys,
        metal: scrapToRefined(metall)
    }
}

function scrapsToCurrencies(scraps, keyInScraps) {
    let keys = Math.floor(scraps / keyInScraps);
    let scrapsInKeys = keys * keyInScraps;
    return {
        metal: scrapToRefined(scraps - scrapsInKeys),
        keys: keys,
    }
}



function countDuplicates(array, name) {
    return array.filter(obj => obj.name == name).length;
}
function currenciesToText(price) {
    let textPrice = '';
    if (!price.scraps && !price.metal) {
        price.scraps = 0;
    }
    if (!price.metal && price.scraps) {
        price.metal = scrapToRefined(price.scraps);
    }
    if (price.keys > 0 && price.metal > 0) {
        textPrice = `( ${price.keys} keys, ${price.metal} ref )`;
    }
    if (price.keys > 0 && price.scraps == 0) {
        textPrice = `( ${price.keys} keys )`;
    }
    if (price.keys == 0 && price.metal > 0) {
        textPrice = `( ${price.metal} ref )`;
    }
    if (price.keys == 0 && price.scraps == 0) {
        textPrice = `( 0 keys, 0 ref)`
    }
    return textPrice;
}
function removeDuplicates(array) {
    return array.reduce((acc, current) => {
        const x = acc.find(item => item.sku === current.sku);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);
}
function keyToScrap(keys, scrapKeyPrice) {
    return keys * scrapKeyPrice;
}
function getDelay(num) {
    let res = Math.ceil(1000 / num) + 100;
    if (res < 300) {
        return 1000;
    }
    return 1000;
}

function trunc(number, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.floor(number * factor) / factor;
}
function round(value, step = 1) {
    var inv = 1.0 / step;
    return Math.round(value * inv) / inv;
}
module.exports = {
    getDelay,
    stringToObject,
    parseJSON,
    scrapToRefined,
    refinedToScrap,
    currenciesToScraps,
    communityToCurrencie,
    currenciesXAmount,
    scrapsToKeys,
    convertPrice,
    scrapsToCurrencies,
    countDuplicates,
    currenciesToText,
    removeDuplicates,
    keyToScrap,
}

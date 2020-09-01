'use strict'

const SKU = require('tf2-sku');
const enums = require("./enums");

module.exports = {
    econItem: {
        getFilters:function (item){
            let filters = [];
            // quality
            filters.push(this.getQuality(item).toLowerCase());
            // class
            let classes = item.tags.filter(obj => obj.category == 'Class')
            for (let i = 0; i < classes.length; i++) {
                const element = classes[i];
                filters.push(element.name.toLowerCase());
            }
            // type
            let types = item.tags.filter(obj => obj.category == 'Type')
            for (let i = 0; i < types.length; i++) {
                const element = types[i];
                filters.push(element.name.toLowerCase());
            }
            return filters;

        },
        isCraftWeapon: function (item) {
            if (item.appid != 440) return false;
            if (item.marketable) return false;
            if (!this.isUnique(item)) return false;
            const type = this.getTag('Type', item);
            if (!type) return false;
            if (item.market_hash_name.match(/(Class|Slot) Token/)) return false;
            if (!this.isCraftable(item)) return false;
            if (item.market_name.indexOf('Festivized ') != -1) return false;
            if (item.market_name.indexOf('Festive ') != -1) return false;
            if (this.isKillstreak(item) != 0) return false;

            const notCraftWeapons = ['The Hot Hand', 'C.A.P.P.E.R', 'Horseless Headless Horsemann\'s', 'Three-Rune Blade', 'Nostromo Napalmer', 'AWPer Hand', 'Quäckenbirdt', 'Sharp Dresser', 'Conscientious Objector', 'Frying Pan', 'Batsaber', 'Black Rose', 'Scattergun', 'Rocket Launcher', 'Sniper Rifle', 'Shotgun', 'Grenade Launcher', 'Shooting Star', 'Big Kill', 'Fishcake', 'Giger Counter', 'Maul', 'Unarmed Combat', 'Crossing Guard', 'Wanga Prick', 'Freedom Staff', 'Ham Shank', 'Ap-Sap', 'Pistol', 'Bat', 'Flame Thrower', 'Construction PDA', 'Fire Axe', 'Stickybomb Launcher', 'Minigun', 'Medi Gun', 'SMG', 'Knife', 'Invis Watch', 'Sapper', 'Mutated Milk', 'Bread Bite', 'Snack Attack', 'Self - Aware Beauty Mark', 'Shovel', 'Bottle', 'Wrench', 'Bonesaw', 'Kukri', 'Fists', 'Syringe Gun', 'Revolver', 'Shotgun', 'SMG', 'Sapper', 'Grenade Launcher', 'Bonesaw', 'Revolver'];

            for (let i = 0; i < notCraftWeapons.length; i++) {
                const name = notCraftWeapons[i];
                if (item.market_name.indexOf(name) != -1) return false;
            }
            return ['Primary weapon', 'Secondary weapon', 'Melee weapon', 'Primary PDA', 'Secondary PDA'].indexOf(type) != -1;
        },
        isTF2Key: function (item) {
            return item.market_name == 'Mann Co. Supply Crate Key' && isUnique(item);
        },
        isUnique: function (item) {
            return this.getQuality(item) == 'Unique';
        },
        getEffect: function (item) {
            if (this.isUnique(item)) return null;
            const descriptions = item.descriptions;
            if (!descriptions) return null;

            for (let i = 0; i < descriptions.length; i += 1) {
                const value = descriptions[i].value;
                if (value[0] == '\u2605') {
                    return value.substr(18); // Remove "★ Unusual Effect: "
                }
            }

            return null;
        },
        getName: function (item) {
            let name = item.market_hash_name;
            const effect = this.getEffect(item);
            if (effect) {
                name = name.replace('Unusual ', '');
                name = name.startsWith('Strange ') ? 'Strange ' + effect + ' ' + name.substr(name.indexOf(' ') + 1) : effect + ' ' + name;
            }

            if (!this.isCraftable(item)) {
                name = 'Non-Craftable ' + name;
            }

            return name;
        },
        getTag: function (category, item) {
            const tags = item.tags;
            if (!tags) {
                return null;
            }
            for (let i = 0; i < tags.length; i++) {
                if (tags[i].category == category || tags[i].category_name == category) {
                    return tags[i].localized_tag_name || tags[i].name;
                }
            }
            return null;
        },
        getQuality: function (item) {
            return this.getTag('Quality', item);
        },
        hasDescription: function (desc, item) {
            const descriptions = item.descriptions;
            if (!descriptions) return false;
            return descriptions.some(function (d) {
                return d.value == desc;
            });
        },
        toSKU: function (item) {
            const obj = {
                defindex: this.getDefindex(item),
                quality: enums.QUALITY[this.getQuality(item)],
                craftable: this.isCraftable(item),
                killstreak: this.isKillstreak(item),
                australium: this.isAustralium(item),
                festive: false,
                effect: this.getPriceIndex(item),
                paintkit: null,
                wear: null,
                quality2: null,
                target: null,
                craftnumber: null
            }
            return SKU.fromObject(obj);
        },
        getDefindex: function (item) {
            const link = this.getAction('Item Wiki Page...', item);
            if (link != null) {
                const query = stringToObject(link.substring(link.indexOf('?') + 1));
                const defindex = parseInt(query.id);
                return defindex;
            } else {
                return null;
            }
        },
        isSkin: function (item) {
            const wears = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle Scarred'];

            for (let i = 0; i < wears.length; i++) {
                if (item.market_name.indexOf(wears[i]) != -1) {
                    return true;
                }
            }

            return false;
        },
        getAction: function (action, item) {
            const actions = item.actions;
            if (!actions) return null;
            for (let i = 0; i < actions.length; i++) {
                if (actions[i].name == action) return actions[i].link;
            }
            return null;
        },
        isKillstreak: function (item) {
            const name = item.market_hash_name;
            if (name.indexOf('Professional Killstreak ') != -1) {
                return 3;
            } else if (name.indexOf('Specialized Killstreak ') != -1) {
                return 2;
            } else if (name.indexOf('Killstreak ') != -1) {
                return 1;
            } else {
                return 0;
            }
        },
        getUnusualEffect: function (item) {
            if (this.isUnique(item)) return null;
            const descriptions = item.descriptions;
            if (!descriptions) return null;

            for (let i = 0; i < descriptions.length; i += 1) {
                const value = descriptions[i].value;
                if (value[0] == '\u2605') {
                    return value.substr(18); // Remove "★ Unusual Effect: "
                }
            }
            return null;
        },
        getPriceIndex: function (item) {
            const effect = this.getUnusualEffect(item);
            if (effect) {
                let names = Object.keys(enums.UNUSUAL_EFFECT);
                for (let i = 0; i < names.length; i++) {
                    const element = names[i];
                    if (enums.UNUSUAL_EFFECT[element] == effect) {
                        return element;
                    }
                }
                return null;
            } else {
                return null;
            }
        },
        isAustralium: function (item) {
            if (this.getTag('Quality', item) != 'Strange') {
                return false;
            }
            return item.market_hash_name.indexOf('Australium ') != -1;
        },
        isCraftable: function (item) {
            return !this.hasDescription('( Not Usable in Crafting )', item);
        },
    },
}
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

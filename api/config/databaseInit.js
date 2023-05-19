const db = require('../config/database');
const Banner = require('../Models/Banner');
const Division = require('../Models/Division');
const DivisionPartner = require('../Models/DivisionPartner');
const Lot = require('../Models/Lot');
const LotImage = require('../Models/LotImage');
const Notification = require('../Models/Notification');
const Parcel = require('../Models/Parcel');
const Partner = require('../Models/Partner');
const Sale = require('../Models/Sale');
const User = require('../Models/User');
const TaxValues = require('../Models/TaxValues');
const Contract = require('../Models/Contract');


const createDatabaseTables = async () => {
    await Banner.sync({});
    await Division.sync({});
    await DivisionPartner.sync({});
    await Lot.sync({});
    await LotImage.sync({});
    await User.sync({});
    await Notification.sync({});
    await Sale.sync({});
    await Parcel.sync({});
    await Partner.sync({});
    await TaxValues.sync({});
    await TaxValues.create({
        defaultTax: 1,
        after24Months: 1,
    })
    await Contract.sync({force: true});
}


createDatabaseTables()
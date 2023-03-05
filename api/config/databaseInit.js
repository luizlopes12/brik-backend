const db = require('../config/database');
const Banner = require('../models/Banner');
const Division = require('../models/Division');
const DivisionPartner = require('../models/DivisionPartner');
const Lot = require('../models/Lot');
const LotImage = require('../models/LotImage');
const Notification = require('../models/Notification');
const Parcel = require('../models/Parcel');
const Partner = require('../models/Partner');
const Sale = require('../models/Sale');
const User = require('../models/User');
const TaxValues = require('../models/TaxValues');


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
}


createDatabaseTables()
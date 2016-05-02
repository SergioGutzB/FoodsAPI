var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var FoodSchema = new Schema({
    name: {type: String, required: true},
    peso: String,
    description: String,
    image: String,
    type: String,
    expires: {type: Date},
    create: {type: Date},
    user_id: String,
    state: String,
    lat: String,
    lng: String,
});



module.exports = mongoose.model('Food', FoodSchema);
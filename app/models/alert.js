var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AlertSchema = new Schema({
  food_id: {type: String},
  sender_id: {type: String},
  user_id: {type: String},
  message: {type: String},
  create: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Alert', AlertSchema);
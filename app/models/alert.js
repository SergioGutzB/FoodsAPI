var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AlertSchema = new Schema({
  food_id: {type: String},
  sender_id: {type: String},
  user_id: {type: String},
  message: [],
  create: {type: Date, default: Date.now}
  data_user: false,
  data_sender: false,
});

module.exports = mongoose.model('Alert', AlertSchema);
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var MessageSchema = new Schema({
  user_id: {type: String},
  sender: {type: String},
  mensaje: {type: Object}
});



module.exports = mongoose.model('Message', MessageSchema);
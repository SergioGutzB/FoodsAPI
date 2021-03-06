var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport	  = require('passport');
var Moment      = require('moment-timezone');
var config      = require('./config/database'); // get db config file
var User        = require('./app/models/user'); // get the mongoose model
var Food        = require('./app/models/food'); // get the mongoose model
var Message     = require('./app/models/message'); // get the mongoose model
var Alert       = require('./app/models/alert'); // get the mongoose model
var port 	      = process.env.PORT || 8080;
var jwt 			  = require('jwt-simple');
var multipart = require('connect-multiparty');


process.env.TZ = 'America/Bogota';
// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('./images'));
// log to console
app.use(morgan('dev'));

app.use(multipart()) //Express 4

app.use(function(req, res, next) {
res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

// Use the passport package in our application
app.use(passport.initialize());

// demo Route (GET http://localhost:8080)
app.get('/', function(req, res) {
  res.send('Hello World, From /');
});


mongoose.connect(config.database);

require('./config/passport')(passport);

var apiRoutes = express.Router();

apiRoutes.post('/signup', function(req, res) {
  if (!req.body.user_name || !req.body.password) {
    res.json({succes: false, msg: 'Please pass name and password.'});
  } else {
    var newUser = new User({
      user_name: req.body.user_name,
      password: req.body.password, 
      email:  req.body.email, 
      first_name: req.body.first_name,
      last_name:  req.body.last_name,  
      image: req.body.image,
      address: req.body.address,
      phone: req.body.phone,
      code_postal: req.body.code_postal,
      lat: req.body.lat,
      log: req.body.log,

    });
    newUser.save(function(err) {
      if (err) {
        res.json({succes: false, msg: 'Username already exists.', user: newUser, error: err});
      } else {
        res.json({succes: true, msg: 'Successful created user!'});
      }
    });
  }
});

apiRoutes.post('/authenticate', function(req, res) {
  User.findOne({
    user_name: req.body.user_name
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      user.comparePassword(req.body.password, function(err, isMatch) {
        if (isMatch && !err) {
          var token = jwt.encode(user, config.secret);
          console.log("success: true")
          res.json({success: true, token: 'JWT ' + token});

        } else {
          console.log("success: false")
          res.send({success: false, msg: 'Authentication failed. Wrong password.'});
          
        }
      });
    }
  });
});

//Obetener un usuario por el ID - usuario propio
apiRoutes.get('/user', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({_id: decoded._id}, function(err, user) {
      if (err) throw err;

      if (!user) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        return res.json({success: true, msg: 'Welcome in the member area ' + user.user_name + '!', user:user});
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});


//Obetener un usuario por el ID - usuario propio
apiRoutes.post('/user_id', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    User.findOne({_id: req.body._id}, function(err, user) {
      if (err) throw err;

      if (!user) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        return res.json({success: true, msg: 'Welcome in the member area ' + user.user_name + '!', user:user});
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

//Obetener la lista de alerta del usuario - usuario propio
apiRoutes.post('/alerts', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    Alert.find({user_id: decoded._id}, function(err, alert) {
      if (err) throw err;

      if (!alert) {
        return res.status(403).send({success: false, msg: 'Authentication failed. Alerts not found.'});
      } else {
        return res.json({success: true, msg: 'List alerts', alerts:alert});
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

//Obetener la lista de alerta del usuario - usuario propio
apiRoutes.post('/alerts_food', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    Alert.find({food_id: req.body.food_id}, function(err, alert) {
      if (err) throw err;

      if (!alert) {
        return res.status(403).send({success: false, msg: 'Authentication failed. Alerts not found.'});
      } else {
        return res.json({success: true, msg: 'List alerts', alerts:alert});
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

//Obetener la lista de alerta del usuario - usuario propio
apiRoutes.post('/alerts_sender', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    console.log("food_id "+ req.body.food_id + "sender_id "+ req.body.sender_id)
    Alert.findOne({food_id: req.body.food_id, sender_id: req.body.sender_id}, function(err, alert) {
      if (err) throw err;
      if (!alert) {
        console.log("Alert not found.")
        return res.status(403).send({success: false, msg: 'Alert not found.'});
      } else {
        return res.json({success: true, msg: 'Alert by sender', alert:alert});
      }
    });
  } else {
    console.log("No token provided.")
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

//Funcion para enviar alerta a un usuario sobre el alimento. 
apiRoutes.post('/send_alert', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);    
    var new_alert = new Alert({
      food_id: req.body.food_id,
      sender_id: decoded._id,
      user_id: req.body.user_id,
      message: req.body.message,
      create: Moment().tz('America/Bogota').format(),
    });
    new_alert.save(function(err) {
      if (err) {
        res.json({succes: false, msg: 'Error sending alert!'});
      } else {
        res.json({succes: true, msg: 'Successful sending alert!'});
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

//Funcion para enviar alerta a un usuario sobre el alimento. 
apiRoutes.post('/update_alert', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);    
    Alert.findById({_id: req.body._id}, function(err, alert) {
    if (err) throw err;

    if (!alert) {
      return res.status(403).send({success: false, msg: 'Authentication failed. Alert not found.'});
    } else {
      if (req.body.message)   alert.message    = req.body.message;
      if (req.body.data_user)   alert.data_user    = req.body.data_user;
      if (req.body.data_sender)   alert.data_sender    = req.body.data_sender;
      
      alert.save(function(err){
        if (err) throw err;
        return res.json({success: true, msg: 'User ' + alert + ' successfully updated alert!'});
      });        
    }
  });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});


//Eliminar alerta 
apiRoutes.post('/deleted_alert', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    if (req.body.alert_id)
      Alert.findOneAndRemove({_id: req.body.alert_id}, function(err){
        if (err) {
          res.json({succes: false, msg: 'Error deleting alert!'});
        } else {
          res.json({succes: true, msg: 'Successful deleting alert!'});
        }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

//Obetener la lista de alerta del usuario - usuario propio y usuario sender
apiRoutes.post('/alerts_id', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    Alert.findOne({_id: req.body.alert_id}, function(err, alert) {
      if (err) throw err;
      if (!alert) {
        return res.status(403).send({success: false, msg: 'Authentication failed. Alert not found.'});
      } else {
        return res.json({success: true, msg: 'Alert', alert:alert});
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});


//Actualizar informacion del usuario
apiRoutes.post('/update_user', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);

    User.findById({_id: decoded._id}, function(err, user) {
      if (err) throw err;

      if (!user) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found.'});
      } else {
        if (req.body.user_name)   user.user_name    = req.body.user_name;
        if (req.body.first_name)  user.first_name   = req.body.first_name;
        if (req.body.last_name)   user.last_name    = req.body.last_name;
        if (req.body.image)       user.image        = req.body.image;
        if (req.body.address)     user.address      = req.body.address;
        if (req.body.lat)         user.lat          = req.body.lat;
        if (req.body.log)         user.log          = req.body.log;
        if (req.body.phone)       user.phone        = req.body.phone;
        if (req.body.code_postal)       user.code_postal        = req.body.code_postal;
        user.save(function(err){
          if (err) throw err;
          return res.json({success: true, msg: 'User ' + user.user_name + ' successfully updated!'});
        });        
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

//Eliminar food 
apiRoutes.post('/deleted_food', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    if (req.body.food_id)
      Food.findOneAndRemove({_id: req.body.food_id}, function(err){
        if (err) {
          res.json({succes: false, msg: 'Error deleting food!'});
        } else {
          res.json({succes: true, msg: 'Successful deleting food!'});
        }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});



// apiRoutes.post('/send_alert', passport.authenticate('jwt', {session: false}), function(req, res) {
//   var token = getToken(req.headers);
//   if (token) {
      // var decoded = jwt.decode(token, config.secret);

//   } else {
//     return res.status(403).send({success: false, msg: 'No token provided.'});
//   }
// });



getToken = function(headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};


apiRoutes.get('/foods', function(req, res) {
  Food.find(function(err, food) {
    if (err) throw err;

    if (!food) {
      return res.status(403).send({success: false, msg: 'Authentication failed. Food not found.'});
    } else {
      return res.json({success: true, msg: 'Foods ', Foods: food});
    }
  });
});


//listar alimentos por usuario
apiRoutes.post('/foods_user', function(req, res) { 
  Food.find({user_id: req.body.user_id},function(err, food) {
    if (err) throw err;

    if (!food) {
      return res.status(403).send({success: false, msg: 'Authentication failed. Food not found.'});
    } else {
      return res.json({success: true, msg: 'Foods ', Foods: food});
    }
  });
});

//listar aliemnto por food_id
apiRoutes.post('/food/', function(req, res) { 
  Food.findOne({_id: req.body.food_id},function(err, food) {
    if (err) throw err;

    if (!food) {
      return res.status(403).send({success: false, msg: 'Authentication failed. Food not found.'});
    } else {
      return res.json({success: true, msg: 'Foods ', Food: food});
    }
  });
});

apiRoutes.post('/addFood', passport.authenticate('jwt', {session: false}), function(req, res) {
  var fs = require('fs')
  console.log(req)
  console.log(req.files)
  var token = getToken(req.headers);
  var path = req.files.file.path;
  var type = req.files.file.name.split(".");
  var nameCrypto = encriptar(req.files.file.name, Moment().tz('America/Bogota').format()) + "." + type[1];
  var newPath = './images/'+ nameCrypto;
  var is = fs.createReadStream(path)
  var os = fs.createWriteStream(newPath)

  is.pipe(os)
   is.on('end', function() {
      //eliminamos el archivo temporal
      fs.unlinkSync(path)
   })

  if (token) {
    var decoded = jwt.decode(token, config.secret);

    if (!req.body.name) {
      res.json({succes: false, msg: 'Please enter name'});
    } else {
      var newFood = new Food({
        name: req.body.name,
        peso: req.body.peso,
        description: req.body.description,
        user_id: decoded._id,
        expires: req.body.expires,
        type: req.body.type,
        image: nameCrypto,
        create: Moment().tz('America/Bogota').format(),
	      lat: req.body.lat,
        lng: req.body.lng
      });
      newFood.save(function(err) {
        if (err) {
          res.json({succes: false, msg: 'Error to create Food'});
        } else {
          res.json({succes: true, msg: 'Successful created Food!'});
        }
      });
    }
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});

//Actualizar informacion del usuario
apiRoutes.post('/update_food', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);

    Food.findOne({_id: req.body.food_id},function(err, food) {
      if (err) throw err;

      if (!food) {
        return res.status(403).send({success: false, msg: 'Food not found.'});
      } else {
        if (req.body.name)   food.name    = req.body.name;
        if (req.body.peso)  food.peso   = req.body.peso;
        if (req.body.description)   food.description    = req.body.description;
        if (req.body.image)       food.image        = req.body.image;
        if (req.body.type)     food.type      = req.body.type;
        if (req.body.lat)         food.lat          = req.body.lat;
        if (req.body.lng)         food.lng          = req.body.lng;
        if (req.body.expires)       food.phone        = req.body.expires;
        if (req.body.state)       food.state        = req.body.state;
        food.save(function(err){
          if (err) throw err;
          return res.json({success: true, msg: 'food ' + food.food_name + ' successfully updated!'});
        });        
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided.'});
  }
});




app.use('/api', apiRoutes);

// Start the server
app.listen(port);
console.log('There will be dragons: http://localhost:' + port);

function encriptar(user, pass) {
   var crypto = require('crypto')
   // usamos el metodo CreateHmac y le pasamos el parametro user y actualizamos el hash con la password
   var hmac = crypto.createHmac('sha1', user).update(pass).digest('hex')
   return hmac
}

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

process.env.TZ = 'America/Bogota';
// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// log to console
app.use(morgan('dev'));

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
      lat: '',
      log: '',

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
          res.json({success: true, token: 'JWT ' + token});
        } else {
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
    User.findOne({
      _id: decoded._id
    }, function(err, user) {
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
apiRoutes.get('/alerts', passport.authenticate('jwt', {session: false}), function(req, res) {
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

//Funcion para enviar alerta a un usuario sobre el alimento. 
apiRoutes.post('/send_alert', passport.authenticate('jwt', {session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    
    var new_alert = new Alert({
      food_id: req.body.food_id,
      sender_id: decoded._id,
      user_id: req.body.user_id,
      message: req.body.message
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
  Food.findOne({user_id: req.body.user_id},function(err, food) {
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
  var token = getToken(req.headers);
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
        image: req.body.image,
        create: Moment().tz('America/Bogota').format()
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





app.use('/api', apiRoutes);

// Start the server
app.listen(port);
console.log('There will be dragons: http://localhost:' + port);

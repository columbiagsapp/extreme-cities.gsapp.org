
/**
 * Module dependencies.
 */

var express = require('express')
  , engine = require('ejs-locals')
  , routes = require(__dirname + '/routes/router')
  //, user = require(__dirname + '/routes/user')
  , http = require('http')
  , path = require('path')
  , flash = require('connect-flash')
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy;

/////// SET UP DATABASE CONNECTION WITH MONGOOSE ///////
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/extremecities');
var Schema = mongoose.Schema;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('opened extremecities db with mongoose!');
});





var UserSchema = new Schema({
  name:  String,
  username: String,
  role: String,
  created: { type: Date, default: Date.now },
  last_login: { type: Date, default: Date.now }
}, { 
  autoIndex: false
});

var User = mongoose.model('User', UserSchema);





function updateLastLogin(id, fn){
  var timestamp = new Date().getTime();

  User.update({ 'id': id }, { 'last_login': timestamp }, function(err, user) {
    if(err){
      fn(new Error('User ' + id + ' does not exist'));
    }else{
      fn(null, user);
    }
  });//end update
}


function findById(id, fn) {

  User.findOne({ 'id': id }, function(err, user){
    if(err){
      fn(new Error('User ' + id + ' does not exist'));
    }else{
      fn(null, user);
    }
  });

}

function findByUsername(username, fn) {

  User.findOne({ 'username': username }, function(err, user){
    if(err){
      return fn(null, null);
    }else{  
      if(typeof user === 'undefined'){
        return fn(null, null);
      }else{
        return fn(null, user);
      }
    }
  });

}

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});

// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        return done(null, user);
      })
    });
  }
));
//end temp


var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 2702);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.engine('ejs', engine);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('urbanextremity'));
  app.use(express.session({ secret: 'ytic' }));
  
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
  //set up serving of static files from project directory
  app.use('/views/templates', express.static(__dirname + '/views/templates'));


  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);

});

app.configure('development', function(){
  app.use(express.errorHandler());
});


//Login
app.get('/account', ensureAuthenticated, function(req, res){
  res.render('authentication/account', { user: req.user });
});


app.get('/login', function(req, res){
  res.render('login', { title: 'Login', user: req.user, message: req.session.messages });
});

app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {

    updateLastLogin(req.user.id, function(err, user){
      if(err){
        console.log('app.js::Error: User last_login not set');
      }
      res.redirect('/');
    });

    
  });


app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}



//API
app.get('/api*', routes.get);
app.post('/api*', ensureAuthenticated, routes.post);
app.put('/api*', ensureAuthenticated, routes.put);
app.delete('/api*', ensureAuthenticated, routes.delete);

//static pages
app.get('/', routes.get);
app.get('/hypotheses*', routes.get);
app.get('/about*', routes.get);
app.get('/building-megalopolis*', routes.get);

//admin
app.get('/admin*', routes.get);
app.post('/admin*', ensureAuthenticated, routes.post);
app.put('/admin*', ensureAuthenticated, routes.put);
app.delete('/admin*', ensureAuthenticated, routes.delete);


//export app for the mail server.js server
exports.app = app;

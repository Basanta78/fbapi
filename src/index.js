import 'babel-polyfill';

import './env';
import './db';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import express from 'express';
import routes from './routes';
import passport from "passport";
import favicon from 'serve-favicon';
import logger from './utils/logger';
import bodyParser from 'body-parser';
import compression from 'compression';
import json from './middlewares/json';
import config from '../configuration/config';
import * as errorHandler from './middlewares/errorHandler';
let FacebookStrategy  =     require('passport-facebook').Strategy;

const app = express();
let access_token = null;
let user_id = null;
/*config is our configuration variable.*/
passport.use(new FacebookStrategy({
  clientID: config.facebook_api_key,
  clientSecret:config.facebook_api_secret ,
  callbackURL: config.callback_url,
  profileFields: ['email','first_name','last_name','gender','link','taggable_friends'],
  profileURL: 'https://graph.facebook.com/v2.10/me',
  authorizationURL: 'https://www.facebook.com/v2.10/dialog/oauth',
  tokenURL: 'https://graph.facebook.com/v2.10/oauth/access_token',

  // profileFields: ['taggable_friends.limit(5)','email']
},

(accessToken, refreshToken, profile, done)=> {
  
  process.nextTick(()=> {
    access_token = accessToken;
    user_id = profile.id
    console.log("profile user", profile)
    console.log("accessToken",accessToken)
   
    //Check whether the User exists or not using profile.id
    if(config.use_database==='true')
    {
       //Further code of Database.
    }
    return done(null, profile);
  });
}
));
// Passport session setup.
passport.serializeUser((user, done) => {
  done(null, user);
  });
  
  passport.deserializeUser((obj, done) => {
  done(null, obj);
  });

const APP_PORT =
  (process.env.NODE_ENV === 'test' ? process.env.TEST_APP_PORT : process.env.APP_PORT) || process.env.PORT || '3000';
const APP_HOST = process.env.APP_HOST || '0.0.0.0';

app.set('port', APP_PORT);3000
app.set('host', APP_HOST);

app.locals.title = process.env.APP_NAME;
app.locals.version = process.env.APP_VERSION;

app.use(favicon(path.join(__dirname, '/../public', 'favicon.ico')));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(errorHandler.bodyParser);
app.use(json);
app.use(passport.initialize());
app.use(passport.session());

// Everything in the public folder is served as static content
app.use(express.static(path.join(__dirname, '/../public')));

// API Routes

app.use('/api', routes);
app.get('/', (req, res)=> {
  res.send("Logged in");
});
app.get('/account', ensureAuthenticated, (req, res)=> {
  res.json ({ user: req.user });
});
//Passport Router
app.get('/auth/facebook', passport.authenticate('facebook',{ scope: ['user_friends','email'] }));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { 
       successRedirect : '/', 
       failureRedirect: '/login' 
  }),
  (req, res)=> {
    console.log(res);
    res.redirect('/');
  });
app.get('/logout',(req, res)=> {
  req.logout();
  res.redirect('/');
});
app.get('/friends', (req, res)=> {
  console.log(access_token);
 getFbData(access_token, '/me/friends', (data)=> {
  console.log(data);
})
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
const getFbData = (accessToken, apiPath, callback)=> {
  var options = {
      host: 'graph.facebook.com',
      port: 443,
      path: '/v2.9/' + user_id + '/taggable_friends?access_token=' + accessToken, 
      method: 'GET'
  };

  var buffer = ''; //this buffer will be populated with the chunks of the data received from facebook
  var request = https.get(options, (result)=> {
      result.setEncoding('utf8');
      result.on('data', (chunk)=> {
          buffer += chunk;
      });

      result.on('end', () =>{
          callback(buffer);
      });
  });

  request.on('error', (e)=> {
      console.log('error from facebook.getFbData: ' + e.message)
  });

  request.end();
}


// Error Middlewares
app.use(errorHandler.genericErrorHandler);
app.use(errorHandler.methodNotAllowed);
app.listen(app.get('port'), app.get('host'), () => {
  logger.log('info', `Server started at http://${app.get('host')}:${app.get('port')}`);
});

export default app;

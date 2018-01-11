import passport from "passport";
import { Router } from 'express';
import HttpStatus from 'http-status-codes';
import * as userService from '../services/userService';
import { findUser, userValidator } from '../validators/userValidator';

const router = Router();

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}
//Router code
router.get('/', (req, res) =>{
  res.json({ user: req.user });
});

router.get('/account', ensureAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

//Passport Router
router.get('/auth/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { 
       successRedirect : '/', 
       failureRedirect: '/login' 
  }),
  (req, res) => {
    console.log("response");
    res.redirect('/');
  });
router.get('/logout', (req, res) =>{
  req.logout();
  res.redirect('/');
});

export default router;
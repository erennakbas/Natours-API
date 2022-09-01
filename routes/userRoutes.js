const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router
  .route('/signup')
  .post(authController.getSafeFields, authController.signup);

router.route('/login').post(authController.login);

router.route('/forgot-password').post(userController.forgotPassword);

router.route('/reset-password/:token').patch(userController.resetPassword);

router
  .route('/delete-myself')
  .delete(authController.checkJWT, userController.deleteMyself);

router
  .route('/update-myself')
  .patch(authController.checkJWT, userController.updateMyself);

router
  .route('/')
  .get(authController.checkJWT, userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(
    authController.checkJWT,
    authController.restrictTo('admin', 'lead-guide'),
    userController.deleteUser
  );

module.exports = router;

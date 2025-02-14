import express from 'express';
import { registerUser, loginUser, userCredits, paymentRazorpay, verifyRazorpay, loadUsers, loadTransactions, deleteUser, updateUserProfile } from '../controllers/userController.js'
import userAuth from '../middlewares/auth.js';
import multerMiddileware from '../middlewares/multer.js';






const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/credits', userAuth, userCredits)
userRouter.post('/pay-razor', userAuth, paymentRazorpay)
userRouter.post('/verify-razor', verifyRazorpay)

userRouter.get('/users', userAuth, loadUsers);
userRouter.get('/transactions', userAuth, loadTransactions);

userRouter.delete('/delete/:id', userAuth, deleteUser);
// userRouter.put('/update-profile', userAuth, multerMiddileware.single('profileImage'), updateUserProfile);
userRouter.put('/update-profile', userAuth,  updateUserProfile);






export default userRouter
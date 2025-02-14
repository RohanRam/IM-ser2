import userModel from "../models/userModel.js";
// import bcrypt from "bcrypt";
import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";
import razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";

import fs from 'fs';
import path from 'path';



const registerUser = async (req, res) => {

    try {
        const { name, email, password , gender } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill in all fields" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            name,
            email,
            password: hashedPassword,
            gender: gender
        }

        const newUser = new userModel(userData);
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.json({ success: true, token, user: { name: user.name } })




    } catch (error) {

        console.log(error);
        res.json({ success: false, message: error.message })


    }

}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User Doesn't Exist!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            res.json({ success: true, token, user: { name: user.name, role: user.role , gender:user.gender} })

        }
        else {
            return res.status(400).json({ message: "Invalid Credentials!" });
        }

    } catch (err) {
        console.log(err);
    }
}

const userCredits = async (req, res) => {

    try {

        const { userId } = req.body;

        const user = await userModel.findById(userId);
        res.json({ success: true, credits: user.creditBalance, user: { name: user.name , email: user.email , gender:user.gender , role:user.role } });


    } catch (error) {

        console.log(error);
        res.json({ success: false, message: error.message })

    }

}

const razorpayInstance = new razorpay({
    key_id: process.env.RAZOR_KEY_ID,
    key_secret: process.env.RAZOR_KEY_SECRET
})


const paymentRazorpay = async (req, res) => {

    try {

        const { userId, planId } = req.body
        const userData = await userModel.findById(userId)
        if (!userData || !planId) {
            return res.json({ success: false, message: "Missing Details" })
        }

        let credits, plan, amount, date

        switch (planId) {
            case 'Basic':
                plan = 'Basic'
                credits = 30
                amount = 29
                break;

            case 'Advanced':
                plan = 'Advanced'
                credits = 70
                amount = 59
                break;

            case 'Business':
                plan = 'Business'
                credits = 200
                amount = 99
                break;

            default:
                return res.json({ success: false, message: "Invalid Plan" })

        }

        date = Date.now()

        const transactionData = {
            userId, plan, amount, credits, date
        }

        const newTransaction = await transactionModel.create(transactionData)


        const options = {
            amount: amount * 100,
            currency: process.env.CURRENCY,
            receipt: newTransaction._id
        }

        await razorpayInstance.orders.create(options, (error, order) => {
            if (error) {
                console.log(error);
                return res.json({ success: false, message: error })

            }
            res.json({ success: true, order })

        })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })

    }

}

const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if (orderInfo.status === 'paid') {
            const transactionData = await transactionModel.findById(orderInfo.receipt)
            if (transactionData.payment) {

                return res.json({ success: false, message: "Payment Failed" })
            }

            const userData = await userModel.findById(transactionData.userId)

            const creditBalance = userData.creditBalance + transactionData.credits
            await userModel.findByIdAndUpdate(userData._id, { creditBalance })

            await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true })

            res.json({ success: true, message: "Payment Successfull" })
        }
        else {
            res.json({ success: false, message: "Payment Failed" })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const loadUsers = async (req, res) => {
    try {
        const users = await userModel.find().select("-password"); // Excluding password
        res.json({ success: true, users });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const loadTransactions = async (req, res) => {
    try {
        const transactions = await transactionModel.find().populate("userId", "name email");
        res.json({ success: true, transactions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userModel.findByIdAndDelete(userId);

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found!" });
        }

        res.json({ success: true, message: "User deleted successfully!" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { userId, name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        // Find user in DB
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }


        // Update user details
        user.name = name;
        user.email = email;

        await user.save();

        res.json({ success: true, user: { name: user.name, email: user.email,  gender:user.gender , role:user.role} });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Profile update failed!" });
    }
};


export { registerUser, loginUser, userCredits, paymentRazorpay, verifyRazorpay, loadUsers, loadTransactions, deleteUser, updateUserProfile };

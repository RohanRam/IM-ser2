import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name: {type:String, required: true},
    email: {type:String, required: true, unique: true},
    password: {type:String, required: true},
    creditBalance: {type:Number, required: true , default: 5},
    role: {type:String, required: true, default: 'user'},
    gender:{type:String , required:true , default: 'male'},
    // profileImage:{type:String}
})

const userModel =mongoose.model.user || mongoose.model('user', userSchema); 

export default userModel;
import mongoose from 'mongoose'

const onlineUserSchema = new mongoose.Schema({
    ID: {
        type:String,
        required: true
    },
    name: {
        type:String,
        required: true
    }
},{ timestamps: true });

const  onlineUserModal = mongoose.model('onlineuser', onlineUserSchema);
export default onlineUserModal;
import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
    from:{
        type:String,
        required: true
    },
    to: {
        type:String,
        required: true
    },
    message:{
        type:String,
        required: true 
    },
    unread: {
        type:Boolean,
        required: true,
        default: true
    },
    date: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true
    }
},{ timestamps: true });


const  chatModal = mongoose.model('chats', chatSchema);
export  {chatSchema,chatModal};
import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, 
    ref : 'user'
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref : 'comment'
    }],
  like: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref : 'user'  
    }]
});

const  postModal = mongoose.model('post', postSchema);
export default postModal;
import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, 
    ref : 'user'
  },
  post: {
    type: mongoose.Schema.Types.ObjectId, 
    ref : 'post' 
  },
  like: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref : 'user'  
    }]
});

const commentModal = mongoose.model('comment', commentSchema);
export default commentModal;
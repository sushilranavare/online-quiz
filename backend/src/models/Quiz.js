import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Quiz name is required'],
      trim: true,
      unique: true,
      minlength: [3, 'Quiz name must be at least 3 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Quiz = mongoose.model('Quiz', quizSchema);
export { Quiz };
export default Quiz;

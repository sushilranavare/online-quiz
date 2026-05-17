import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz is required']
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length === 4 && value.every(Boolean);
        },
        message: 'Each question must have exactly 4 non-empty options'
      }
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required']
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

questionSchema.pre('validate', function validateCorrectAnswer(next) {
  if (this.options && !this.options.includes(this.correctAnswer)) {
    return next(new Error('Correct answer must match one of the options'));
  }

  return next();
});

const Question = mongoose.model('Question', questionSchema);
export { Question };
export default Question;

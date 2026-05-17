import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedAnswer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    remainingTimeSeconds: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const scoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    quizName: {
      type: String,
      default: 'Timed Quiz'
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 6,
      max: 10
    },
    timeBonus: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    questionTimeSeconds: {
      type: Number,
      default: 30
    },
    totalRemainingTimeSeconds: {
      type: Number,
      default: 0
    },
    answers: {
      type: [answerSchema],
      required: true
    }
  },
  { timestamps: true }
);

scoreSchema.index({ user: 1, createdAt: -1 });
scoreSchema.index({ score: -1, createdAt: -1 });
scoreSchema.index({ quizId: 1, score: -1 });

const Score = mongoose.model('Score', scoreSchema);
export { Score };
export default Score;

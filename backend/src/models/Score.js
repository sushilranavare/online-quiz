import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    username: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: [true, 'Score is required'],
        min: 0
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: [true, 'Category is required']
    },
    answers: {
        type: [{
            questionId: mongoose.Schema.Types.ObjectId,
            selectedOption: Number,
            isCorrect: Boolean
        }],
        default: []
    },
    timeSpent: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

scoreSchema.index({ user: 1, completedAt: -1 });
scoreSchema.index({ score: -1 });
scoreSchema.index({ category: 1, score: -1 });

export default mongoose.model('Score', scoreSchema);
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        enum: ['Geography', 'Science', 'History', 'Sports', 'Entertainment', 'Technology']
    },
    questionText: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true
    },
    options: {
        type: [String],
        required: [true, 'Options are required'],
        validate: {
            validator: function(v) {
                return v.length === 4;
            },
            message: 'Must have exactly 4 options'
        }
    },
    correctOption: {
        type: Number,
        required: [true, 'Correct option index is required'],
        min: 0,
        max: 3
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

questionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

questionSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

export default mongoose.model('Question', questionSchema);
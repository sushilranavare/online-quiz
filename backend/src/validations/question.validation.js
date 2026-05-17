export function validateQuestion(req, res, next) {
  const { quizId, questionText, options, correctAnswer } = req.body;
  const errors = [];

  if (!quizId) errors.push('Quiz is required');
  if (!questionText || questionText.trim().length < 5) {
    errors.push('Question text must be at least 5 characters');
  }
  if (!Array.isArray(options) || options.length !== 4 || options.some((option) => !option.trim())) {
    errors.push('Exactly 4 non-empty options are required');
  }
  if (!correctAnswer || !options?.includes(correctAnswer)) {
    errors.push('Correct answer must match one of the options');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, error: errors.join(', ') });
  }

  req.body.questionText = questionText.trim();
  req.body.options = options.map((option) => option.trim());
  req.body.correctAnswer = correctAnswer.trim();
  req.body.isActive = req.body.isActive === true;

  return next();
}

export function validateBulkQuestions(req, res, next) {
  const { quizId, questions } = req.body;

  if (!quizId) {
    return res.status(400).json({ success: false, error: 'Quiz is required' });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, error: 'Questions array is required' });
  }

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];

    if (!question.questionText || !Array.isArray(question.options) || question.options.length !== 4) {
      return res.status(400).json({ success: false, error: `Invalid question at index ${index}` });
    }

    if (!question.options.includes(question.correctAnswer)) {
      return res.status(400).json({ success: false, error: `Correct answer must match one option at index ${index}` });
    }
  }

  return next();
}

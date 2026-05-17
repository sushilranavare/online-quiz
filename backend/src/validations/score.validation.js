export function validateScoreSubmission(req, res, next) {
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ success: false, error: 'Answers array is required' });
  }

  if (answers.length < 6 || answers.length > 10) {
    return res.status(400).json({ success: false, error: 'Quiz submission must contain 6 to 10 answers' });
  }

  for (const answer of answers) {
    if (!answer.questionId || !answer.selectedAnswer) {
      return res.status(400).json({ success: false, error: 'Each answer needs questionId and selectedAnswer' });
    }
  }

  return next();
}

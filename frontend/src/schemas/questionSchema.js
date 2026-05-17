export function validateQuestionForm(question) {
  const errors = {};

  if (!question.questionText || question.questionText.trim().length < 5) {
    errors.questionText = 'Question text must be at least 5 characters';
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    errors.options = 'Exactly 4 options are required';
  }

  if (!question.correctAnswer) {
    errors.correctAnswer = 'Correct answer is required';
  }

  return errors;
}

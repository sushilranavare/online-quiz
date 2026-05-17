import { Link } from 'react-router-dom';

// Category-based question management has been removed.
// Questions are now managed inside each quiz from AdminQuizzesPage.
export default function AdminQuestionsPage() {
  return (
    <section className="card">
      <h2>Question Management Moved</h2>

      <p>
        Questions are no longer managed using categories. In the Timed Questions
        variation, each question belongs to a quiz through <code>quizId</code>.
      </p>

      <p>
        Please use the Quiz Management page to create a quiz, select it, and add
        or import questions inside that quiz.
      </p>

      <Link className="button-link" to="/admin/quizzes">
        Go to Quiz Management
      </Link>
    </section>
  );
}

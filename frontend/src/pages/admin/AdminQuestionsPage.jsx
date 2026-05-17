import { Link } from 'react-router-dom';

export default function AdminQuestionsPage() {
  return (
    <section className="card">
      <h2>Question Management Moved</h2>
      <p>Questions are managed inside each quiz. Open Quiz Management to create a quiz and add questions inside it.</p>
      <Link className="button-link" to="/admin/quizzes">Go to Quiz Management</Link>
    </section>
  );
}

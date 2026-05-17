#!/usr/bin/env bash
set -e

# Member 3 category-removal update
# Converts Member 3 pages from category-based logic to our latest timed quiz structure:
# quizId, questionText, options, correctAnswer, isActive
#
# Run from project root:
#   cd ~/Downloads/online-quiz-game-full-working
#   bash apply-member3-remove-category-logic.sh

echo "Updating Member 3 files to remove category-based logic..."

mkdir -p backend/src/controllers backend/src/routes backend/src/validations
mkdir -p frontend/src/pages/admin frontend/src/pages frontend/src/api frontend/src/components/leaderboard frontend/src/components/attempts

cat > backend/src/controllers/leaderboard.controller.js <<'EOF'
import { Score } from '../models/Score.js';
import { ok } from '../utils/apiResponse.js';

// Leaderboard for Timed Questions variation.
// Uses saved score attempts from Score collection.
// Higher score comes first. If scores are equal, newer attempts appear first.
export async function getLeaderboard(req, res) {
  const leaderboard = await Score.find()
    .sort({ score: -1, createdAt: -1 })
    .limit(20)
    .select('username correctAnswers totalQuestions timeBonus score createdAt');

  return ok(res, {
    leaderboard
  });
}
EOF

cat > backend/src/routes/leaderboard.routes.js <<'EOF'
import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getLeaderboard));

export default router;
EOF

cat > frontend/src/api/leaderboardApi.js <<'EOF'
import api from './axios';

export const leaderboardApi = {
  getLeaderboard: () => api.get('/leaderboard')
};
EOF

cat > frontend/src/components/leaderboard/LeaderboardTable.jsx <<'EOF'
export default function LeaderboardTable({ leaderboard }) {
  if (!leaderboard.length) {
    return <p>No leaderboard attempts found yet.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Score</th>
            <th>Correct</th>
            <th>Time Bonus</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {leaderboard.map((attempt, index) => (
            <tr key={attempt._id}>
              <td>{index + 1}</td>
              <td>{attempt.username}</td>
              <td>{attempt.score}</td>
              <td>
                {attempt.correctAnswers} / {attempt.totalQuestions}
              </td>
              <td>+{attempt.timeBonus || 0}</td>
              <td>{new Date(attempt.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
EOF

cat > frontend/src/pages/LeaderboardPage.jsx <<'EOF'
import { useEffect, useState } from 'react';
import { leaderboardApi } from '../api/leaderboardApi';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await leaderboardApi.getLeaderboard();
        setLeaderboard(response.data.data.leaderboard || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <section className="card">
      <h2>Leaderboard</h2>

      <p>
        Ranking is based on the final timed quiz score. The score includes
        correct answers plus a small time bonus.
      </p>

      {loading && <p>Loading leaderboard...</p>}
      {error && <p className="error">{error}</p>}

      <LeaderboardTable leaderboard={leaderboard} />
    </section>
  );
}
EOF

cat > frontend/src/components/attempts/AttemptCard.jsx <<'EOF'
export default function AttemptCard({ attempt }) {
  return (
    <article className="quiz-admin-card">
      <div className="quiz-card-title-row">
        <h3>Score: {attempt.score}</h3>
        <span className="badge active">
          {attempt.correctAnswers} / {attempt.totalQuestions}
        </span>
      </div>

      <p>Time bonus: +{attempt.timeBonus || 0}</p>
      <p>
        Completed at:{' '}
        {attempt.createdAt ? new Date(attempt.createdAt).toLocaleString() : '-'}
      </p>

      {attempt.answers?.length > 0 && (
        <details>
          <summary>View submitted answers</summary>

          <ul>
            {attempt.answers.map((answer, index) => (
              <li key={`${answer.questionId?._id || answer.questionId}-${index}`}>
                <strong>
                  {answer.questionId?.questionText || `Question ${index + 1}`}:
                </strong>{' '}
                {answer.selectedAnswer}{' '}
                {answer.isCorrect ? '(Correct)' : '(Incorrect)'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
EOF

cat > frontend/src/pages/AttemptsPage.jsx <<'EOF'
import { useEffect, useState } from 'react';
import { scoreApi } from '../api/scoreApi';
import AttemptCard from '../components/attempts/AttemptCard';

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAttempts = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await scoreApi.getMyAttempts();
        setAttempts(response.data.data.attempts || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load attempts');
      } finally {
        setLoading(false);
      }
    };

    loadAttempts();
  }, []);

  return (
    <section className="card">
      <h2>My Attempts</h2>

      <p>
        This page shows your previous timed quiz attempts, including correct
        answers, time bonus, and final score.
      </p>

      {loading && <p>Loading attempts...</p>}
      {error && <p className="error">{error}</p>}

      <div className="quiz-card-grid">
        {attempts.map((attempt) => (
          <AttemptCard key={attempt._id} attempt={attempt} />
        ))}

        {!attempts.length && !loading && (
          <div className="empty-state">No attempts found yet.</div>
        )}
      </div>
    </section>
  );
}
EOF

cat > frontend/src/pages/admin/AdminQuestionsPage.jsx <<'EOF'
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
EOF

python3 - <<'PY'
from pathlib import Path
import re

# Remove old category Questions nav item if it exists.
navbar = Path("frontend/src/components/common/Navbar.jsx")
if navbar.exists():
    text = navbar.read_text()
    for pattern in [
        r'\s*<NavLink to="/admin/questions">Questions</NavLink>',
        r'\s*<Link to="/admin/questions">Questions</Link>',
        r'\s*<a href="/admin/questions">Questions</a>'
    ]:
        text = re.sub(pattern, '', text)

    # Add Quizzes link if admin questions was removed and quizzes link missing.
    if '/admin/quizzes' not in text and '/admin/dashboard' in text:
        text = text.replace(
            '<NavLink to="/admin/dashboard">Admin</NavLink>',
            '<NavLink to="/admin/dashboard">Admin</NavLink>\n          <NavLink to="/admin/quizzes">Quizzes</NavLink>'
        )

    navbar.write_text(text)

# Make sure App.jsx has AdminQuizzesPage route if the file exists.
app = Path("frontend/src/App.jsx")
if app.exists():
    text = app.read_text()

    if "AdminQuizzesPage" not in text:
        text = text.replace(
            "import AdminUsersPage from './pages/admin/AdminUsersPage';",
            "import AdminUsersPage from './pages/admin/AdminUsersPage';\nimport AdminQuizzesPage from './pages/admin/AdminQuizzesPage';"
        )

    if 'path="/admin/quizzes"' not in text:
        text = text.replace(
            '<Route path="/admin/questions" element={<AdminRoute><AdminQuestionsPage /></AdminRoute>} />',
            '<Route path="/admin/questions" element={<AdminRoute><AdminQuestionsPage /></AdminRoute>} />\n            <Route path="/admin/quizzes" element={<AdminRoute><AdminQuizzesPage /></AdminRoute>} />'
        )

    app.write_text(text)
PY

cat >> frontend/src/index.css <<'EOF'

/* Member 3 timed-quiz compatible pages */
details {
  margin-top: 12px;
}

details summary {
  cursor: pointer;
  font-weight: 600;
}

details ul {
  margin-top: 10px;
  padding-left: 20px;
}
EOF

echo "Member 3 category-removal update applied successfully."
echo ""
echo "Updated:"
echo "- LeaderboardPage.jsx"
echo "- AttemptsPage.jsx"
echo "- AdminQuestionsPage.jsx"
echo "- leaderboard controller/routes"
echo "- leaderboardApi"
echo "- AttemptCard and LeaderboardTable"
echo "- Navbar cleanup"
echo ""
echo "Next:"
echo "  git add ."
echo "  git commit -m \"Update Member 3 pages for timed quiz structure\""
echo "  git push origin main"

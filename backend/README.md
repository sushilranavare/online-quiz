# Backend API

This backend supports the Timed Questions quiz variation.

Main endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/quiz/available`
- `GET /api/quiz/:quizId`
- `POST /api/scores`
- `GET /api/scores/me`
- `GET /api/leaderboard`
- `GET /api/admin/quizzes`
- `POST /api/admin/quizzes`
- `GET /api/admin/questions?quizId=<id>`
- `POST /api/admin/questions`
- `POST /api/admin/questions/import`

Question structure:

```json
{
  "quizId": "QUIZ_ID",
  "questionText": "Question text",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "isActive": true
}
```

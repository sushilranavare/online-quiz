# Backend Structure

## Suggested API routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Quiz
- `GET /api/quiz/categories`
- `GET /api/quiz?category=MERN`

### Scores
- `POST /api/scores`
- `GET /api/scores/me`

### Leaderboard
- `GET /api/leaderboard`

### Admin Questions
- `GET /api/admin/questions`
- `POST /api/admin/questions`
- `PUT /api/admin/questions/:id`
- `DELETE /api/admin/questions/:id`
- `PATCH /api/admin/questions/:id/toggle`
- `POST /api/admin/questions/bulk-import`

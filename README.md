# Diviner Media — Intern LMS

A full-stack Learning Management System built for the Diviner Media internship program. Interns progress through structured courses with video lessons, voice-based assessments, portfolio submissions, and a doubt-raising system — all managed by admins through a dedicated control panel.

**Live URL:** https://lms.divinermedia.com

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Backend | Express.js 5, Node.js |
| Database | PostgreSQL via Neon (cloud) |
| ORM | Prisma 7 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Storage | Google Drive API (local disk fallback) |
| Email | Nodemailer (Gmail SMTP) |
| Notifications | Discord Webhooks |
| Validation | Zod |
| Security | Helmet, express-rate-limit, CORS whitelist |
| Hosting | Render (free tier) |

---

## Project Structure

```
LMS/
├── server/
│   └── src/
│       ├── index.js                  # Express server, middleware, routing
│       ├── db.js                     # Prisma client with PostgreSQL adapter
│       ├── middleware/
│       │   ├── auth.js               # JWT auth + admin guard
│       │   └── validate.js           # Zod request validation
│       ├── routes/
│       │   ├── auth.js               # Login, register, password reset
│       │   ├── courses.js            # Course CRUD
│       │   ├── modules.js            # Module CRUD
│       │   ├── lessons.js            # Lesson CRUD + progress tracking
│       │   ├── assessments.js        # Assessment CRUD + submissions
│       │   ├── doubts.js             # Doubt management
│       │   ├── proofs.js             # Portfolio proof management
│       │   ├── admin.js              # Admin utilities + reports
│       │   └── files.js              # Google Drive file streaming
│       └── utils/
│           ├── email.js              # Gmail SMTP integration
│           ├── drive.js              # Google Drive API
│           ├── discord.js            # Discord webhook notifications
│           └── seed.js               # Database seed script
├── client/
│   └── src/
│       ├── App.jsx                   # Router + auth provider
│       ├── api/axios.js              # Axios instance with token refresh
│       ├── contexts/AuthContext.jsx  # Auth state management
│       ├── components/               # Layout, ProtectedRoute, VoiceRecorder
│       └── pages/
│           ├── auth/                 # Login, Register, ForgotPassword, ResetPassword
│           ├── learner/              # Dashboard, CourseList, LessonViewer, AssessmentPage, Doubts, Proofs
│           └── admin/                # CourseManager, LessonForm, AssessmentReview, LearnerManager, Reports...
├── prisma/
│   ├── schema.prisma                 # Data models
│   └── migrations/                   # Migration history
├── package.json                      # Root scripts
├── render.yaml                       # Render deployment config
└── .env.example                      # Environment variable template
```

---

## Database Schema

### User
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | String | Unique |
| password | String | bcrypt hashed |
| name | String | |
| role | String | `admin` or `learner` |
| driveFolderId | String? | Personal Drive folder ID |
| isActive | Boolean | Account on/off switch |
| accessExpiry | DateTime? | Auto-revoke date |
| lastActiveAt | DateTime? | |

### Course → Module → Lesson
- **Course**: title, description, thumbnail, isPublished, sortOrder
- **Module**: belongs to Course, title, description, sortOrder
- **Lesson**: belongs to Module, videoUrl, notes, resources (JSON), unlockDate, isPublished, sortOrder

### Assessment → Question → Answer
- **Assessment**: linked to Lesson or Module, title, timeLimit, isPublished
- **Question**: type (`mcq`, `true_false`, `short_answer`, `long_answer`, `voice_note`, `file_upload`), options (JSON), correctAnswer
- **AssessmentSubmission**: status (`submitted` / `graded`), score, feedback
- **Answer**: content (text URL or JSON `{voiceUrl, text}`), type (`text`, `voice`, `voice_with_text`)

### Supporting Models
- **LessonProgress**: tracks `isCompleted`, `lastWatchedPos` per user per lesson
- **Doubt**: title, description, attachment, status, adminReply
- **PortfolioProof**: type (`file_upload`, `link`, `editable_file_link`), fileUrl, status, adminNote
- **Invite**: token-based invite system with expiry
- **PasswordReset**: token-based reset with expiry

---

## API Routes

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| GET | `/invite/:token` | Validate invite token |
| POST | `/register` | Register with invite token |
| POST | `/login` | Email/password login |
| POST | `/forgot-password` | Request password reset email |
| POST | `/reset-password` | Reset password with token |
| GET | `/me` | Get current user |
| POST | `/refresh` | Refresh JWT token |

### Courses — `/api/courses`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List courses (published only for learners) |
| POST | `/` | Create course with thumbnail (admin) |
| GET | `/:id` | Get course with modules and lessons |
| PUT | `/:id` | Update course (admin) |
| DELETE | `/:id` | Delete course (admin) |

### Modules — `/api/modules`
| Method | Path | Description |
|---|---|---|
| GET | `/:courseId` | List modules for a course |
| POST | `/` | Create module (admin) |
| PUT | `/:id` | Update module (admin) |
| DELETE | `/:id` | Delete module (admin) |

### Lessons — `/api/lessons`
| Method | Path | Description |
|---|---|---|
| GET | `/:moduleId` | List lessons with unlock status |
| POST | `/` | Create lesson (admin) |
| GET | `/detail/:id` | Get lesson detail + prev/next |
| PUT | `/:id` | Update lesson (admin) |
| DELETE | `/:id` | Delete lesson (admin) |
| POST | `/:id/progress` | Save video position + completion |
| GET | `/:id/progress` | Get progress for a lesson |

### Assessments — `/api/assessments`
| Method | Path | Description |
|---|---|---|
| GET | `/:targetId?type=lesson` | List assessments by lesson/module |
| POST | `/` | Create assessment with questions (admin) |
| GET | `/detail/:id` | Get assessment + questions |
| PUT | `/:id` | Update assessment (admin) |
| DELETE | `/:id` | Delete assessment (admin) |
| POST | `/:id/submit` | Submit answers + voice files (learner) |
| GET | `/:id/submissions` | Get submissions |
| PUT | `/submissions/:id/review` | Grade submission (admin) |

### Doubts — `/api/doubts`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List doubts with filters |
| POST | `/` | Raise new doubt |
| GET | `/:id` | Get doubt detail |
| PUT | `/:id/reply` | Admin reply |
| PUT | `/:id/status` | Update status |

### Portfolio Proofs — `/api/proofs`
| Method | Path | Description |
|---|---|---|
| GET | `/` | List proofs |
| POST | `/` | Upload proof (file or link) |
| GET | `/:id` | Get proof detail |
| PUT | `/:id/review` | Review proof (admin) |

### Admin — `/api/admin`
| Method | Path | Description |
|---|---|---|
| POST | `/invites` | Send invite email |
| GET | `/invites` | List all invites |
| DELETE | `/invites/:id` | Delete invite |
| GET | `/learners` | List all learners |
| PUT | `/learners/:id` | Update learner access |
| GET | `/stats` | Dashboard stats |
| GET | `/reports/overview` | Full overview report |
| GET | `/reports/weak-topics` | Lessons sorted by doubt count |
| GET | `/reports/learner-progress` | Per-learner progress |

### Files — `/api/files`
| Method | Path | Description |
|---|---|---|
| GET | `/:fileId` | Stream file from Google Drive |

---

## Frontend Pages

### Learner
| Route | Page | Description |
|---|---|---|
| `/dashboard` | Dashboard | Course progress overview |
| `/courses` | CourseList | Browse published courses |
| `/courses/:id` | CourseDetail | Modules and lessons view |
| `/lessons/:id` | LessonViewer | Video player with notes and resources |
| `/assessments/:id` | AssessmentPage | Voice-based assessment with timer |
| `/doubts` | DoubtList | View and filter own doubts |
| `/doubts/new` | DoubtForm | Raise a new doubt |
| `/proofs` | ProofList | Portfolio / work submissions |
| `/proofs/new` | ProofForm | Upload new proof of work |

### Admin
| Route | Page | Description |
|---|---|---|
| `/dashboard` | AdminDashboard | Stats and quick links |
| `/admin/courses` | CourseManager | List all courses |
| `/admin/courses/new` | CourseForm | Create course |
| `/admin/courses/:id` | AdminCourseDetail | Manage modules and lessons |
| `/admin/courses/:id/edit` | CourseForm | Edit course |
| `/admin/modules/:courseId/new` | ModuleForm | Add module to course |
| `/admin/lessons/:moduleId/new` | LessonForm | Add lesson with unlock schedule |
| `/admin/lessons/:id/edit` | LessonForm | Edit lesson |
| `/admin/assessments/new` | AssessmentForm | Create assessment |
| `/admin/assessments/:id/edit` | AssessmentForm | Edit assessment |
| `/admin/doubts` | DoubtManager | Reply to learner doubts |
| `/admin/proofs` | ProofReview | Approve or reject proof submissions |
| `/admin/learners` | LearnerManager | Activate/deactivate accounts, set expiry |
| `/admin/invites` | InviteManager | Send and track invites |
| `/admin/reports` | Reports | Analytics and weak topic tracking |

---

## Key Features

### Lesson Unlock Logic
Lessons unlock sequentially with two gates:
1. **Time gate** — `unlockDate` must have passed (supports Mon–Fri 10 AM scheduling)
2. **Assessment gate** — previous lesson's assessment must be submitted

### Assessment Format
- Every question requires a **voice note** (mandatory)
- Optional text field for additional written answer
- Voice submissions always require manual admin review (no auto-grading)
- MCQ/true-false questions only auto-grade when answered as text

### Google Drive Integration
- On learner registration → creates `{Name} Work` subfolder inside `Team Documents` on Drive
- All proof uploads and voice recordings go to the learner's personal Drive folder
- Falls back to local disk with Discord alert if Drive is unavailable

### Discord Notifications
Alerts sent for:
- New doubt raised
- Assessment submitted
- Portfolio proof uploaded
- Google Drive upload failure
- Google Drive folder creation failure on registration

---

## Environment Variables

```env
# Core
PORT=5000
NODE_ENV=production
DATABASE_URL=                        # Neon PostgreSQL connection string
JWT_SECRET=                          # Long random string
FRONTEND_URL=https://lms.divinermedia.com
UPLOAD_DIR=./uploads

# Email (Gmail SMTP)
EMAIL_USER=                          # Gmail address
EMAIL_PASS=                          # Gmail app password
EMAIL_FROM=                          # Sender display address

# Google Drive
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=

# Discord
DISCORD_WEBHOOK_URL=
```

---

## Local Development

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Set up environment
cp .env.example .env
# Fill in .env values

# Push schema to database
npx prisma db push

# Run dev server (Express + Vite concurrently)
npm run dev
```

App runs at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## Deployment (Render)

The `render.yaml` at the root configures deployment automatically.

1. Push to GitHub → connect repo on [render.com](https://render.com)
2. Add all environment variables in the Render dashboard
3. Render builds with: `npm install && npm run build && npx prisma generate`
4. Render starts with: `node --experimental-strip-types server/src/index.js`
5. Add `lms.divinermedia.com` as a custom domain → add CNAME in your DNS provider

**Keep-alive**: Add `https://lms.divinermedia.com/api/health` to [UptimeRobot](https://uptimerobot.com) (5-minute interval, free) to prevent the free Render service from sleeping.

---

## Security

- All routes protected by JWT authentication
- Admin routes additionally guarded by role check
- Rate limiting: 200 req/15min general, 15 req/15min on login
- Helmet security headers on all responses
- CORS whitelist: `lms.divinermedia.com` and localhost only
- Passwords hashed with bcrypt (10 rounds)
- Invite-only registration (no open sign-up)
c
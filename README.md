# Quiz Competition Web Application

A modern, interactive team-based quiz competition platform built with React, TypeScript, and TailwindCSS featuring glassmorphism design.

## Features

### Core Functionality
- **25 Questions**: Interactive grid of questions (Q1-Q25) with visual status indicators
- **Team-Based Competition**: 6 teams (Groups A-F) competing with coin-based scoring
- **Multi-Step Flow**: Question selection → Team selection → Password authentication → Answer submission
- **Real-time Scoreboard**: Live team rankings with coin balances
- **2-Hour Timer**: Countdown timer with visual urgency indicators
- **Hint System**: Optional hints with coin deduction confirmation

### Design Features
- **Glassmorphism UI**: Frosted glass cards with backdrop blur effects
- **Gradient Backgrounds**: Smooth color transitions with animated elements
- **Smooth Animations**: Hover effects, transitions, and Motion animations
- **Responsive Design**: Mobile and desktop optimized
- **Visual Feedback**: Color-coded question status (attempted/correct/incorrect)

## Project Structure

```
/src
├── /app
│   ├── App.tsx                    # Main application component
│   ├── types.ts                   # TypeScript interfaces
│   ├── /components
│   │   ├── MainScreen.tsx         # Question grid + scoreboard
│   │   ├── QuestionCard.tsx       # Individual question card
│   │   ├── Scoreboard.tsx         # Team rankings panel
│   │   ├── TeamSelection.tsx      # Team selection screen
│   │   ├── PasswordAuth.tsx       # Password authentication
│   │   ├── AnswerScreen.tsx       # Answer submission + hint system
│   │   ├── Timer.tsx              # Countdown timer
│   │   └── /ui                    # Shadcn UI components
│   └── /data
│       └── initialData.ts         # Teams and questions data
└── /styles
    └── globals.css                # Global styles and animations
```

## Tech Stack

- **React 18**: UI framework
- **TypeScript**: Type safety
- **TailwindCSS v4**: Styling
- **Motion (Framer Motion)**: Animations
- **Shadcn UI**: Component library
- **Lucide React**: Icons
- **Vite**: Build tool

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

## Supabase Realtime Setup (MVP)

1. Create a Supabase project.
2. In Supabase SQL Editor, run:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
3. Copy `.env.example` to `.env` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GAME_CODE` (default: `demo-room`)
4. Restart local dev server:
```bash
npm run dev
```

If env vars are missing, the app automatically runs in local fallback mode (single-browser demo mode).

## Multi-user Validation Checklist

1. Open the app in two different browsers/devices.
2. In device A, submit a correct answer.
3. Confirm device B scoreboard and question status update automatically.
4. In admin panel, edit a team or question.
5. Confirm all devices reflect changes in real time.
6. Trigger reset actions and verify shared state remains consistent.
```

## Data Structure

### Teams
Each team has:
- ID (A-F)
- Name (Group A-F)
- Coins (starting balance: 100)
- Password (for authentication)

Default passwords for demo:
- Group A: `teamA123`
- Group B: `teamB123`
- Group C: `teamC123`
- Group D: `teamD123`
- Group E: `teamE123`
- Group F: `teamF123`

### Questions
Each question includes:
- ID (1-25)
- Question text
- Correct answer
- Hint text
- Hint cost (coins)

## Customization

### Adding More Questions
Edit `/src/app/data/initialData.ts` and add entries to the `initialQuestions` array.

### Adding More Teams
Edit `/src/app/data/initialData.ts` and add entries to the `initialTeams` array. Update the Scoreboard layout if needed.

### Changing Timer Duration
In `/src/app/App.tsx`, modify the initial `timeRemaining` state (in seconds):
```typescript
const [timeRemaining, setTimeRemaining] = useState<number>(7200); // 2 hours
```

### Adjusting Coin Values
- **Correct Answer Reward**: In `App.tsx`, search for `coins: t.coins + 20`
- **Hint Cost**: In `initialData.ts`, modify the `hintCost` property for each question

## User Flow

1. **Main Screen**: User sees 25 question cards and team scoreboard
2. **Click Question**: User selects a question (e.g., Q7)
3. **Select Team**: User chooses which team is answering
4. **Enter Password**: Team password authentication
5. **Answer Question**: 
   - View question
   - Optionally view hint (deducts coins with confirmation)
   - Submit answer
   - See immediate feedback (correct/incorrect)
6. **Return to Main**: Auto-redirect after answer submission

## Scoring System

- **Correct Answer**: +20 coins
- **Incorrect Answer**: No penalty
- **View Hint**: -10 coins (configurable per question)

## Future Enhancement Ideas

- Persist state to localStorage or database
- Add difficulty levels
- Multiple quiz categories
- Real-time multiplayer with WebSocket
- Admin panel for quiz management
- Export results/analytics
- Leaderboard history
- Question time limits
- Bonus point multipliers

## License

MIT

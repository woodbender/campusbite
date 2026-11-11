# CampusBite Live Build: Starter

This is the plain hackathon starter, prepared for the CampusBite live session.
In the session, the trainer turns it into CampusBite (an SRM canteen ordering agent) using AI prompts.

- Prompts, step by step: `live-demo/LIVE_BUILD_PROMPTS.md`
- Demo script: `live-demo/DEMO_SCRIPT.md`
- Database: run `seed/00_starter_example.sql`, then `seed/campusbite.sql` in Supabase
- AI rules: `.github/copilot-instructions.md` (Copilot) and `CLAUDE.md` (Claude Code)

---

# SRM Agentic AI Hackathon: Starter Template

This is the starting point for every team. It already has the setup done, so you can spend your time on your problem statement.

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS · Supabase PostgreSQL · Google Gemini API (function calling) · Zod · Vercel

## What is already working

- A passcode login that protects your app and your Gemini quota
- A Supabase connection (server side only)
- A Gemini agent loop with function calling: Gemini picks a tool, Zod checks the arguments, your code runs it, and the result goes back to Gemini
- Six CampusBite tools for menu, wallet, pickup slots, orders, placing orders and cancellations
- A chat screen that shows every tool the agent used
- Student and kitchen screens backed by live CampusBite API routes
- Seed data for the CampusBite tables in `seed/`

## CampusBite agent loop

CampusBite keeps the Gemini model on the server and gives it six typed tools:
four read tools for the live menu, wallet, pickup slots and student orders, plus
database-backed order and cancellation tools. The agent reads the current data,
checks the ordering rules, calls the `place_order` or `cancel_order` RPC when
needed, and then turns the result into a short plain-English reply. The student
screen refreshes wallet, orders and stock automatically, while the kitchen screen
polls live orders and advances them through placed, preparing, ready and collected.

## Setup (about 30 minutes)

1. **Create your team repo.** Click **Use this template** on GitHub and name it `team-<number>-ps<number>`.
2. **Install.** Run `git clone <your repo>`, `cd` into it, and run `npm install`. You need Node.js 20 or later.
3. **Create the database.** Create a project on [supabase.com](https://supabase.com). In **SQL Editor**, run `seed/00_starter_example.sql`, then the seed file for your problem.
4. **Get the keys.**
   - Supabase **Project Settings**: copy the Project URL and the secret (service_role) key
   - [Google AI Studio](https://aistudio.google.com): click **Get API key**
5. **Create `.env.local`.** Copy `.env.example` to `.env.local` and fill in all the values.
6. **Run it.** Run `npm run dev`, open http://localhost:3000, enter your passcode and try a sample prompt.
7. **Deploy.** On [vercel.com](https://vercel.com), import the repo, add the same environment variables, and deploy.

To check your settings, open `/api/health`. It shows which variables are missing (never their values).

## Folder guide

```
app/
  page.tsx               Student page: agent chat + live data
  login/page.tsx         Passcode page
  api/agent/route.ts     POST /api/agent: runs the agent
  api/menu/route.ts      GET live menu
  api/me/route.ts        GET student wallet and orders
  api/kitchen/route.ts   GET/POST kitchen orders
  api/health/route.ts    Shows which settings are missing
components/
  AgentChat.tsx          Chat UI that shows tool calls
  WalletOrders.tsx       Student wallet and orders
  MenuPanel.tsx          Live menu and stock
lib/
  agent/tools.ts         CampusBite agent tools
  agent/systemPrompt.ts  CampusBite instructions for Gemini
  agent/runAgent.ts      The agent loop (max 8 rounds)
  agent/defineTool.ts    Turns Zod schemas into Gemini tool declarations
  supabase.ts            Server-side Supabase client
  schemas.ts             Shared Zod schemas
proxy.ts                 Passcode gate for every page and API
seed/                    CampusBite SQL seed data
```

## How to add a tool (the main hackathon work)

Open `lib/agent/tools.ts` and copy this pattern:

```ts
const createReturnRequest = defineTool({
  name: "createReturnRequest",
  description: "Use this when the customer wants to return a product from a delivered order.",
  writes: true,
  schema: z.object({
    order_id: z.number().int().describe("The order number, for example 1007"),
    product_id: z.string().describe("The product id, for example P101"),
    reason: z.string().min(3).describe("Why the customer is returning it"),
  }),
  run: async ({ order_id, product_id, reason }) => {
    // 1. Check your business rule (for example the return window)
    // 2. Read or write Supabase
    // 3. Return a small, clean object, or throw new Error("clear message")
  },
});

export const tools: AgentTool[] = [createReturnRequest /*, more tools */];
```

Good tools:

- Have a description that starts with "Use this when..."
- Describe every field and its format, for example "YYYY-MM-DD"
- Check business rules in code, not only in the prompt
- Return small objects that Gemini can read easily
- Throw clear errors, which the agent then explains to the user

Then rewrite `lib/agent/systemPrompt.ts`. Name the business user, the logged-in user id (for example `C001`), your business rules and when to use each tool.

## Rules to remember

- Never commit `.env.local`. It is already in `.gitignore`.
- Never use `SUPABASE_SECRET_KEY` in frontend code. Only files under `lib/` and `app/api/` may use it.
- Do not change the core stack.
- Before you push, run `npm run build`. If it fails on your laptop, it will fail on Vercel too.

## Seed files

| File | Problem |
| --- | --- |
| `00_starter_example.sql` | Example `tasks` table (run first) |
| `demo_eventease.sql` | Day 1 lab: EventEase campus events |
| `ps1_ecommerce_support.sql` | PS1 E-commerce Customer Support Agent |
| `ps2_inventory_restock.sql` | PS2 Inventory Restock Agent |
| `ps3_clinic_appointments.sql` | PS3 Clinic Appointment Agent |
| `ps4_it_helpdesk.sql` | PS4 IT Helpdesk Ticket Agent |
| `ps5_expense_claims.sql` | PS5 Expense Claim Assistant |
| `ps6_job_match.sql` | PS6 Job Match Agent |

All dates in the seed data are relative to today, so the data is always fresh. All names, companies and records are made up. You can run a seed file again at any time to reset your data.


## Deployment

The main branch is connected to Vercel for production deployments.

# DragonMind

DragonMind is a local-first personal digital advisor MVP. It helps capture Sparks, preserve cognitive timelines, connect related thoughts, surface the most important current issue, and support lightweight judgment without turning the product into a generic task manager or note app.

## Current Version Status

- Current sealed MVP tag: `v0.1-mvp`
- Tag commit: `8c77284`
- Repository: `git@github.com:HelloKittycc/DragonMind.git`
- Status: v0.1 MVP is sealed and has passed end-to-end acceptance testing.

`v0.1-mvp` is the accepted MVP baseline. Future work should start from this tag or a later branch, not by changing the meaning of the sealed v0.1 scope.

## Technical Stack

- Frontend: Next.js App Router
- Backend: FastAPI
- Database: SQLite
- Deployment posture: local-first, no cloud for v0.1
- Reminder timezone: `Asia/Shanghai`

## Local Setup

### Backend

From the repository root:

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
PYTHONPATH=. python3 -m uvicorn src.main.main:app --host 127.0.0.1 --port 8000
```

The backend requirements include `python-multipart` for local `.txt`, `.md`, `.csv`, and `.json` knowledge file uploads.

Backend URL:

```text
http://127.0.0.1:8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

### Frontend

From the repository root:

```bash
cd apps/web
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Frontend URL:

```text
http://127.0.0.1:3000
```

## Database

SQLite database path:

```text
apps/api/dragonmind.sqlite3
```

Migrations are run by the backend at startup through the FastAPI application lifecycle.

## How To Verify Basic Functionality

With backend and frontend running:

1. Open `http://127.0.0.1:3000`.
2. Use the bottom `灵光一闪` capture bar to create a Spark.
3. Confirm the Node Detail page shows:
   - Cognitive timeline
   - Tasks
   - Relations
   - Evidence panel
4. Create a second similar Spark to trigger related / repeated discovery.
5. Return to `/` and confirm the Single Focus home page shows one main issue.
6. Click `帮我判断` and confirm the Judge flow opens.
7. Click `记为可能模式` and confirm it is shown as display-only possible pattern context.

Useful API checks:

```bash
curl http://127.0.0.1:8000/discovery-feed
curl 'http://127.0.0.1:8000/nodes?filter=inbox'
curl 'http://127.0.0.1:8000/nodes?filter=active'
curl 'http://127.0.0.1:8000/nodes?filter=decision'
curl 'http://127.0.0.1:8000/nodes?filter=all'
```

Validation commands:

```bash
PYTHONPYCACHEPREFIX=/private/tmp/dragonmind_pycache python3 -m compileall -q apps/api/src
cd apps/web && ./node_modules/.bin/tsc --noEmit
```

## Implemented In v0.1

- Spark capture
- Node / node_message / node_interpretation / task data layer
- Relation
- Stage progression
- Evidence
- Archive
- Discovery Feed
- Reminder cadence
- Task Revival
- Single Focus mobile UI
- End-to-End acceptance passed

## Not Included In v0.1

- Knowledge Ingestion
- RAG
- Vector DB
- Radius1
- Historical counterexample discovery
- Concept
- Insight
- Attention Pattern
- Outcome / Review
- Multi-user
- Cloud sync
- Conversation management
- Project management

## Project Structure

```text
apps/
  api/                 FastAPI backend and SQLite data layer
  web/                 Next.js App Router frontend
docs/
  releases/            Release notes
  archive/             Archived design and UX references
packages/              Shared package workspace placeholder
08_IMPLEMENTATION_PLAN.md
10_SINGLE_FOCUS_FRONTEND_DESIGN.md
```

Key docs:

- `docs/DragonMind_v0.1_Spec.md`
- `08_IMPLEMENTATION_PLAN.md`
- `10_SINGLE_FOCUS_FRONTEND_DESIGN.md`
- `docs/releases/v0.1-mvp.md`

## Next Phase

Next planned phase: `v0.1.1 Knowledge Ingestion`.

The next phase should add a minimal knowledge ingestion path while preserving the v0.1 local-first MVP architecture. It should not implicitly add RAG, Vector DB, Radius1, Concept, Insight, Attention Pattern, Outcome / Review, multi-user, cloud sync, conversation management, or project management unless those are explicitly scoped in a future spec.

# Blub

Visualise chat logs as a **branching tree**: see branches when you ask new questions and circle back to any idea.

- **Left:** Graph of the conversation (each node = one message). Click a node to jump to that branch.
- **Right:** Linear thread for the current branch, with **Go to here** (circle back) and **Branch from here** (start a new branch from that message).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Load a transcript

- **Paste** a Cursor-style transcript (lines starting with `user:` and `assistant:`), then **Load from paste**.
- Or **Upload file** (e.g. a `.txt` export).

After loading, you can:

1. **Circle back** — Click a node in the graph or **Go to here** on a message to view that branch.
2. **Branch** — Click **Branch from here** on any message to create a new branch (placeholder message); the graph updates and you can edit the placeholder later.

## Build

```bash
npm run build
```

Output is in `dist/`.

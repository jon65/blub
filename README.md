# Blub

A branching chat interface. Have a conversation with Claude and explore it as an interactive tree — branch from any message, circle back to earlier ideas, and use the built-in analysis tools to understand what you've covered and where to go next.

## How it works

**Left panel — conversation graph**
Every message is a node. Replies chain downward; branches fork sideways. Click any node to jump to that point in the conversation.

**Right panel — three tabs**

| Tab | What it does |
|-----|-------------|
| **Branch** | Shows the current thread as a linear list of messages. Send new messages to continue the conversation. Click **Branch from here** on any message to fork a new path from that point. |
| **Topics** | Clusters all messages by semantic similarity using TF-IDF + k-means. Adjust the cluster count with the slider. Each cluster shows its top keyword chips and, for larger clusters, blue sub-topic chips derived from a second-level clustering pass. Click any message to jump to it in the graph. |
| **Guide** | Generates a study guide for the whole conversation (requires API key). One click calls Claude with the full tree and returns five sections: **Overview**, **Key Concepts**, **Branch Insights**, **Go Deeper** (questions for areas covered lightly), and **Quick Reference** (key facts and conclusions). Hit Regenerate after adding more messages. |

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173, paste your Claude API key into the header, and start typing.

## Header controls

- **API key** — stored in `localStorage`, never sent anywhere except the Anthropic API directly from your browser.
- **Import** — load an existing transcript (paste or upload a `.txt` file in `user: / assistant:` format) to seed the tree.
- **New conversation** — clear everything and start fresh.

## Branching model

Every message has exactly one parent (except the root). When you branch from a message, a new child node is added at that point — the original children are untouched. The graph shows all branches simultaneously; the thread panel shows only the path you're currently on.

**Keyboard shortcut:** `⌘↵` (or `Ctrl↵`) submits a message.

## Build

```bash
npm run build
```

Output is in `dist/`.

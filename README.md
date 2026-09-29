# Draw Cup

A small, frontend-only React app that simulates a two-stage random competition.

1. **Stage 1 (groups):** each group gets 10 random picks. The players picked most often advance; each group sets its own number of winners.
2. **Final stage:** every Stage 1 winner competes in 15 random picks. The most-picked player is the champion.

A tie that decides who advances or who wins is settled with 3 extra picks among only the tied players, repeated until it is broken. Picks use the browser's cryptographic random number generator.

Everything runs in the browser. There is no backend; the group setup is remembered in `localStorage`.

## Run it

Requires Node.js 22 (pinned in `.node-version`).

```bash
npm install
npm run dev      # start the dev server, then open the printed URL
npm test         # run the engine unit tests
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

## Project layout

```
src/
  engine/engine.js       Competition rules: picks, counting, ranking, tie-breaks, winners (no React)
  engine/engine.test.js  Unit tests for the engine
  hooks/useReplay.js     Animation timing that replays the engine's result
  components/            CompetitionSetup, Group, PlayerList, Stage1, FinalStage,
                         RandomPicker, Tiebreak, Results, WinnerDisplay, Rules
  setupStorage.js        Sample groups and saving the setup in the browser
  App.jsx                Wires setup, stages and results together
```

The engine decides a whole stage up front and returns the pick sequence, counts, ranking and any tie-breaks. The components only replay that result, so the animation never affects the outcome. Every engine function that draws takes an optional `randInt(n)` so tests can script the picks.

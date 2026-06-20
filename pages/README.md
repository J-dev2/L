# Pages / Runtime Chunks

This first split preserves script execution order from the single HTML file.
Next refactor pass should move hub renderers into named files such as:

- `pages/hubs/money.js`
- `pages/hubs/finance.js`
- `pages/hubs/life-stack.js`
- `pages/hubs/legal.js`
- `pages/hubs/stocks.js`

Do not convert these files to ES modules until the global state model is cleaned up.

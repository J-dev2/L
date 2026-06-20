# Hubs

These files are the first named page layer.

They currently register hub metadata and bridge to the existing global renderers. The next refactor pass should move actual render code into these files in this order:

1. `life-stack.js`
2. `money.js`
3. `finance.js`
4. `legal.js`
5. `stocks.js`
6. `business.js`
7. `education.js`
8. `career.js`
9. `people.js`
10. `more.js`

Do not convert to ES modules until the global state model has been reduced.

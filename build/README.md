# Build

Run from the workspace root:

```powershell
& "C:\Users\jgodj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" outputs\ledger18_modular_v18_35\build\build-ledger18.js
```

Output:

`outputs/ledger18_modular_v18_35/dist/Ledger_18_dynamic_stocks_v18_35_built.html`

The build script inlines CSS and JavaScript in the order listed by `index.html`.

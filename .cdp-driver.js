const port = process.argv[2], url = process.argv[3], exprFile = process.argv[4];
const fs = require("fs");
const expr = fs.readFileSync(exprFile, "utf8");
function send(ws, id, method, params) {
  return new Promise((resolve) => {
    const onMsg = (ev) => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } if (m.id === id) { ws.removeEventListener("message", onMsg); resolve(m); } };
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
(async () => {
  const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  let page = list.find(t => t.type === "page" && t.webSocketDebuggerUrl);
  if (!page) { console.log(JSON.stringify({ error: "no page target" })); process.exit(1); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r, { once: true }));
  let mid = 1;
  const consoleErrors = [];
  ws.addEventListener("message", (ev) => {
    let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
    if (m.method === "Runtime.exceptionThrown") { const d = m.params && m.params.exceptionDetails; consoleErrors.push("EXCEPTION: " + ((d && d.exception && d.exception.description) || (d && d.text) || "unknown")); }
    else if (m.method === "Runtime.consoleAPICalled" && m.params && m.params.type === "error") { consoleErrors.push("CONSOLE.ERROR: " + (m.params.args || []).map(a => a.value || a.description || "").join(" ")); }
  });
  await send(ws, mid++, "Page.enable", {});
  await send(ws, mid++, "Runtime.enable", {});
  const loaded = new Promise((resolve) => {
    const onMsg = (ev) => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } if (m.method === "Page.loadEventFired") { ws.removeEventListener("message", onMsg); resolve(); } };
    ws.addEventListener("message", onMsg);
  });
  await send(ws, mid++, "Page.navigate", { url });
  await loaded;
  await new Promise(r => setTimeout(r, 1800));
  const res = await send(ws, mid++, "Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
  let payload;
  if (res.result && res.result.exceptionDetails) payload = { exception: res.result.exceptionDetails };
  else if (res.result && res.result.result) payload = (res.result.result.value !== undefined ? res.result.result.value : res.result.result);
  else payload = res;
  if (payload && typeof payload === "object") payload.__consoleErrors = consoleErrors;
  console.log(JSON.stringify(payload));
  ws.close();
  process.exit(0);
})().catch(e => { console.log(JSON.stringify({ driverError: String(e) })); process.exit(1); });

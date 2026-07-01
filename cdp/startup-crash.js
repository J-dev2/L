(async function () {
  const result = {
    pass: 0,
    fail: 0,
    summary: [],
    diagnostics: {},
    appText: "",
    url: location.href
  };
  function ok(name, condition, detail) {
    if (condition) result.pass += 1;
    else result.fail += 1;
    result.summary.push({ name, ok: !!condition, detail: detail || "" });
  }
  function readDiag() {
    result.diagnostics.render = window.__ledgerLastRenderErrorV1853 || null;
    result.diagnostics.global = window.__ledgerLastGlobalErrorV1853 || null;
    result.diagnostics.stock = window.__ledgerLastStockEngineErrorV20 || null;
    result.diagnostics.compaction = window.__ledgerStartupCompactionV1835 || null;
    result.diagnostics.loadIssue = window.__ledgerStartupLoadIssueV1835 || null;
    result.diagnostics.earlyStorageGuard = window.__ledgerEarlyStorageGuardV1835 || null;
  }
  function text() {
    const app = document.getElementById("app");
    return app ? (app.innerText || "").slice(0, 1000) : "";
  }
  await new Promise((resolve) => setTimeout(resolve, 1200));
  readDiag();
  result.appText = text();
  ok("app element exists", !!document.getElementById("app"));
  ok("app has visible text", result.appText.trim().length > 0, result.appText.slice(0, 160));
  ok("no startup render diagnostic", !result.diagnostics.render, result.diagnostics.render && result.diagnostics.render.message);
  ok("no startup global diagnostic", !result.diagnostics.global, result.diagnostics.global && result.diagnostics.global.message);

  const begin = Array.from(document.querySelectorAll("button")).find((button) => /begin sandbox life/i.test(button.innerText || ""));
  if (begin) {
    begin.click();
    await new Promise((resolve) => setTimeout(resolve, 1600));
    readDiag();
    result.afterBeginText = text();
    ok("begin sandbox life did not blank app", result.afterBeginText.trim().length > 0, result.afterBeginText && result.afterBeginText.slice(0, 160));
    ok("begin sandbox life has no render diagnostic", !result.diagnostics.render, result.diagnostics.render && result.diagnostics.render.message);
    ok("begin sandbox life has no global diagnostic", !result.diagnostics.global, result.diagnostics.global && result.diagnostics.global.message);
  } else {
    result.summary.push({ name: "begin sandbox life skipped", ok: true, detail: "button not present" });
  }

  return result;
})();

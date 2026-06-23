/* Button handler audit - finds buttons that silently fail.
 *
 * A button "silently fails" when its onclick calls a global function that
 * doesn't exist (renamed / never exposed on window) - clicking throws a
 * ReferenceError that the player never sees, so nothing happens.
 *
 * HOW TO USE (two ways):
 *
 * 1) In the running game: open the browser dev console (F12) ON THE SCREEN
 *    where buttons feel dead, paste this whole file, press Enter. It prints
 *    a table of every handler whose target function is undefined, with the
 *    button label(s) that use it. Open each hub and re-run to cover them all.
 *
 * 2) Via the CDP driver (returns the same object):
 *    node cdp/driver.js <port> "file:///d:/code/L/play.html?sandbox=1&from=landing" cdp/audit-buttons.js
 *    (Only scans whatever is rendered at load - the console method is more thorough.)
 */
(function () {
  // Identifiers that are language keywords / safe globals, not page handlers.
  var SAFE = {
    "if": 1, "for": 1, "while": 1, "switch": 1, "function": 1, "return": 1,
    "event": 1, "catch": 1, "typeof": 1, "new": 1, "delete": 1, "void": 1,
    "Number": 1, "String": 1, "Boolean": 1, "Math": 1, "JSON": 1, "Array": 1,
    "Object": 1, "parseInt": 1, "parseFloat": 1, "isNaN": 1, "alert": 1,
    "confirm": 1, "prompt": 1, "window": 1, "document": 1, "console": 1,
    "setTimeout": 1, "requestAnimationFrame": 1
  };
  var els = document.querySelectorAll("[onclick]");
  var broken = {};   // fnName -> [button labels]
  var ok = {};       // fnName -> count (for reference)
  els.forEach(function (el) {
    var code = el.getAttribute("onclick") || "";
    var re = /([A-Za-z_$][\w$]*)\s*\(/g, m;
    while ((m = re.exec(code))) {
      var name = m[1];
      if (SAFE[name]) continue;
      // Skip property/method calls (preceded by a dot): foo.bar(
      if (code[m.index - 1] === ".") continue;
      if (typeof window[name] === "function") {
        ok[name] = (ok[name] || 0) + 1;
      } else {
        var label = (el.textContent || el.value || el.title || "").replace(/\s+/g, " ").trim().slice(0, 40);
        (broken[name] = broken[name] || []).push(label || "(no label)");
      }
    }
  });
  var brokenNames = Object.keys(broken);
  var result = {
    scannedButtons: els.length,
    brokenHandlerCount: brokenNames.length,
    brokenHandlers: broken,
    distinctWorkingHandlers: Object.keys(ok).length
  };
  try {
    if (brokenNames.length) {
      console.warn("SILENTLY-FAILING BUTTONS - " + brokenNames.length + " undefined handler(s):");
      console.table(brokenNames.map(function (n) { return { handler: n, buttons: broken[n].join(", ") }; }));
    } else {
      console.log("No undefined onclick handlers on the current screen (" + els.length + " buttons scanned).");
    }
  } catch (e) { console.log(result); }
  return result;
})();

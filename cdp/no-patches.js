(function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) {
    out.pass[name] = !!cond;
    if (!cond) out.fail.push(name + (detail ? ": " + detail : ""));
  }
  try {
    var scripts = Array.prototype.slice.call(document.querySelectorAll("script"));
    var patchScripts = scripts.map(function (s) {
      return s.getAttribute("src") || s.getAttribute("data-source") || "";
    }).filter(function (src) {
      return /pages[\/\\]patches[\/\\]/.test(src);
    });
    ok("no_patch_script_tags", patchScripts.length === 0, patchScripts.join(", "));
    ok("runtime_absorbed_patches_loaded", typeof window.render === "function" && typeof window.ageUp === "function");
    out.info = {
      scriptCount: scripts.length,
      patchScripts: patchScripts
    };
    out.summary = {
      total: Object.keys(out.pass).length,
      passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length,
      failed: out.fail.length
    };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 6).join(" || ") : "");
  }
  return out;
})();

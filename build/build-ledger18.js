const fs = require("fs");
const path = require("path");

const projectDir = path.resolve(__dirname, "..");
const distDir = path.join(projectDir, "dist");
const reportPath = path.join(projectDir, "docs", "build-report.json");

function readRel(rel) {
  const fileRel = rel.split(/[?#]/)[0];
  return fs.readFileSync(path.join(projectDir, fileRel.replace(/\//g, path.sep)), "utf8");
}

function inlineStyles(html) {
  return html.replace(/<link rel="stylesheet" href="([^"]+)">\s*/g, function (_match, href) {
    const css = readRel(href);
    return `<style data-source="${href}">\n${css}\n</style>\n`;
  });
}

function inlineScripts(html, report) {
  return html.replace(/<script src="([^"]+)"><\/script>\s*/g, function (_match, src) {
    const js = readRel(src);
    report.scripts.push({ src, bytes: Buffer.byteLength(js, "utf8") });
    return `<script data-source="${src}">\n${js}\n</script>\n`;
  });
}

function build() {
  const report = {
    builtAt: new Date().toISOString(),
    source: "outputs/ledger18_modular_v18_35",
    entries: []
  };

  function writeRedirectAlias(fileName, targetFile, title, preserveLocation) {
    const targetExpression = preserveLocation
      ? `target + (location.search || "") + (location.hash || "")`
      : "target";
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<script>
var target = ${JSON.stringify(targetFile)};
location.replace(${targetExpression});
</script>
</head>
<body>
<p><a href="${targetFile}">Open ${title}</a></p>
</body>
</html>
`;
    fs.writeFileSync(path.join(distDir, fileName), html, "utf8");
    report.entries.push({
      entry: fileName,
      output: `outputs/ledger18_modular_v18_35/dist/${fileName}`,
      aliasFor: targetFile,
      bytes: Buffer.byteLength(html, "utf8")
    });
  }

  function buildEntry(entryFile, outputFile) {
    const entryReport = {
      entry: entryFile,
      output: `outputs/ledger18_modular_v18_35/dist/${outputFile}`,
      scripts: []
    };
    let html = fs.readFileSync(path.join(projectDir, entryFile), "utf8");
    html = inlineStyles(html);
    html = inlineScripts(html, entryReport);
    fs.writeFileSync(path.join(distDir, outputFile), html, "utf8");
    entryReport.bytes = Buffer.byteLength(html, "utf8");
    report.entries.push(entryReport);
    return html;
  }

  fs.mkdirSync(distDir, { recursive: true });
  const landingHtml = buildEntry("index.html", "Ledger_18_dynamic_stocks_v18_35_landing_built.html");
  buildEntry("play.html", "Ledger_18_dynamic_stocks_v18_35_play_built.html");
  fs.writeFileSync(path.join(distDir, "Ledger_18_dynamic_stocks_v18_35_built.html"), landingHtml, "utf8");
  fs.writeFileSync(path.join(distDir, "index.html"), landingHtml, "utf8");
  report.entries.push({
    entry: "index.html",
    output: "outputs/ledger18_modular_v18_35/dist/index.html",
    aliasFor: "Ledger_18_dynamic_stocks_v18_35_landing_built.html",
    bytes: Buffer.byteLength(landingHtml, "utf8")
  });
  writeRedirectAlias("play.html", "Ledger_18_dynamic_stocks_v18_35_play_built.html", "Ledger 18 Play", true);
  report.compatibilityOutput = "outputs/ledger18_modular_v18_35/dist/Ledger_18_dynamic_stocks_v18_35_built.html";
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

build();

(function () {
  var out = { pass: {}, fail: [], notes: [], info: {} };
  function ok(name, cond, detail) { out.pass[name] = !!cond; if (!cond) out.fail.push(name + (detail ? ": " + detail : "")); }
  function num(v) { return Number.isFinite(Number(v)) ? Number(v) : 0; }
  function reset() {
    if (typeof window.newGame === "function") window.newGame({ sandboxMode: true });
    if (typeof window.ensureStateShape === "function") window.ensureStateShape();
    state.age = 35;
    state.money = 1000000;
    state.finance = state.finance || {};
    if (!window.EntrepreneurV1861 || typeof window.EntrepreneurV1861.initBiz !== "function") return null;
    var B = window.EntrepreneurV1861.initBiz();
    B.active = true;
    B.businesses = [];
    var biz = window.EntrepreneurV1861.newBizObj("Counsel Cloud", "saas", "saas", 10000000);
    biz.uid = "legal_biz";
    biz.stage = "scale";
    biz.productStage = "live";
    biz.productQuality = 85;
    biz.customers = 100000;
    biz._avgOrderValue = 100;
    biz.marketSize = 1000000000;
    biz.grossMargin = 0.82;
    biz.cashInBusiness = 10000000;
    biz.active = true;
    biz.dead = false;
    B.businesses.push(biz);
    B.activeBizId = biz.uid;
    return biz;
  }

  try {
    var biz = reset();
    ok("has_entrepreneur_exports", !!biz && typeof window.bizHireTaxAttorneyV1872 === "function" && typeof window.runEntrepreneurYearV1861 === "function");

    var cashBeforeHire = num(biz && biz.cashInBusiness);
    window.bizHireTaxAttorneyV1872("structuring");
    ok("tax_attorney_set", biz.legalV1872 && biz.legalV1872.taxAttorney === "structuring", JSON.stringify(biz.legalV1872 || {}));
    ok("upfront_fee_from_company_cash", num(biz.cashInBusiness) === cashBeforeHire - 120000, "cash=" + num(biz.cashInBusiness));
    ok("effective_rate_lower_than_default", window.EntrepreneurV1861.bizEffectiveTaxRateV1872(biz) < 0.21, "rate=" + window.EntrepreneurV1861.bizEffectiveTaxRateV1872(biz));

    window.runEntrepreneurYearV1861();
    ok("year_records_effective_rate", num(biz._corpTaxRateV1872) > 0 && num(biz._corpTaxRateV1872) < 0.21, "rate=" + num(biz._corpTaxRateV1872));
    ok("year_records_legal_fee", num(biz._taxAttorneyFeeV1872) === 60000, "fee=" + num(biz._taxAttorneyFeeV1872));
    ok("year_saves_tax", num(biz._taxAttorneySavingsV1872) > 0, "saved=" + num(biz._taxAttorneySavingsV1872) + " preTax=" + num(biz._preTaxProfitV1872));
    ok("corp_tax_below_baseline", num(biz._corpTaxV1869) < num(biz._baselineCorpTaxV1872), "tax=" + num(biz._corpTaxV1869) + " baseline=" + num(biz._baselineCorpTaxV1872));
    ok("legal_totals_accumulate", num(biz.legalV1872.totalFees) >= 180000 && num(biz.legalV1872.totalTaxSaved) >= num(biz._taxAttorneySavingsV1872), JSON.stringify(biz.legalV1872 || {}));

    var B = window.EntrepreneurV1861.initBiz();
    B.activePanelV1862 = "legal";
    var html = "";
    try { html = window.renderEntrepreneurHubV1861(); } catch (e) { out.notes.push("render threw " + e); }
    ok("legal_tab_renders", /Tax counsel|Effective rate|Family office tax attorney/.test(html), "len=" + html.length);
    ok("legal_tab_selected", html.indexOf("Corporate tax planning") >= 0 && html.indexOf(">Legal</button>") >= 0, "missing legal selected/render");

    out.info = {
      taxRate: num(biz._corpTaxRateV1872),
      tax: num(biz._corpTaxV1869),
      baselineTax: num(biz._baselineCorpTaxV1872),
      saved: num(biz._taxAttorneySavingsV1872),
      legalFee: num(biz._taxAttorneyFeeV1872),
      cash: num(biz.cashInBusiness)
    };
    out.summary = { total: Object.keys(out.pass).length, passed: Object.keys(out.pass).filter(function (k) { return out.pass[k]; }).length, failed: out.fail.length };
  } catch (e) {
    out.error = String(e) + " | " + (e && e.stack ? e.stack.split("\n").slice(0, 8).join(" || ") : "");
  }
  return out;
})();

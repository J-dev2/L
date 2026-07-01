(function () {
  const logs = Array.from({ length: 1200 }, (_, i) => ({ age: i % 90, text: "Synthetic old log entry " + i, deltas: [] }));
  const history = Array.from({ length: 600 }, (_, i) => ({ age: i, value: i * 1000, income: i * 10, rep: i % 100 }));
  const candles = Array.from({ length: 500 }, (_, i) => ({ o: 100 + i, h: 101 + i, l: 99 + i, c: 100.5 + i }));
  const state = {
    name: "Bloat Test",
    gender: "female",
    age: 33,
    alive: true,
    money: 250000,
    savings: 10000,
    debt: 0,
    stats: { health: 80, happiness: 70, smarts: 70, looks: 70, stress: 35, energy: 70, discipline: 70, athleticism: 60, karma: 50 },
    flags: {},
    actionsTaken: {},
    relationships: {},
    legacy: { generation: 1 },
    log: logs,
    inventory: [],
    timeSnapshotsV1814: Array.from({ length: 60 }, (_, i) => ({ id: i, age: i, label: "Snapshot " + i, state: { name: "Nested " + i, age: i, alive: true, log: logs.slice(0, 20) } })),
    life: { memories: logs.slice(0, 120) },
    finance: {
      businesses: [{ id: "testbiz", name: "Test Business", value: 100000, historyV1862: history, historyV1830: history, eventHistoryV1850: history }],
      bizV1860: { businesses: [{ uid: "founder1", name: "Founder Co", history: history, logs: logs, events: history }] },
      stocksV18: { history: { AAPL: history }, candles: { AAPL: candles }, news: history, watchlist: Array.from({ length: 200 }, (_, i) => "SYM" + i) },
      cashFlowHistoryV1824: history,
      taxTrueUpsV1824: history,
      fundInvestorLedgerV1825: history,
      legalCasesV1826: history,
      healthClaimsV1826: history,
      relocationHistoryV1826: history,
      businessTaxV1830: { history: history },
      taxCleanupV1832: { history: history },
      familyTrustV1839: { history: history },
      familyEnterpriseV1846: { history: history }
    },
    careerV1827: { applications: history, offers: history, history: history },
    careerV1828: { interviewHistory: history },
    careerV1832: { history: history }
  };
  localStorage.setItem("ledger-life-slot-5", JSON.stringify(state));
  localStorage.setItem("ledger-active-slot", "5");
  return { seeded: true, log: state.log.length, snapshots: state.timeSnapshotsV1814.length };
})();

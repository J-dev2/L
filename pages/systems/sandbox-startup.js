/* Sandbox / startup system bridge. */
(function () {
  if (!window.registerLedgerSystem) return;
  window.registerLedgerSystem({
    id: "sandbox-startup",
    file: "pages/systems/sandbox-startup.js",
    status: "bridge",
    globals: ["renderSandbox", "startSandboxV1812", "goSandbox", "startGame"],
    nextMove: "Move splash, start menu, sandbox builder, custom stat controls, and stress-free mode here."
  });
})();

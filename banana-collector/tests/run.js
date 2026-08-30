// Petit lanceur maison plutôt qu'un framework de test : ce dépôt n'a jamais
// eu de suite versionnée avant celle-ci, on garde donc la dépendance la
// plus légère possible (Playwright seul). Chaque fichier tests/*.test.js
// exporte run() et s'exécute dans son propre navigateur/serveur, isolé des
// autres — un test qui plante n'empêche pas les suivants de tourner.
const fs = require("fs");
const path = require("path");

const TEST_DIR = __dirname;
const testFiles = fs
  .readdirSync(TEST_DIR)
  .filter((f) => f.endsWith(".test.js"))
  .sort();

async function main() {
  console.log(`Lancement de ${testFiles.length} fichier(s) de test...\n`);
  const results = [];
  for (const file of testFiles) {
    const { run } = require(path.join(TEST_DIR, file));
    const start = Date.now();
    try {
      await run();
      const ms = Date.now() - start;
      console.log(`✅ ${file} (${ms}ms)`);
      results.push({ file, ok: true });
    } catch (e) {
      const ms = Date.now() - start;
      console.error(`❌ ${file} (${ms}ms)\n   ${e.message}`);
      results.push({ file, ok: false, error: e.message });
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} test(s) réussi(s).`);
  if (failed.length > 0) {
    console.log(`Échecs : ${failed.map((f) => f.file).join(", ")}`);
    process.exit(1);
  }
}

main();

// Detecta la IP de red local de esta máquina y la escribe en .env.local, para
// no tener que actualizarla a mano cada vez que cambias de red (casa/universidad).
// Uso: node scripts/setLocalEnv.js [ip] [puerto]
// Si no se pasa una IP, se detecta automáticamente. Si se detecta más de una
// candidata, se debe elegir manualmente pasándola como argumento.
const fs = require("fs");
const os = require("os");
const path = require("path");

const IGNORED_INTERFACE_PATTERN = /virtualbox|vmware|vethernet|docker|tailscale|loopback|wsl/i;
const DEFAULT_PORT = "8086";

function findCandidateIps() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const [name, addresses] of Object.entries(interfaces)) {
    if (IGNORED_INTERFACE_PATTERN.test(name)) continue;
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        candidates.push({ name, address: address.address });
      }
    }
  }
  return candidates;
}

// Adaptadores físicos típicos (Wi-Fi/Ethernet "puros", sin sufijo numérico):
// se prefieren sobre adaptadores virtuales (VirtualBox, VPN, etc. suelen
// aparecer como "Ethernet 2", "Ethernet 3", ...).
const PREFERRED_INTERFACE_NAMES = ["Wi-Fi", "Ethernet"];

function main() {
  const [, , ipArg, portArg] = process.argv;
  const port = portArg ?? DEFAULT_PORT;
  let ip = ipArg;

  if (!ip) {
    const candidates = findCandidateIps();
    if (candidates.length === 0) {
      console.error("No se encontró ninguna IP de red local. Conéctate a una red y reintenta.");
      process.exit(1);
    }

    const preferred = candidates.filter((c) => PREFERRED_INTERFACE_NAMES.includes(c.name));
    const chosen = preferred.length === 1 ? preferred : candidates;

    if (chosen.length > 1) {
      console.error("Se encontró más de una IP candidata, elige una manualmente:");
      chosen.forEach((c) => console.error(`  ${c.name}: ${c.address}`));
      console.error("\nUso: node scripts/setLocalEnv.js <ip> [puerto]");
      process.exit(1);
    }
    ip = chosen[0].address;
    console.log(`IP detectada (${chosen[0].name}): ${ip}`);
  }

  const envPath = path.join(__dirname, "..", ".env.local");
  fs.writeFileSync(envPath, `EXPO_PUBLIC_API_BASE_URL=http://${ip}:${port}\n`);
  console.log(`.env.local actualizado -> http://${ip}:${port}`);
}

main();

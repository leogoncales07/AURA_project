import fs from 'node:fs/promises';

const [parentValue, stateFile, ...childValues] = process.argv.slice(2);
const parentPid = Number(parentValue);
const childPids = childValues.map(Number);

if (!Number.isInteger(parentPid) || parentPid <= 0 || childPids.some(pid => !Number.isInteger(pid) || pid <= 0)) {
  process.exit(2);
}

const isAlive = pid => {
  try { process.kill(pid, 0); return true; } catch { return false; }
};
const terminateChildren = () => {
  for (const pid of childPids) {
    if (!isAlive(pid)) continue;
    try { process.kill(pid, 'SIGTERM'); } catch {}
  }
};

while (isAlive(parentPid)) {
  await new Promise(resolve => setTimeout(resolve, 400));
}
terminateChildren();
await new Promise(resolve => setTimeout(resolve, 300));
if (stateFile) await fs.unlink(stateFile).catch(() => {});

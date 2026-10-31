// 启动模拟器 → 安装 → 运行 → 把日志写到 tools/emulator.log
const fs = require('fs');
const path = require('path');
const emu = require('@aiot-toolkit/emulator');

const VVD_NAME = process.env.VVD_NAME || 'Vela_Band9';

// 把 IDE 自带的 adb 目录塞进 PATH，免得模拟器弹出 "Could not automatically detect an ADB binary"
const ADB_DIR = 'C:\\Users\\saa\\.aiot-ide\\extensions\\vela.aiot-emulator-1.6.1\\dist\\bin\\win';
if (fs.existsSync(path.join(ADB_DIR, 'adb.exe')) && (process.env.PATH || '').indexOf(ADB_DIR) < 0) {
  process.env.PATH = ADB_DIR + ';' + (process.env.PATH || '');
}
const ROOT = path.resolve(__dirname, '..');
const LOG = path.join(__dirname, 'emulator.log');
const DEBUG_PORT = 10055;
const HIDE_WINDOW = process.env.HIDE_WINDOW === '1';

fs.writeFileSync(LOG, '');
const log = (tag, msg) => {
  const line = `[${new Date().toISOString().slice(11, 19)}][${tag}] ${String(msg).trim()}`;
  fs.appendFileSync(LOG, line + '\n');
};

function pickRpk() {
  const dir = path.join(ROOT, 'dist');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.rpk'));
  if (!files.length) throw new Error('dist 里没有 rpk，先跑 .\\build.ps1');
  files.sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs);
  return path.join(dir, files[0]);
}

(async () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'manifest.json'), 'utf8')).package;
  const rpk = pickRpk();
  log('main', `package=${pkg} rpk=${rpk}`);

  const mgr = new emu.VvdManager({ sdkHome: emu.defaultSDKHome, vvdHome: emu.defaultVvdHome });
  const vvds = mgr.getVvdList();
  log('main', `vvds=${JSON.stringify(vvds.map((v) => v.name))}`);

  log('main', `starting emulator ${VVD_NAME} ...`);
  const { emulatorInstance } = await mgr.startVvd({
    vvdName: VVD_NAME,
    qtHideWindow: HIDE_WINDOW,
    origin: emu.IStartOrigin.Ide,
    debugPort: DEBUG_PORT,
    stdoutCallback: (m) => log('emu', m),
    stderrCallback: (m) => log('emu:err', m),
    exitCallback: (code) => log('main', `emulator exited: ${code}`),
  });
  log('main', `emulator up, adb serial = ${emulatorInstance.sn}`);

  log('main', 'waiting for adb ...');
  let ok = false;
  for (let i = 0; i < 60; i++) {
    ok = await emulatorInstance.isConnected();
    if (ok) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!ok) throw new Error('adb 一直没连上模拟器');
  log('main', 'adb connected');

  log('main', 'installing rpk ...');
  await emulatorInstance.pushAndInstall(rpk, pkg);
  log('main', 'installed');

  await emulatorInstance.startApp(pkg, false);
  log('main', 'app started');

  process.on('SIGINT', async () => {
    log('main', 'interrupted, stopping emulator');
    try { await mgr.stopVvd(VVD_NAME); } catch (e) { log('main', `stop failed: ${e}`); }
    process.exit(0);
  });
  // 保持进程存活，把日志一直写下去
  setInterval(() => {}, 1 << 30);
})().catch((e) => {
  log('ERR', e && e.stack ? e.stack : e);
  console.error('RUN FAILED:', e);
  process.exit(1);
});

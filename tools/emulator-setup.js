// 搭建 Vela 模拟器：下载 SDK 组件 + 创建一块 192x490 的手环尺寸虚拟设备
// 仅在你想在电脑上预览时使用；IDE 里第一次点"运行"也会做同样的事。
const path = require('path');
const emu = require('@aiot-toolkit/emulator');

const VVD_NAME = process.env.VVD_NAME || 'Vela_Band9';
const WIDTH = process.env.VVD_WIDTH || '192';
const HEIGHT = process.env.VVD_HEIGHT || '490';
const IMAGE = emu.VelaImageType.REL; // vela-release-4.0 正式版

(async () => {
  console.log('[sdk home]', emu.defaultSDKHome);
  console.log('[vvd home]', emu.defaultVvdHome);

  const mgr = new emu.VvdManager({ sdkHome: emu.defaultSDKHome, vvdHome: emu.defaultVvdHome });

  const missing = await mgr.hasSDKPartUpdate();
  console.log('[missing/outdated parts]', JSON.stringify(missing));

  if (missing.length > 0) {
    console.log('[1/2] downloading SDK parts (~620 MB) ...');
    const dl = await mgr.downloadSDK({ force: false, cliProgress: true, parallelDownloads: 6 });
    if (dl && dl.downlodPromise) await dl.downlodPromise;
    console.log('[1/2] download finished');
  } else {
    console.log('[1/2] all SDK parts already present');
  }

  const imageDir = path.resolve(emu.defaultSDKHome, emu.SDKParts.SYSTEM_IMAGES, IMAGE);
  const vvdDir = path.resolve(emu.defaultVvdHome, `${VVD_NAME}.vvd`);
  console.log('[2/2] creating vvd', VVD_NAME, `${WIDTH}x${HEIGHT}`, '->', vvdDir);

  // vela 4.0 正式版镜像只认皮肤定义的分辨率：手环 192x490 必须用 xiaomi_band 皮肤；
  // 预览 192 宽版面时用 VVD_SKIN=none 直出 466 宽的画布（画布宽度 466 是镜像内置的）。
  const skinEnv = (process.env.VVD_SKIN || 'none').trim();
  const skinName = skinEnv === 'none' ? undefined : skinEnv;
  const skinPath = skinName
    ? path.resolve(emu.defaultSDKHome, emu.SDKParts.SKINS, 'builtin', skinName)
    : undefined;
  console.log('[2/2] skin =', skinName || '(none)', skinPath || '');

  mgr.deleteVvd(VVD_NAME);
  mgr.createVvd({
    name: VVD_NAME,
    width: WIDTH,
    height: HEIGHT,
    arch: emu.IVvdArchType.arm,
    imageDir,
    imageType: IMAGE,
    customLcdRadius: '',
    skin: skinName,
    'skin.path': skinPath,
  });
  console.log('[2/2] vvd created at', vvdDir);
  console.log('DONE');
})().catch((e) => {
  console.error('SETUP FAILED:', e && e.stack ? e.stack : e);
  process.exit(1);
});

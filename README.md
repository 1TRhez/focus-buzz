# 专注震动（Focus Buzz）— 小米手环 9 NFC 快应用

把手环做成一个"随机震动番茄钟"：设一段专注时间，期间它隔一小会儿就随机震动提醒你回神，全程不用看屏幕。

灵感来自 B 站视频《为什么我能每天学习10小时》里的"随机提示音"番茄钟——把提示音换成震动，就成了手环上最合适的功能。

| 未开始 | 专注中 | 提醒后 10 秒（倒计时变灰） | 设置 |
| --- | --- | --- | --- |
| ![未开始](tools/device-idle.png) | ![专注中](tools/device-work.png) | ![休息](tools/device-break.png) | ![设置](tools/device-settings.png) |

> 上面是 Vela 模拟器里跑出来的真实帧缓冲（192×490），再合成到 `xiaomi_band` 皮肤的手环机身上。药丸屏圆角是真实遮罩，能直接看出内容有没有被弧边切到。

---

## 一、它是怎么工作的

一轮专注 = 若干次"提醒"：

```
开始专注 ──随机 5~15 分钟──> 震两下 ──> 倒计时变灰 10 秒（计时不暂停！）──> 震一下，颜色变回白色
   ↑                                                                              │
   └──────────────────────── 重新抽一个随机间隔 ←──────────────────────────────────┘
```

- 随机间隔每次都在【最短间隔, 最长间隔】里重新抽，不会两次撞在一起
- 提醒后的 10 秒里**只有倒计时数字变灰**，其它都不变，计时照常走；10 秒一到数字变回白色，再震一下表示"继续干活"
- 专注时长走完：长震两下 + 显示"完成"
- 整个过程不需要你看屏幕：震两下 = 该歇 10 秒，震一下 = 继续

### 主界面

- 最上面正中是 **设置** 胶囊按钮（86×26），屏幕上不再有"未开始/专注中"这类小字，状态用颜色和文案表达
- 中间是大号倒计时，下面是计划时长和一条细进度条
- 进度条正下方居中一行：`已提示 N 次`
- 底部正中一个绿色主按钮：`开始 / 暂停 / 继续`
- **按下暂停后**，主按钮会向左收窄一点（112 → 92px，带 6 帧宽度动画），右侧同时淡入一个深灰的 `重置` 按钮；再点继续，重置按钮淡出、主按钮恢复原宽
- 运行中不显示重置，避免误触；另外**长按**主按钮也能直接重置本轮

### 设置（同一个页面里的面板）

点顶部「设置」，面板直接在同一个页面里切换上来 —— **不走路由、不重新加载页面**，所以每一项改完立刻生效（`applyEditedSettings()` 会同步 `sessionMs`、重排下一次提醒、按开关切换亮屏），退出时再写一次存储。

| 项目 | 范围 | 怎么改 |
| --- | --- | --- |
| 专注时长 | 10–120 分 | 点 `+` 一次 +5 分，**长按连续加速**，到 120 分封顶 |
| 最短间隔 | 1–59 分 | 点 `+/-` 一次 1 分，长按加速 |
| 最长间隔 | 最短+1 ~ 120 分 | 同上 |
| 专注时亮屏 | 开 / 关 | 开关（switch），关掉更省电 |
| 试一下震动 | — | 一个小的「试一下震动」胶囊，点了震两下，确认手环马达正常 |

存储 key 是 `focus_buzz_settings_v3`，退出应用、重启手环都还在。底部的「保存并返回」会再存一次并回到主界面。

> 旧版本（v3 及以前）用 `router.push` 打开独立的设置页，返回时依赖 `onShow` 重新读存储，改完时长不会立刻生效 —— 这是上一版"设置好像没生效"的结构性原因，现在整块改掉了。

### 关于"熄屏后会不会被杀"

会。快应用的计时器在**熄屏/退到后台后会被系统挂起**（Vela 只允许 `system.audio` / `system.request` / `system.geolocation` 三类应用申请后台驻留，番茄钟不属于它们）。所以：

- `专注时亮屏 = 开`：靠 `brightness.setKeepScreenOn(true)` 让屏幕一直亮着，计时器就不会被挂起——**这是准点震动的唯一可靠办法**，代价是费电
- `专注时亮屏 = 关`：省电，但熄屏期间不会震动；等你抬腕亮屏时，应用会在 `onShow` 里补一次：错过了提醒就先震两下并进入 10 秒变灰（`catchUp()`）
- 不管哪种，重新亮屏后剩余时间都按真实时间重新算，不会因为挂起而错乱

所以想"一整天准点提醒"就得开亮屏；想省电就当"抬手才提醒"的版本用。

### 药丸屏适配

手环 9 是 192×490 的药丸屏，上下各有约 60px 的圆弧。页面不是简单矩形排版：

- 页面上下各留 46px / 34px 的安全边距（用两个定高占位块，不用 padding，避免某些渲染路径下高度被算错）
- 所有内容宽度压在 170px 以内，居中排布，圆弧里不放任何文字
- 顶部只有居中的设置胶囊，底部提示、`已提示 N 次`、按钮行都离下弧留足距离
- 截图直接用皮肤自带的 `foreground.png` 遮罩合成，一眼能看出有没有被切

---

## 二、目录结构

```
小米手环软件开发/
├─ src/
│  ├─ manifest.json            应用配置（包名 com.band.focusbuzz，designWidth=192，只有一个页面）
│  ├─ app.ux                   应用入口（onCreate/onDestroy）
│  ├─ config-watch.json        设备类型配置（手表/手环，空对象）
│  ├─ common/
│  │  ├─ logo.png              图标
│  │  ├─ vibrate.js            震动封装：buzzTwice / buzzOnce / buzzDone
│  │  └─ settings.js           storage 读写 + 默认值 + 夹紧（10~120 分等）
│  └─ pages/
│     └─ index/index.ux        唯一页面：主界面 + 内嵌设置面板（倒计时 + 随机提醒 + 10 秒变灰状态机）
├─ build.ps1                   打包（给手环装的正包，designWidth=192）
├─ preview.ps1                 打包（给模拟器看的预览包，designWidth=466）
├─ dist/                       打包产物：装手环用这个
├─ preview-rpk/                预览产物：只在模拟器里用
└─ tools/
   ├─ emulator-setup.js        下载模拟器镜像 + 建虚拟设备（Vela_Band9 / Vela_Preview）
   ├─ run-emulator.js          启动模拟器 → 装包 → 运行（日志写 emulator.log）
   ├─ install.ps1              把 dist 里最新的 rpk 装进正在跑的模拟器
   ├─ set-manifest.js          临时改 designWidth / 路由入口
   ├─ shot.ps1                 从模拟器抓帧缓冲截图 → tools\clean-shot.py 归一到 192×490
   ├─ clean-shot.py            等比缩放到 192×490，或按 1:1 居中裁
   ├─ device-shot.py           把截图合成到 xiaomi_band 皮肤机身上（281×820）
   ├─ dev/set-demo.py          切 AUTO_START / DEMO_FAST 两个调试开关
   └─ device-*.png             上面那四张图
```

---

## 三、打包

```powershell
# 第一次要先装依赖
npm install

# 给手环装的正包 -> dist\com.band.focusbuzz.debug.1.0.0.rpk
powershell -File .\build.ps1
```

> **为什么不能直接 `npm run build`？**
> 本项目路径里带 `#`（`#文档收纳文件夹`），而 `aiot-toolkit` 内部用 webpack 打包，webpack 把路径里的 `#` 当成 loader 字符串的分隔符，于是报
> `Unable to resolve loader I:\系统\文档\??ruleSet[1].rules[0].use[0]#文档收纳文件夹\...\babel-loader\lib\index.js`。
> `build.ps1` 用 `subst` 把项目临时映射成 `X:\` 这种干净盘符，打包完再解除映射，从而绕开这个坑。
> 脚本还会检查 `aiot build` 的输出（它报错时退出码依然是 0）以及 `dist` 里 rpk 的时间戳，打包失败会直接报错，不会拿旧包糊弄你。

---

## 四、在电脑上预览（模拟器）

### 1. 搭一次模拟器环境（约 620 MB，只需一次）

```powershell
$env:VVD_NAME='Vela_Preview'; $env:VVD_WIDTH='466'; $env:VVD_HEIGHT='490'; $env:VVD_SKIN='none'
node tools\emulator-setup.js
```

- 镜像来自小米官方 CDN，实测 ~10 MB/s，全套大约 1 分钟
- 预览只用 `Vela_Preview`（466×490 画布）；想要"手环机身外壳"的窗口，可以再建一块带皮肤的 `Vela_Band9`

### 2. 打预览包 + 跑起来

```powershell
powershell -File .\preview.ps1                  # 生成 preview-rpk\com.band.focusbuzz.preview.rpk
$env:VVD_NAME='Vela_Preview'
node tools\run-emulator.js                      # 后台启动，日志在 tools\emulator.log
powershell -File .\tools\install.ps1 -Rpk preview-rpk\com.band.focusbuzz.preview.rpk
powershell -File .\tools\shot.ps1 -OutFile shot.png            # 截图 -> tools\shot.png（192×490）
python tools\device-shot.py tools\shot.png tools\device.png    # 合成到机身图上
```

> **为什么预览要单独打个包？**
> vela 4.0 的模拟器镜像把快应用画布**固定成 466×466 的方屏**（手表尺寸），跟虚拟设备里写的宽度无关；这正是"模拟器看起来是方的"的原因。
> 所以 `designWidth=466` 时 1 设计像素 = 1 物理像素，我们那套 192 宽的设计在画布上居中显示，抓图后**居中裁 192 宽**就得到手环上的真实效果；
> `dist\` 里的正包仍然是 `designWidth=192`，装到 192×490 的手环上才是 1:1。

> **`pm install` 的坑**：包已经装过时再 `pm install` 会"成功"但保留旧代码。`tools\install.ps1` 因此每次都先 `pm uninstall` 再推包安装。
> **换包后要重启模拟器**：Vela 没有 `am force-stop`（只有 `am start/stop`），`am stop` 不会卸载已经跑起来的 quickapp 实例，所以改动较大时最稳的是杀掉模拟器重新 `node tools\run-emulator.js`（它会自动装包并启动）。

### 3. 模拟器里已经验证过的行为

- 应用安装并启动：`[qapp] quickapp_state_trans: com.band.focusbuzz: [toFG]-->[forground]`
- 震动真的下发：`[AIOTJS] [__vibrate:40] [vibration] set mode short`
- 亮屏接口可用：`[brightness] brightness_cb status: 0, val:1`
- 存储正常：改完设置重启应用，值还在
- 提醒循环：`DEMO_FAST=true` 下拍到了"专注中（白）→ 提醒 → 倒计时变灰 10 秒 → 变回白色"的完整切换

模拟器没有触摸注入（`adb shell input` 不存在），所以主界面留了两个调试开关：

```js
const AUTO_START = false   // true：启动就自动开始一轮
const DEMO_FAST = false    // true：随机间隔固定 12 秒，方便看提醒/变灰全过程
```

`tools\dev\set-demo.py on|off` 可以一次改这两个开关并重新打包。

> 当前演示窗口里跑的就是 `AUTO_START=true` + `DEMO_FAST=true` 的版本，每 12 秒震一次给你看节奏；
> `dist\` 里的正包这两个开关都是 `false`，装到手上就是真实 5–15 分钟随机。

---

## 五、装到小米手环 9 NFC

第三方快应用**不能直接装到手环**（小米运动健康没有入口），目前有两条非官方路线，都有风险，自行判断：

### 路线 A：表盘自定义工具（免 root，推荐先用这条）

1. 手环先和手机正常配对，手机端装"表盘自定义工具"
2. 用它把 `dist\com.band.focusbuzz.debug.1.0.0.rpk` 推到手表（工具里有"安装快应用/第三方应用"入口）
3. 装完在手环应用列表里能找到「专注震动」

### 路线 B：Xposed 模块（需要 root 或 LSPatch）

1. 手机装国际版小米运动健康 **3.30.1i**
2. 装 LSPosed 模块 **Wearable Debug**（无 root 可用 LSPatch 打包）
3. 在"关于 → 用户协议"里输入包名安装 rpk

### 已知风险

- 手环固件更新后，这些口子随时可能被堵
- 装非官方应用有概率卡 logo / 变砖，没把握就别装
- 一旦出问题官方保修可能不认

---

## 六、平台限制（写代码时踩到的）

| 限制 | 说明 | 本项目怎么处理 |
| --- | --- | --- |
| 震动只有两档 | 手环 9/9 Pro 只支持 `vibrator.vibrate({mode:'long'|'short'})`，`vibrator.start/stop` 是 Watch S5 才有 | 用多次 `short` + `setTimeout(240ms)` 拼出"两下"的节奏 |
| 不能后台跑 | 快应用后台只允许 audio/request/geolocation 三类 feature，计时器熄屏会被挂起 | 亮屏开关（keepScreenOn）+ `onShow` 用时间差补算 |
| 包体要小 | 手环内存紧张 | 全部纯 JS/UX，无第三方库，成品 20.2 KB |
| NFC/SE 用不了 | 第三方应用拿不到 NFC 权限 | 本项目不需要；NFC 版和标准版对开发没区别 |
| 屏幕 192×490 药丸屏 | 上下各约 60px 圆弧，不能按矩形排 | 上下各留定高安全区，内容全在中间 |
| 触摸事件有限 | 只有 touchstart/touchmove/touchend/click/longpress/swipe | 长按重置、长按加速都基于 `ontouchstart`/`ontouchend` + 定时器 |
| 模拟器是方屏 | vela 4.0 镜像画布固定 466×466，和手环 192×490 比例不同 | 预览用 `designWidth=466` 的包 + 居中裁 192，真机用 `designWidth=192` |

---

## 七、还要在真机上确认的事

- [ ] `designWidth=192` 在手环上的实际缩放是否 1:1（模拟器画布固定 466，没法验证这一条）
- [ ] 震动节奏（240ms 间隔的两次短震 / 一下短震）手感是否合适，要不要调 `PULSE_GAP`
- [ ] `setKeepScreenOn(true)` 在真机上是否真的能一直不熄屏
- [ ] 关掉亮屏后，抬腕亮屏补震的时机是否符合直觉
- [ ] 手环省电策略会不会在 60~120 分钟专注中途杀掉应用
- [ ] 表盘自定义工具对 `minPlatformVersion: 1060` 是否有要求

## 更新记录

### v5（实机反馈后的调整）

- **整体放大**：字号、按钮、卡片的基准尺寸整体放大约 1.3 倍（倒计时 46→58/34，主按钮 160×52，设置胶囊 108×34，设置卡片 170×64、加减键 40×40）。
- **暂停后的双按钮**：点暂停时主按钮从 160 宽收窄到 84，右侧同时长出 84 宽的重置按钮，两个按钮宽度一致、水平居中；点继续或重置后又收回去。
- **提醒更明显**：手环 9 的 @system.vibrator 只有 long/short 两种模式，没有强度参数，所以改成连震三下（间隔 200ms）来加强存在感；休息结束回到专注仍是轻震一下，一轮结束是两下长震。
- **屏幕自适应**：启动时读 @system.device.getInfo() 的 windowWidth，按 windowWidth / 192 折算缩放系数（手环上为 1），换到别的尺寸设备上界面比例也不会跑偏。

### v1.1

- **应用图标重绘**：淡蓝圆形渐变底 + 白色振动闹钟（	ools/make_icon.py 生成 src/common/logo.png，192×192）。
- **设置页底部**加了灰色小字 @1TRhez. 2026 v1.1；为了塞下这行，四张卡片高度收到 66，可视区 293，不再出现截断。
- **包版本**：ersionName 1.1.0 / ersionCode 2，产物文件名随之变成 com.band.focusbuzz.debug.1.1.0.rpk。


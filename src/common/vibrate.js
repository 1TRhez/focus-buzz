import vibrator from '@system.vibrator'

// 手环 9 的 vibrator 只支持 mode: 'long' | 'short'，没有强度参数。
// 想让提醒更明显，只能靠"长震 + 脉冲个数"。
const PULSE_GAP = 260
const LONG_GAP = 420

function shortPulse() {
  try {
    vibrator.vibrate({ mode: 'short' })
  } catch (err) {
    console.log('vibrate short failed: ' + err)
  }
}

function longPulse() {
  try {
    vibrator.vibrate({ mode: 'long' })
  } catch (err) {
    console.log('vibrate long failed: ' + err)
  }
}

// 提醒：连震三下长震，最长的一档
export function buzzTwice() {
  longPulse()
  setTimeout(function () {
    longPulse()
    setTimeout(function () {
      longPulse()
    }, PULSE_GAP)
  }, PULSE_GAP)
}

// 休息结束、回到专注：轻轻一下
export function buzzOnce() {
  shortPulse()
}

// 一轮专注结束：两下长震
export function buzzDone() {
  longPulse()
  setTimeout(function () {
    longPulse()
  }, LONG_GAP)
}

export { longPulse, shortPulse }

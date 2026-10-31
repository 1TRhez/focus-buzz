import storage from '@system.storage'

export const STORAGE_KEY = 'focus_buzz_settings_v3'

export const DEFAULTS = {
  sessionMin: 60,
  minGap: 5,
  maxGap: 15,
  keepAwake: true
}

// 把存储里读到的值夹到合法区间，并且保证 minGap < maxGap
export function sanitize(raw) {
  const s = raw || {}

  let sessionMin = Number(s.sessionMin)
  if (!sessionMin || sessionMin < 10) {
    sessionMin = DEFAULTS.sessionMin
  }
  if (sessionMin > 120) {
    sessionMin = 120
  }

  let minGap = Number(s.minGap)
  if (!minGap || minGap < 1) {
    minGap = DEFAULTS.minGap
  }
  if (minGap > 59) {
    minGap = 59
  }

  let maxGap = Number(s.maxGap)
  if (!maxGap || maxGap < 1) {
    maxGap = DEFAULTS.maxGap
  }
  if (maxGap <= minGap) {
    maxGap = minGap + 1
  }
  if (maxGap > 120) {
    maxGap = 120
  }

  return {
    sessionMin: sessionMin,
    minGap: minGap,
    maxGap: maxGap,
    keepAwake: s.keepAwake === undefined ? DEFAULTS.keepAwake : !!s.keepAwake
  }
}

// storage.get 是回调式的，读不到就回落到默认值
export function loadSettings(callback) {
  try {
    storage.get({
      key: STORAGE_KEY,
      success: function (data) {
        let parsed = null
        try {
          parsed = data && data.value ? JSON.parse(data.value) : null
        } catch (err) {
          parsed = null
        }
        callback(sanitize(parsed))
      },
      fail: function () {
        callback(sanitize(null))
      }
    })
  } catch (err) {
    callback(sanitize(null))
  }
}

export function saveSettings(settings) {
  const clean = sanitize(settings)
  try {
    storage.set({
      key: STORAGE_KEY,
      value: JSON.stringify(clean),
      success: function () {},
      fail: function () {}
    })
  } catch (err) {
    console.log('save settings failed: ' + err)
  }
  return clean
}

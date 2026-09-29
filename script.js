// --- Utility ---
/**
 * AbortController の signal を監視できる中断可能な sleep
 */
function abortableSleep(ms, signal) {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(id);
      resolve();
    }, { once: true });
  });
}

function updateLog(msg, isError=false) {
  const area = document.getElementById('logArea');
  // 時:分のみ表示（秒は表示しない）
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const time = `${h}:${m.toString().padStart(2, '0')}`;
  area.textContent += `【${time}】 ${msg}\n`;
  area.scrollTop = area.scrollHeight;
}
function getToken() {
  return document.getElementById('token').value.trim();
}
function getLines(id) {
  return document.getElementById(id).value
    .split('\n').map(l=>l.trim()).filter(l=>l);
}

// --- Storage Utility ---
const STORAGE_KEYS = {
  token: 'dmtool_token',
  userIds: 'dmtool_userIds',
  groupNames: 'dmtool_groupNames',
  sendMessage: 'dmtool_sendMessage',
  iconImage: 'dmtool_iconImage',
  sendOnCreate: 'dmtool_sendOnCreate',
  sendOnAdd: 'dmtool_sendOnAdd'
};
function saveToStorage(key, value) {
  try { localStorage.setItem(key, value); }
  catch (e) {}
}
function loadFromStorage(key) {
  return localStorage.getItem(key) || '';
}

// --- Icon Preview ---
function updateIconPreview() {
  const b64 = loadFromStorage(STORAGE_KEYS.iconImage);
  const img = document.getElementById('iconPreview');
  const btn = document.getElementById('clearIconBtn');
  const box = document.getElementById('iconPreviewBox');
  const placeholder = document.getElementById('iconPreviewPlaceholder');
  const fileName = document.getElementById('iconFileName');
  if (b64) {
    img.src = b64.startsWith('data:') ? b64 : 'data:image/png;base64,' + b64;
    img.style.display = 'block';
    btn.style.display = 'inline-block';
    placeholder.style.display = 'none';
    fileName.textContent ||= '保存済み画像';
  } else {
    img.removeAttribute('src');
    img.style.display = 'none';
    btn.style.display = 'none';
    placeholder.style.display = 'grid';
    fileName.textContent = '画像未選択';
  }
  // ファイル選択欄の値もリセット
  document.getElementById('iconImage').value = '';
}

// --- Restore on Load ---
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('token').value       = loadFromStorage(STORAGE_KEYS.token);
  document.getElementById('userIds').value     = loadFromStorage(STORAGE_KEYS.userIds);
  document.getElementById('groupNames').value  = loadFromStorage(STORAGE_KEYS.groupNames);
  document.getElementById('sendMessage').value = loadFromStorage(STORAGE_KEYS.sendMessage);
  updateIconPreview();
  document.getElementById('sendOnCreateToggle').checked =
    localStorage.getItem(STORAGE_KEYS.sendOnCreate) === 'true';
  document.getElementById('sendOnAddToggle').checked =
    localStorage.getItem(STORAGE_KEYS.sendOnAdd) === 'true';
});

// --- Input Save ---
document.getElementById('token').addEventListener('input', e =>
  saveToStorage(STORAGE_KEYS.token, e.target.value.trim())
);
document.getElementById('userIds').addEventListener('input', e =>
  saveToStorage(STORAGE_KEYS.userIds, e.target.value)
);
document.getElementById('groupNames').addEventListener('input', e =>
  saveToStorage(STORAGE_KEYS.groupNames, e.target.value)
);
document.getElementById('sendMessage').addEventListener('input', e =>
  saveToStorage(STORAGE_KEYS.sendMessage, e.target.value)
);

// --- Icon Upload & Clear ---
document.getElementById('iconImage').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) {
    // 何も選択せずキャンセルした場合は何もしない（プレビューもストレージも変更しない）
    updateIconPreview(); // ただしinput[type=file]の値はリセット
    return;
  }
  document.getElementById('iconFileName').textContent = file.name;
  const fr = new FileReader();
  fr.onload = () => {
    const dataUrl = fr.result;
    const b64 = dataUrl.split(',')[1];
    saveToStorage(STORAGE_KEYS.iconImage, b64);
    updateIconPreview();
  };
  fr.readAsDataURL(file);
});
document.getElementById('clearIconBtn').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEYS.iconImage);
  document.getElementById('iconImage').value = '';
  updateIconPreview();
  updateLog('アイコンを削除しました');
});

// --- Toggle Save ---
document.getElementById('sendOnCreateToggle').addEventListener('change', e =>
  localStorage.setItem(STORAGE_KEYS.sendOnCreate, e.target.checked)
);
document.getElementById('sendOnAddToggle').addEventListener('change', e =>
  localStorage.setItem(STORAGE_KEYS.sendOnAdd, e.target.checked)
);

const messageSettingsBtn = document.getElementById('messageSettingsBtn');
const messageSettingsPanel = document.getElementById('messageSettingsPanel');
messageSettingsBtn.addEventListener('click', () => {
  const isOpen = messageSettingsBtn.getAttribute('aria-expanded') === 'true';
  messageSettingsBtn.setAttribute('aria-expanded', String(!isOpen));
  messageSettingsPanel.hidden = isOpen;
});
document.addEventListener('click', e => {
  if (!e.target.closest('.message-field')) {
    messageSettingsBtn.setAttribute('aria-expanded', 'false');
    messageSettingsPanel.hidden = true;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    messageSettingsBtn.setAttribute('aria-expanded', 'false');
    messageSettingsPanel.hidden = true;
  }
});

// --- Token Show/Hide (SVGアイコン切替) ---
document.getElementById('toggleTokenBtn').addEventListener('click', function() {
  const t = document.getElementById('token');
  const icon = document.getElementById('tokenMaskIcon');
  if (t.type === 'password') {
    t.type = 'text';
    icon.innerHTML = '<svg id="icon-eye-off" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-6 0-10-8-10-8a18.4 18.4 0 0 1 5.06-5.94"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47"/><path d="M12 4c6 0 10 8 10 8a18.4 18.4 0 0 1-5.06 5.94"/></svg>';
  } else {
    t.type = 'password';
    icon.innerHTML = '<svg id="icon-eye" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>';
  }
});

// --- Rate Limit Display ---
let creationIntervalId = null;
let additionIntervalId = null;

function updateRateLimitCreation(sec) {
  const el = document.getElementById('rateLimitCreation');
  if (creationIntervalId) clearInterval(creationIntervalId);
  let remaining = sec;
  el.textContent = `グループ作成のレートリミット：${remaining}秒`;
  creationIntervalId = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(creationIntervalId);
      creationIntervalId = null;
      el.textContent = '';
    } else {
      el.textContent = `グループ作成のレートリミット：${remaining}秒`;
    }
 }, 1000);
}

function clearRateLimitCreation() {
  if (creationIntervalId) {
    clearInterval(creationIntervalId);
    creationIntervalId = null;
  }
  document.getElementById('rateLimitCreation').textContent = '';
}

function updateRateLimitAddition(sec) {
  const el = document.getElementById('rateLimitAddition');
  if (additionIntervalId) clearInterval(additionIntervalId);
  let remaining = sec;
  el.textContent = `グループ追加のレートリミット：${remaining}秒`;
  additionIntervalId = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(additionIntervalId);
      additionIntervalId = null;
      el.textContent = '';
    } else {
      el.textContent = `グループ追加のレートリミット：${remaining}秒`;
    }
  }, 1000);
}

function clearRateLimitAddition() {
  if (additionIntervalId) {
    clearInterval(additionIntervalId);
    additionIntervalId = null;
  }
  document.getElementById('rateLimitAddition').textContent = '';
}



// --- safeRequest (429/500/504 リトライ＆AbortController対応) ---
async function safeRequest(requestFn, url, data, config, signal, updateRLFn) {
  while (true) {
    try {
      const res = data != null
        ? await requestFn(url, data, config)
        : await requestFn(url, config);
      return res;
    } catch (e) {
      if (signal.aborted) throw e;
      const status = e.response?.status;
      if (status === 429) {
        const wait = (e.response.data.retry_after || 1) * 1000;
        updateLog(`レートリミット: ${wait/1000}秒待機`);
        updateRLFn(Math.ceil(wait/1000));
        await abortableSleep(wait, signal);
        updateRLFn(0);
        continue;
      }
      if (status === 500) {
        updateLog('サーバーエラー500: 30秒待機', true);
        await abortableSleep(30000, signal);
        continue;
      }
      if (status === 504) {
        updateLog('サーバーエラー504: 10秒待機', true);
        await abortableSleep(10000, signal);
        continue;
      }
      if (status === 401) {
        updateLog('認証エラー401：トークンが無効です。処理を停止します。', true);
        throw e;
      }
      throw e;
    }
  }
}

// --- Controllers ---
let createController = null;
let addController    = null;
let sendController   = null;

// --- グループ作成処理 ---
async function createLoop(names, iconB64, signal) {
  updateLog('グループ作成開始');
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const msgTemplate = document.getElementById('sendMessage').value.trim();
  const sendOnCreate = document.getElementById('sendOnCreateToggle').checked;

  try {
    while (!signal.aborted) {
      for (let i = 0; i < 10 && !signal.aborted; i++) {
        // ① チャネル作成
        const res = await safeRequest(
          axios.post,
          'https://discord.com/api/v9/users/@me/channels',
          { recipients: [] },
          { headers: { Authorization: getToken(), 'Content-Type': 'application/json' }, signal },
          signal,
          updateRateLimitCreation
        );
        const cid = res.data.id;
        updateLog(`作成：チャネル ${cid}`);

        // ② 名前・アイコン設定
        const body = iconB64
          ? { name: pick(names), icon: `data:image/png;base64,${iconB64}` }
          : { name: pick(names) };
        await safeRequest(
          axios.patch,
          `https://discord.com/api/v9/channels/${cid}`,
          body,
          { headers: { Authorization: getToken(), 'Content-Type': 'application/json' }, signal },
          signal,
          updateRateLimitCreation
        );
        updateLog(`設定完了：${cid}`);

        // ③ 作成時メッセージ送信
        if (sendOnCreate && msgTemplate) {
          await safeRequest(
            axios.post,
            `https://discord.com/api/v9/channels/${cid}/messages`,
            { content: msgTemplate },
            { headers: { Authorization: getToken(), 'Content-Type': 'application/json' }, signal },
            signal,
            updateRateLimitCreation
          );
          updateLog(`作成時送信：${cid}`);
        }

        await abortableSleep(0, signal);
      }
      if (signal.aborted) break;
      updateLog('10件完了。10分待機');
      await abortableSleep(10 * 60 * 1000, signal);
    }
  } catch (e) {
    if (e.name === 'CanceledError') {
      updateLog('グループ作成が中断されました');
    } else {
      updateLog(`作成エラー：${e.message}`, true);
    }
  } finally {
    createController = null;
    setCreateBtnState(false);
    clearRateLimitCreation();
    updateLog('グループ作成停止');
  }
}

// 初期状態は開始ボタンとして表示
setCreateBtnState(false);
setAddBtnState(false);

function setCreateBtnState(isRunning) {
  const button = document.getElementById('createGroupBtn');
  button.textContent = isRunning ? '作成停止' : '作成開始';
  button.classList.toggle('primary', !isRunning);
  button.classList.toggle('secondary', isRunning);
}

document.getElementById('createGroupBtn').addEventListener('click', () => {
  if (createController) {
    createController.abort();
    return;
  }
  if (!getToken()) { updateLog('TOKENが必要です', true); return; }
  let names = getLines('groupNames'); if (!names.length) names = ['Default'];
  const iconB64 = loadFromStorage(STORAGE_KEYS.iconImage) || null;

  createController = new AbortController();
  clearRateLimitCreation();
  document.getElementById('logArea').textContent = '';
  setCreateBtnState(true);

  createLoop(names, iconB64, createController.signal);
});


// --- グループ追加処理 ---
async function addLoop(signal) {
  updateLog('グループ追加開始');
  const userIds = getLines('userIds');
  const names   = getLines('groupNames').length ? getLines('groupNames') : ['Default'];
  const iconB64 = loadFromStorage(STORAGE_KEYS.iconImage) || null;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const sendOnAdd   = document.getElementById('sendOnAddToggle').checked;
  const msgTemplate = document.getElementById('sendMessage').value.trim();

  try {
    while (!signal.aborted) {
      const res = await safeRequest(
        axios.get,
        'https://discord.com/api/v9/users/@me/channels',
        null,
        { headers: { Authorization: getToken() }, signal },
        signal,
        updateRateLimitAddition
      );
      const dms = res.data.filter(c => c.type === 3);
      const remain = dms.filter(g => !g.recipients.some(r => userIds.includes(r.id)));
      updateLog(`未参加グループ数：${remain.length}`);

      for (let g of remain.slice(0,10)) {
        if (signal.aborted) break;
        const cid = g.id;
        const uid = pick(userIds);

        // ユーザー追加
        await safeRequest(
          axios.put,
          `https://discord.com/api/v9/channels/${cid}/recipients/${uid}`,
          {},
          { headers: { Authorization: getToken() }, signal },
          signal,
          updateRateLimitAddition
        );
        updateLog(`ユーザー追加：${cid}`);

        // 名前・アイコン設定
        const body = iconB64
          ? { name: pick(names), icon: `data:image/png;base64,${iconB64}` }
          : { name: pick(names) };
        await safeRequest(
          axios.patch,
          `https://discord.com/api/v9/channels/${cid}`,
          body,
          { headers: { Authorization: getToken(), 'Content-Type': 'application/json' }, signal },
          signal,
          updateRateLimitAddition
        );
        updateLog(`設定完了：${cid}`);

        // 追加時メッセージ送信
        if (sendOnAdd && msgTemplate) {
          await safeRequest(
            axios.post,
            `https://discord.com/api/v9/channels/${cid}/messages`,
            { content: msgTemplate },
            { headers: { Authorization: getToken(), 'Content-Type': 'application/json' }, signal },
            signal,
            updateRateLimitAddition
          );
          updateLog(`追加時送信：${cid}`);
        }

        await abortableSleep(0, signal);
      }

      if (signal.aborted) break;
      updateLog('2分待機');
      await abortableSleep(2 * 60 * 1000, signal);
    }
  } catch (e) {
    if (e.name === 'CanceledError') {
      updateLog('グループ追加が中断されました');
    } else {
      updateLog(`追加エラー：${e.message}`, true);
    }
  } finally {
    addController = null;
    setAddBtnState(false);
    clearRateLimitAddition();
    updateLog('グループ追加停止');
  }
}

function setAddBtnState(isRunning) {
  const button = document.getElementById('addGroupBtn');
  button.textContent = isRunning ? '追加停止' : 'グループ追加開始';
  button.classList.toggle('primary', !isRunning);
  button.classList.toggle('secondary', isRunning);
}

document.getElementById('addGroupBtn').addEventListener('click', () => {
  if (addController) {
    addController.abort();
    return;
  }
  if (!getToken()) { updateLog('TOKENが必要です', true); return; }
  addController = new AbortController();
  clearRateLimitAddition();
  document.getElementById('logArea').textContent = '';
  setAddBtnState(true);

  addLoop(addController.signal);
});

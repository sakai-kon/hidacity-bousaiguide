/**
 * storage.js
 * localStorage への安全な保存・読込を行う共通ユーティリティ。
 * JSON変換エラーや容量オーバー、プライベートモードでの例外などに対応する。
 * <script type="module"> から import して使う。
 */

const STORAGE_PREFIX = "hida-bousai:";

/**
 * localStorage が実際に使えるかどうかを判定する
 */
function isStorageAvailable() {
  try {
    const testKey = `${STORAGE_PREFIX}__test__`;
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    return false;
  }
}

const STORAGE_OK = isStorageAvailable();

/**
 * 値を保存する。オブジェクトや配列はJSON文字列化して保存。
 * @param {string} key
 * @param {*} value
 * @returns {boolean} 成功したかどうか
 */
export function saveData(key, value) {
  if (!STORAGE_OK) return false;
  try {
    const json = JSON.stringify(value);
    window.localStorage.setItem(STORAGE_PREFIX + key, json);
    return true;
  } catch (err) {
    // 容量オーバー(QuotaExceededError)などをキャッチしてサイトを落とさない
    console.warn("[storage] 保存に失敗しました:", key, err);
    return false;
  }
}

/**
 * 値を読み込む。JSON変換に失敗した場合は defaultValue を返す。
 * @param {string} key
 * @param {*} defaultValue
 */
export function loadData(key, defaultValue = null) {
  if (!STORAGE_OK) return defaultValue;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[storage] 読込に失敗しました:", key, err);
    return defaultValue;
  }
}

/**
 * 指定キーを削除する
 */
export function removeData(key) {
  if (!STORAGE_OK) return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (err) {
    console.warn("[storage] 削除に失敗しました:", key, err);
  }
}

/**
 * このサイトが保存したデータをすべて削除する
 */
export function clearAllData() {
  if (!STORAGE_OK) return;
  try {
    const keys = Object.keys(window.localStorage).filter((k) =>
      k.startsWith(STORAGE_PREFIX)
    );
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch (err) {
    console.warn("[storage] 全削除に失敗しました:", err);
  }
}

export const storageAvailable = STORAGE_OK;

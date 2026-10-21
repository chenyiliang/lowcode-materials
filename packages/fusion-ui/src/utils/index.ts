import * as ObjUtils from './object';

export { ObjUtils };

// 本文件给 Date.prototype 增加了 format 方法，需要在类型层面补充声明
declare global {
  interface Date {
    format(fmt: string): string;
  }
}

/*
 * 数组转字符串
 */
export function arrayToString(ar: Array<string | number>, symbolChar: string): string {
  let result = '';
  for (let i = 0; i < ar.length; i++) {
    result += ar[i] + symbolChar;
  }
  if (result != '') {
    result = result.substring(0, result.length - 1);
  }
  return result;
}

export function getRandomIntInclusive(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive and the minimum is inclusive
}

function getCookie(name: string): string | null {
  let arr: RegExpMatchArray | null;
  const reg = new RegExp(`(^| )${name}=([^;]*)(;|$)`);
  if ((arr = document.cookie.match(reg))) {
    // 保持原实现（unescape，虽为遗留全局函数但运行时行为与 decodeURIComponent 不同）
    return unescape(arr[2]);
  } else {
    return null;
  }
}

export function getLanguage(): string | null {
  return getCookie('languageSet');
}

const loadMap: Record<string, Promise<unknown>> = {};

export function loadScriptAndCss(
  { jses = [], csses = [] }: { jses?: string[]; csses?: string[] },
  // once 参数保留在原签名里（调用方可能传），本实现未使用
  _once?: boolean,
): Promise<unknown> {
  const key = `${JSON.stringify(jses)}_${JSON.stringify(csses)}`;
  // 原实现用 `if (loadMap[key])` 判断是否已加载过；loadMap 现在带类型，
  // Promise 恒为真值，故显式用 key 存在性判断，语义与原先一致（命中缓存直接返回）。
  if (Object.prototype.hasOwnProperty.call(loadMap, key)) {
    return loadMap[key];
  }
  const promise = new Promise<boolean>((resolve) => {
    const head = document.getElementsByTagName('head')[0];
    csses
      // .filter(url => !document.querySelector(`link[href="${url}"]`))
      .forEach((url) => {
        const ref = document.createElement('link');
        ref.rel = 'stylesheet';
        ref.type = 'text/css';
        ref.href = url;
        head.appendChild(ref);
      });
    // jses = jses.filter(url => !document.querySelector(`script[src="${url}"]`));
    // 没有loadMap[key] 的情况指的是资源没通过现函数加载，并且已经存在
    // if (!jses.length && !loadMap[key]) {
    //   resolve(true);
    // }
    jses.forEach((url, index, array) => {
      const ref = document.createElement('script');
      ref.type = 'text/javascript';
      ref.src = url;
      ref.async = false;
      if (index === array.length - 1) {
        ref.onload = () => {
          resolve(true);
        };
      }
      document.body.appendChild(ref);
    });
  });
  loadMap[key] = promise;
  return promise;
}

// 快速id生成器
function gid(len?: number): string {
  // 随机ID生成
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  const uuid: string[] = [];
  let i;
  const radix = chars.length;

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
  } else {
    // rfc4122, version 4 form
    let r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16);
        uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
      }
    }
  }
  return uuid.join('');
}

// 随机ID生成
export function getId(): string {
  return gid(8);
}

// 为日期添加格式化功能
Date.prototype.format = function (fmt: string): string {
  // author: meizz
  const o: Record<string, number> = {
    'M+': this.getMonth() + 1, // 月份
    'd+': this.getDate(), // 日
    'h+': this.getHours(), // 小时
    'm+': this.getMinutes(), // 分
    's+': this.getSeconds(), // 秒
    'q+': Math.floor((this.getMonth() + 3) / 3), // 季度
    S: this.getMilliseconds(), // 毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, `${this.getFullYear()}`.substr(4 - RegExp.$1.length));
  for (const k in o)
    if (new RegExp(`(${k})`).test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? `${o[k]}` : `00${o[k]}`.substr(`${o[k]}`.length),
      );
  return fmt;
};

// 深度克隆
export function clone<T>(obj: T): T {
  let result = obj;
  if (obj != null && typeof obj === 'object') {
    result = JSON.parse(JSON.stringify(obj));
  }
  return result;
}

export function measureText(
  text: string,
  style?: { fontSize?: string; fontFamily?: string } | null,
): { width: number; height: number } {
  let lDiv = document.getElementById('measureTextFake');
  if (!lDiv) {
    lDiv = document.createElement('div');
    lDiv.id = 'measureTextFake';
    document.body.appendChild(lDiv);
  }

  if (style != null) {
    if (style.fontSize) lDiv.style.fontSize = style.fontSize;
    if (style.fontFamily) lDiv.style.fontFamily = style.fontFamily;
  }
  lDiv.style.position = 'absolute';
  lDiv.style.left = '-1000px';
  lDiv.style.top = '-100px';
  lDiv.style.padding = '0 3px';
  lDiv.style.visibility = 'hidden';

  lDiv.innerHTML = text;

  const lResult = {
    width: lDiv.clientWidth,
    height: lDiv.clientHeight,
  };

  return lResult;
}

// 提取url参数
export function getUrlParam(name: string): string | null {
  return (
    decodeURIComponent(
      (new RegExp(`[?|&]${name}=([^&;]+?)(&|#|;|$)`, 'i').exec(location.search) || [
        undefined,
        '',
      ])[1].replace(/\+/g, '%20'),
    ) || null
  );
}

export const getByPath = (obj: unknown, path = ''): unknown => {
  path = path.replace(/\[(\S+?)]/g, '.$1');
  return path.split('.').reduce<unknown>((p, c) => (p as Record<string, unknown>) && (p as Record<string, unknown>)[c], obj);
};

export const setByPath = (obj: unknown, path = '', value: unknown): unknown => {
  path = path.replace(/\[(\S+?)]/g, '.$1');
  return path.split('.').reduce<unknown>((p, c, i, arr) => {
    if (i === arr.length - 1 && p) {
      (p as Record<string, unknown>)[c] = value;
      return obj;
    }
    return (p as Record<string, unknown>) && (p as Record<string, unknown>)[c];
  }, obj);
};

export function transferProps(
  props: Record<string, unknown>,
  keys?: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  keys &&
    keys.forEach((key) => {
      out[key] = props[key];
    });
  return out;
}

export function isEditorEnv(props: { __designMode?: string }): boolean {
  const { __designMode } = props;
  return __designMode === 'design';
}

// 数组去重
export function uniqueArray<T>(arr: T[]): T[] {
  return arr.filter((item, index, arr) => {
    // 当前元素，在原始数组中的第一个索引==当前索引值，否则返回当前元素
    return arr.indexOf(item, 0) === index;
  });
}

export function getContentParentElement(ele: any, i = 0): any {
  if (!ele || i > 100) {
    return;
  }
  i++;
  if (ele.parentElement && ele.clientHeight <= ele.parentElement.clientHeight) {
    return getContentParentElement(ele.parentElement, i);
  }
  return ele;
}

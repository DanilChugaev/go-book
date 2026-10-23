// Пост-сборка: критический CSS в <head> + отложенная загрузка полного
// стилевого файла + обновление MD5-ревизий PWA service worker.
//
// VuePress собирает сайт в один общий стилевой файл (~92 КБ), а при
// cssCodeSplit: false он целиком блокирует рендер каждой страницы.
// Скрипт после `vuepress build docs`:
//   1. извлекает из полного CSS критический подмножество (токены,
//      типографика, navbar, hero, контент, сайдбар) и инлайнит его
//      в <head> каждой HTML-страницы сайта;
//   2. превращает блокирующий <link rel="stylesheet"> в
//      preload + onload-swap с noscript-фолбэком — полный файл
//      догружается параллельно и подменяет inline-стили;
//   3. подставляет fetchpriority="high" у hero-изображения, если
//      сборка его не прописала (элемент LCP);
//   4. пересчитывает MD5-ревизии изменённых HTML-файлов в
//      service-worker.js — иначе workbox не установил бы PWA.
//
// book-print.html (исходник PDF/EPUB) не трогаем: книжный pipeline
// работает от него и от своих book.css.

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDirectory = resolve(rootDirectory, 'docs/.vuepress/dist');
const distPath = process.argv[2] ? resolve(process.argv[2]) : distDirectory;

if (!existsSync(distPath)) {
  console.error(`Директория сборки не найдена: ${distPath}`);
  process.exit(1);
}

// ---------------------------------------------------------------- CSS parse

// Минимальный парсер: правила с медиа-контекстом. Прыжок по строкам
// учитывает экранированные кавычки (\\") — иначе data-URI с кавычками
// сбивают счётчик скобок и правила приписываются не к тому @media.
// Возвращает правила с offset-ами в исходном файле: порядок и байты
// критического CSS совпадают с оригиналом (каскад не меняется).
export function parseRules(css) {
  const rules = [];
  let i = 0;
  const mediaStack = [];
  while (i < css.length) {
    const c = css[i];
    if (c === '}' && mediaStack.length > 0) {
      mediaStack.pop();
      i += 1;
      continue;
    }
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    const ruleStart = i;
    const brace = css.indexOf('{', i);
    if (brace === -1) break;
    const prelude = css.slice(i, brace).trim();
    let k = brace + 1;
    let depth = 1;
    while (k < css.length && depth > 0) {
      const ch = css[k];
      if (ch === '"' || ch === "'") {
        let q = k + 1;
        while (q < css.length) {
          if (css[q] === '\\') q += 2;
          else if (css[q] === ch) {
            q += 1;
            break;
          } else q += 1;
        }
        k = q;
        continue;
      }
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      k += 1;
    }
    i = k;
    if (
      prelude.startsWith('@media') ||
      prelude.startsWith('@supports') ||
      prelude.startsWith('@layer')
    ) {
      // Закрытая скобка @media уже «съедена» depth-сканом, поэтому
      // стек пополняется и очищается явно вокруг рекурсии.
      mediaStack.push(prelude);
      if (css.slice(brace + 1, k - 1).trim()) {
        for (const r of parseRules(css.slice(brace + 1, k - 1))) {
          // Смещения и медиа-контекст пересчитываем в координатах исходника.
          const base = brace + 1;
          r.start += base;
          r.end += base;
          r.mediaChain = [...mediaStack, ...r.mediaChain];
          rules.push(r);
        }
      }
      mediaStack.pop();
    } else if (
      prelude.startsWith('@keyframes') ||
      prelude.startsWith('@font-face')
    ) {
      rules.push({
        selector: prelude,
        mediaChain: [...mediaStack],
        start: ruleStart,
        end: k,
        keyframes: true,
      });
    } else if (prelude) {
      rules.push({
        selector: prelude,
        mediaChain: [...mediaStack],
        start: ruleStart,
        end: k,
      });
    }
  }
  return rules;
}

const norm = s =>
  s
    .replace(/\[data-v-[0-9a-fA-F]+\]/g, '')
    .replace(/\[\s*([^\s=\]]+)\s*=\s*['"]?([^'"\]]*)['"]?\s*\]/g, '[$1=$2]')
    .replace(/\s+/g, ' ')
    .trim();

// ------------------------------------------------------------------- выбор

// Точные совпадения по частям селектора (элементы и базовые селекторы).
const EXACT_PARTS = new Set([
  'html',
  'body',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'a',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'th',
  'td',
  'tr',
  'blockquote',
  'img',
  'hr',
  'pre',
  'code',
  'strong',
  'em',
]);

// Подстроковые маркеры: попадают в критический CSS все правила, чей
// prelude содержит маркер (включая групповые селекторы).
const SUBSTRING_MARKERS = [
  '.vp-navbar', // navbar, items, item
  '.vp-site-logo',
  '.vp-site-name',
  '.vp-toggle-sidebar-button',
  '.vp-toggle-color-mode-button',
  '.book-version',
  '.book-download-navbar',
  '.search-box',
  '.vp-back-to-top-button',
  '.vp-home',
  '.vp-hero',
  '#main-title',
  '.vp-footer',
  '.vp-page',
  '.vp-theme-container',
  '.vp-sidebar',
  '[vp-content]',
  '#content',
  'class*=language-',
  '.code-block-with-title',
  '[data-theme',
  // Контент активно использует ::: tip и ::: warning — их рамки и
  // иконки видны в первом кадре, поэтому критичные; иконки
  // неиспользуемых типов (info, note, important, caution, details)
  // уходят в отложенную загрузку.
  '.hint-container.tip',
  '.hint-container.warning',
  '.hint-container>.hint-container-title',
  '.hint-container .hint-container-title',
];

// Панель результатов поиска и её содержимое отрисовываются только
// после того, как пользователь начал поиск; элементы dropdown-меню
// навбара — только при наведении/клике; пагинация страницы — в её
// низу. На первый кадр всё это не влияет, поэтому даже при общих
// маркерах (.search-box, .vp-navbar, .vp-page) вычитается.
// ВАЖНО: правило, скрывающее dropdown (display:none), остаётся
// критическим — иначе закрытое меню отобразится до загрузки CSS.
const EXCLUDE_MARKERS = [
  '.search-box__panel',
  '.search-box__page',
  '.search-box__chapter',
  '.search-box__results',
  '.search-box__close',
  '.search-box__retry',
  '.search-box__state',
  '.vp-navbar-dropdown-item',
  '.vp-navbar-dropdown-subitem',
  '.vp-navbar-dropdown-subtitle',
  '.vp-navbar-dropdown-title-mobile',
  '.vp-navbar-dropdown-wrapper:not(.mobile).open',
  '.vp-page-nav',
];

// Отображаемый размер правила в байтах.
const ruleSize = (css, r) => r.end - r.start;

export function isCritical(css, rule) {
  if (rule.keyframes) return false;
  if (rule.mediaChain.some(m => m.includes('print'))) return false;
  if (EXCLUDE_MARKERS.some(m => rule.selector.includes(m))) return false;
  if (rule.selector === ':root') {
    // Только блоки, определяющие дизайн-токены темы (--vp-c-*: ...).
    // Внутренние токены компонентов (--back-to-top-*, --code-copy-icon,
    // --nprogress-c и т.п.) на первое отрисовывание не влияют —
    // их значения лишь ссылаются на var(--vp-c-*), а это не определение.
    return /--vp-c-[a-z-]+\s*:/.test(css.slice(rule.start, rule.end));
  }
  if (rule.selector === '.hint-container') return true;
  const parts = rule.selector.split(',').map(norm);
  if (parts.some(p => EXACT_PARTS.has(p))) return true;
  return SUBSTRING_MARKERS.some(m => rule.selector.includes(m));
}

// Порядок правил и их байты — ровно как в исходном CSS: каскад и
// спецификность не меняются, сериализовать заново не нужно.
export function extractCritical(css) {
  const rules = parseRules(css);
  return rules
    .filter(r => isCritical(css, r))
    .map(r => {
      let out = css.slice(r.start, r.end);
      for (let i = r.mediaChain.length - 1; i >= 0; i -= 1) {
        out = `${r.mediaChain[i]}{${out}}`;
      }
      return out;
    })
    .join('');
}

// ------------------------------------------------------------- статистика

function criticalBucket(rule) {
  const s = rule.selector;
  if (s === ':root') return 'design tokens';
  if (s.includes('[data-theme')) return 'theme light/dark blocks';
  if (
    s.includes('class*=language-') ||
    s.includes('.code-block-with-title') ||
    s.includes('#content')
  )
    return 'code blocks';
  if (
    s.includes('.vp-navbar') ||
    s.includes('.vp-site-') ||
    s.includes('.vp-toggle-') ||
    s.includes('.book-version') ||
    s.includes('.book-download') ||
    s.includes('.search-box') ||
    s.includes('.vp-back-to-top')
  )
    return 'navbar & search';
  if (
    s.includes('.vp-home') ||
    s.includes('.vp-hero') ||
    s.includes('#main-title') ||
    s.includes('.vp-footer')
  )
    return 'home page';
  if (
    s.includes('.vp-page') ||
    s.includes('.vp-sidebar') ||
    s.includes('.vp-theme-container') ||
    s.includes('[vp-content]')
  )
    return 'content & sidebar';
  return 'typography';
}

export function printStats(css) {
  const rules = parseRules(css);
  const buckets = new Map();
  let total = 0;
  const excludedLarge = [];
  for (const r of rules) {
    const size = ruleSize(css, r);
    if (isCritical(css, r)) {
      total += size;
      buckets.set(
        criticalBucket(r),
        (buckets.get(criticalBucket(r)) ?? 0) + size,
      );
    } else if (size >= 100) {
      excludedLarge.push({ size, sel: r.selector.slice(0, 90) });
    }
  }
  console.log(`\nКритический CSS: ${total} байт из ${css.length}`);
  for (const [name, bytes] of [...buckets.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${bytes}b  ${name}`);
  }
  console.log('  Исключённые правила >= 100b (проверка, что ничего важного):');
  excludedLarge
    .sort((a, b) => b.size - a.size)
    .slice(0, 20)
    .forEach(e => console.log(`    ${e.size}b  ${e.sel}`));
}

// ------------------------------------------------------- HTML-трансформация

const CRITICAL_STYLE_ID = 'vp-critical-css';
const STYLE_LINK_RE =
  /<link rel="(?:stylesheet|preload)" href="([^"]+assets\/style-[^"]+\.css)"/;

async function collectHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collectHtmlFiles(path)));
    else if (entry.name.endsWith('.html') && entry.name !== 'book-print.html')
      files.push(path);
  }
  return files;
}

const md5 = text => createHash('md5').update(text).digest('hex');

export async function transformHtmlFile(filePath, cssCache) {
  let html = await readFile(filePath, 'utf8');
  // Идемпотентность: если критический блок уже на месте, файл не трогаем.
  if (html.includes(`id="${CRITICAL_STYLE_ID}"`)) return { status: 'already' };

  const match = html.match(STYLE_LINK_RE);
  if (!match) return { status: 'no-link' };
  const href = match[1];
  const fileName = href.split('/assets/').pop();
  if (!criticalCache.has(fileName)) {
    if (!cssCache.has(fileName)) {
      cssCache.set(
        fileName,
        await readFile(join(distPath, 'assets', fileName), 'utf8'),
      );
    }
    criticalCache.set(fileName, extractCritical(cssCache.get(fileName)));
  }
  const critical = criticalCache.get(fileName);

  const styleBlock = `<style id="${CRITICAL_STYLE_ID}">${critical}</style>`;
  const deferred = `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
  const styleTag = `<link rel="stylesheet" href="${href}">`;
  const preloadTag = `<link rel="preload" href="${href}" as="style">`;

  if (!html.includes(styleTag) && !html.includes(preloadTag)) {
    // Link на style-*.css есть, но в неожиданном формате: VuePress
    // изменил разметку — лучше упасть, чем деплоить блокирующий CSS.
    return { status: 'no-match', href };
  }
  const original = html;
  if (html.includes(styleTag))
    html = html.replace(styleTag, `${styleBlock}${deferred}`);
  if (html.includes(preloadTag)) html = html.replace(preloadTag, '');
  // Элемент LCP (hero-изображение) грузим с высоким приоритетом, если
  // сборка не прописала атрибут.
  html = html.replace(
    /<img(?![^>]*\bfetchpriority)([^>]*?)class="vp-hero-image"/,
    m =>
      m.replace(
        'class="vp-hero-image"',
        'fetchpriority="high" class="vp-hero-image"',
      ),
  );
  if (html === original) return { status: 'already' };

  await writeFile(filePath, html);
  return { status: 'transformed', before: original.length, after: html.length };
}

// Экстракция критического CSS — дорогая операция, а CSS общий:
// парсим один файл один раз.
const criticalCache = new Map();

// ------------------------------------------------------------- service worker

// Workbox фиксирует MD5 каждого precache-файла в манифесте service worker.
// После переписывания HTML хеши устаревают, и установка PWA упадёт —
// пересчитываем ревизии для всех изменённых страниц.
export async function patchServiceWorker(rewritten) {
  const swPath = join(distPath, 'service-worker.js');
  if (!existsSync(swPath)) {
    console.warn('service-worker.js не найден — пропуск обновления ревизий');
    return;
  }
  let sw = await readFile(swPath, 'utf8');
  let patched = 0;
  for (const { rel } of rewritten) {
    const hash = md5(await readFile(join(distPath, ...rel.split('/')), 'utf8'));
    const escaped = rel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`url:"${escaped}",revision:"[a-f0-9]{32}"`);
    if (re.test(sw)) {
      sw = sw.replace(re, `url:"${rel}",revision:"${hash}"`);
      patched += 1;
    } else {
      console.warn(`  нет precache-записи: ${rel}`);
    }
  }
  if (patched > 0) await writeFile(swPath, sw);
  console.log(
    `service-worker.js: обновлено ${patched} из ${rewritten.length} precache-ревизий`,
  );
}

// -------------------------------------------------------------------- main

export async function main() {
  console.log('post-build: критический CSS + non-blocking stylesheet');
  const files = (await collectHtmlFiles(distPath)).sort();
  if (!files.length) {
    console.error('post-build: HTML-файлы в директории сборки не найдены');
    process.exit(1);
  }

  // Статистика по первому файлу: один общий CSS у всех страниц.
  const cssCache = new Map();
  const probe = await readFile(files[0], 'utf8');
  const probeMatch = probe.match(STYLE_LINK_RE);
  if (probeMatch) {
    const fileName = probeMatch[1].split('/assets/').pop();
    cssCache.set(
      fileName,
      await readFile(join(distPath, 'assets', fileName), 'utf8'),
    );
    printStats(cssCache.get(fileName));
  } else {
    console.error('post-build: в head не найден link на assets/style-*.css');
    process.exit(1);
  }

  const rewritten = [];
  const problems = [];
  let already = 0;
  for (const file of files) {
    const rel = file
      .slice(distPath.length + 1)
      .split(sep)
      .join('/');
    const res = await transformHtmlFile(file, cssCache);
    if (res.status === 'transformed') {
      rewritten.push({ rel });
      console.log(`  ${rel}: ${res.before} -> ${res.after} байт`);
    } else if (res.status === 'already') {
      already += 1;
    } else {
      problems.push(`${rel}: ${res.status}`);
    }
  }
  if (problems.length) {
    console.error(
      'post-build: неожиданные файлы (VuePress изменил разметку head?):',
    );
    problems.forEach(p => console.error(`  ${p}`));
    process.exit(1);
  }
  if (!rewritten.length) {
    // Повторный прогон по готовой сборке — не ошибка.
    console.log(
      `post-build: критический CSS уже на месте (${files.length} файлов), без изменений`,
    );
    return;
  }

  await patchServiceWorker(rewritten);
  console.log('post-build: готово');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}

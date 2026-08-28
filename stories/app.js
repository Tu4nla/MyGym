const $ = (selector) => document.querySelector(selector);

let catalog = null;
let currentBook = null;
let currentChapter = null;

const state = {
  theme: localStorage.getItem('adk-theme') || 'dark',
};

const BOOK_UI = {
  p201: {
    cover: 'assets/covers/p201-cover-v2.webp',
    intro: 'Năm 2012, tám nữ sinh chuyển vào phòng 201 của một khu ký túc xá từng bị bỏ trống nhiều năm. Những câu chuyện cũ quanh căn phòng nhanh chóng khiến những đêm đầu tiên của họ trở nên khác thường.',
  },
  'ma-ki-su': {
    cover: 'assets/covers/ma-ki-su-cover-v2.webp',
    intro: 'Trương An Huy, 22 tuổi, cộng tác viên tòa soạn Âm Dương, bắt đầu rong ruổi khắp nơi để viết một series về những chuyện ma và giai thoại dân gian.',
  },
  'an-hong-ngai': {
    cover: 'assets/covers/an-hong-ngai-cover-v2.webp',
    intro: 'Bảy năm sau những ngày ở phòng 201, Quỳnh nhận được thư mời cưới của Trâm tại Hồng Ngài, một bản miền núi xa xôi nơi một chuyến đi lấy tư liệu khác vừa mất liên lạc.',
  },
  'huyet-chung': {
    cover: 'assets/covers/huyet-chung-cover-v2.webp',
    intro: 'Vài tháng sau Hồng Ngài, một vụ án mới kéo Thi và Trung trở lại những dấu vết tưởng đã khép lại, trong khi ký ức của Trung bắt đầu xuất hiện những khoảng trống.',
  },
};

const chapterTextCache = new Map();
const copiedSegmentKeys = new Set();
const copyToolState = {
  mode: 'full',
  limit: 10000,
  segments: [],
  loading: false,
  error: '',
};

function applyTheme() {
  document.body.classList.toggle('light', state.theme === 'light');
}

applyTheme();

$('#themeToggle').onclick = () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('adk-theme', state.theme);
  applyTheme();
};

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
}[char]));

const pad = (n) => String(n).padStart(2, '0');
const uiFor = (book) => BOOK_UI[book.id] || { cover: '', intro: '' };
const bookNo = (book) => catalog.books.findIndex((item) => item.id === book.id) + 1;
const chapterNo = (book, chapter) => book.chapters.findIndex((item) => item.id === chapter.id) + 1;

function parseHash() {
  const raw = location.hash.replace(/^#/, '');
  const [book, chapter] = raw.split('/');
  return { book, chapter };
}

async function init() {
  catalog = await fetch('data/catalog.json').then((response) => response.json());
  renderLibrary();
  route();
}

window.addEventListener('hashchange', route);

function renderLibrary() {
  const grid = $('#bookGrid');
  grid.innerHTML = catalog.books.map((book, index) => {
    const ui = uiFor(book);
    return `
      <section class="book-card" style="--book-glow:${book.glow}" data-book="${book.id}">
        <div class="book-poster-wrap">
          <img class="book-poster" src="${esc(ui.cover)}" alt="Poster ${esc(book.title)}" loading="${index < 2 ? 'eager' : 'lazy'}">
        </div>
        <div class="book-card-copy">
          <span class="book-no">QUYỂN ${pad(index + 1)}</span>
          <h2>${esc(book.title)}</h2>
          <p>${esc(ui.intro)}</p>
        </div>
      </section>`;
  }).join('');

  document.querySelectorAll('.book-card').forEach((element) => {
    element.onclick = () => { location.hash = element.dataset.book; };
  });
}

function route() {
  const { book, chapter } = parseHash();
  window.scrollTo(0, 0);

  if (!book) {
    showLibrary();
    return;
  }

  currentBook = catalog.books.find((item) => item.id === book);
  if (!currentBook) {
    showLibrary();
    return;
  }

  if (!chapter) {
    showBook(currentBook);
    return;
  }

  currentChapter = currentBook.chapters.find((item) => item.id === chapter);
  if (!currentChapter) {
    showBook(currentBook);
    return;
  }

  showChapter(currentBook, currentChapter);
}

function showLibrary() {
  $('#libraryView').classList.remove('hidden');
  $('#bookView').classList.add('hidden');
  $('#readerView').classList.add('hidden');
  document.title = 'Âm Dương Kí — Horror Universe';
}

function showBook(book) {
  $('#libraryView').classList.add('hidden');
  $('#readerView').classList.add('hidden');

  const view = $('#bookView');
  const ui = uiFor(book);
  view.classList.remove('hidden');
  view.innerHTML = `
    <button class="icon-button" onclick="location.hash=''" aria-label="Về thư viện">←</button>
    <header class="book-header">
      <div class="book-detail-poster-wrap">
        <img class="book-detail-poster" src="${esc(ui.cover)}" alt="Poster ${esc(book.title)}">
      </div>
      <div class="book-header-copy">
        <p class="eyebrow">QUYỂN ${pad(bookNo(book))}</p>
        <h1>${esc(book.title)}</h1>
        <p class="desc">${esc(ui.intro)}</p>
        <button id="openCopyTool" class="copy-tool-trigger" type="button">⧉ Sao chép truyện</button>
      </div>
    </header>
    <section id="copyTool" class="copy-tool hidden" aria-live="polite"></section>
    <div class="chapter-list">
      ${book.chapters.map((chapter, index) => `
        <section class="chapter-row" onclick="location.hash='${book.id}/${chapter.id}'">
          <h3>Chương ${index + 1} - ${esc(chapter.title)}</h3>
        </section>`).join('')}
    </div>`;

  $('#openCopyTool').onclick = () => openCopyTool(book);
  document.title = `${book.title} — Âm Dương Kí`;
}

async function showChapter(book, chapter) {
  $('#libraryView').classList.add('hidden');
  $('#bookView').classList.add('hidden');

  const view = $('#readerView');
  view.classList.remove('hidden');
  const number = chapterNo(book, chapter);

  view.innerHTML = `
    <nav class="reader-nav"><button onclick="location.hash='${book.id}'">← ${esc(book.title)}</button></nav>
    <header class="reader-head"><h1>Chương ${number} - ${esc(chapter.title)}</h1></header>
    <section id="storyBody" class="story-body"><p>Đang mở bản thảo…</p></section>
    <footer class="reader-footer" id="readerFooter"></footer>`;

  const text = await fetchChapterText(chapter);
  $('#storyBody').innerHTML = renderStory(text);
  renderFooter(book, chapter);
  localStorage.setItem('adk-last', `${book.id}/${chapter.id}`);
  document.title = `Chương ${number} - ${chapter.title} — ${book.title}`;
  updateProgress();
}

function renderStory(text) {
  return text.split(/\n\s*\n/).map((raw) => {
    const paragraph = raw.trim();
    if (!paragraph) return '';
    if (paragraph === '***') return '<div class="scene-break">✦ ✦ ✦</div>';
    if (paragraph.startsWith('> ')) return `<p class="note">${esc(paragraph.slice(2)).replace(/\n/g, '<br>')}</p>`;
    const dialogue = /^[-–—]/.test(paragraph);
    return `<p${dialogue ? ' class="dialogue"' : ''}>${esc(paragraph).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

function renderFooter(book, chapter) {
  const index = book.chapters.findIndex((item) => item.id === chapter.id);
  const prev = book.chapters[index - 1];
  const next = book.chapters[index + 1];
  const prevBtn = prev
    ? `<button onclick="location.hash='${book.id}/${prev.id}'">← Chương ${index} - ${esc(prev.title)}</button>`
    : '<span></span>';
  const nextBtn = next
    ? `<button onclick="location.hash='${book.id}/${next.id}'">Chương ${index + 2} - ${esc(next.title)} →</button>`
    : `<button onclick="location.hash='${book.id}'">Mục lục →</button>`;

  $('#readerFooter').innerHTML = prevBtn + nextBtn;
}

function fetchChapterText(chapter) {
  if (!chapterTextCache.has(chapter.file)) {
    chapterTextCache.set(chapter.file, fetch(chapter.file).then((response) => {
      if (!response.ok) throw new Error(`Không tải được ${chapter.file}`);
      return response.text();
    }));
  }
  return chapterTextCache.get(chapter.file);
}

function normalizePlainText(text) {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/^>\s?/, ''))
    .join('\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function loadBookChapters(book) {
  const texts = await Promise.all(book.chapters.map((chapter) => fetchChapterText(chapter)));
  return book.chapters.map((chapter, index) => ({
    chapter,
    index,
    text: normalizePlainText(texts[index]),
  }));
}

function formatFullBook(book, chapters) {
  const body = chapters.map(({ chapter, index, text }) => (
    `Chương ${index + 1} - ${chapter.title}\n${text}`
  )).join('\n\n');
  return `Tên truyện - ${book.title}\n\n${body}`.trim();
}

function formatSingleChapter(book, chapterData) {
  const { chapter, index, text } = chapterData;
  return `Tên truyện - ${book.title}\n\nChương ${index + 1} - ${chapter.title}\n${text}`.trim();
}

function splitByCharacters(text, limit) {
  const source = text.trim();
  if (!source) return [];
  if (source.length <= limit) return [source];

  const chunks = [];
  let cursor = 0;

  while (cursor < source.length) {
    const remaining = source.length - cursor;
    if (remaining <= limit) {
      chunks.push(source.slice(cursor).trim());
      break;
    }

    const hardEnd = cursor + limit;
    const minPreferred = cursor + Math.floor(limit * 0.58);
    const windowText = source.slice(cursor, hardEnd + 1);
    const candidates = [
      windowText.lastIndexOf('\n\n'),
      windowText.lastIndexOf('\n'),
      windowText.lastIndexOf('. '),
      windowText.lastIndexOf('! '),
      windowText.lastIndexOf('? '),
      windowText.lastIndexOf(' '),
    ].filter((index) => index >= minPreferred - cursor);

    let relativeEnd = candidates.length ? Math.max(...candidates) : limit;
    if (relativeEnd <= 0) relativeEnd = limit;

    let absoluteEnd = cursor + relativeEnd;
    const boundary = source.slice(absoluteEnd, absoluteEnd + 2);
    if (/^[.!?]\s$/.test(boundary)) absoluteEnd += 1;

    const chunk = source.slice(cursor, absoluteEnd).trim();
    if (chunk) chunks.push(chunk);

    cursor = absoluteEnd;
    while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
  }

  return chunks;
}

function splitByWords(text, limit) {
  const source = text.trim();
  if (!source) return [];

  const matches = [...source.matchAll(/\S+/g)];
  if (matches.length <= limit) return [source];

  const chunks = [];
  for (let start = 0; start < matches.length; start += limit) {
    const endWordIndex = Math.min(start + limit, matches.length);
    const startOffset = matches[start].index;
    const endOffset = endWordIndex < matches.length ? matches[endWordIndex].index : source.length;
    const chunk = source.slice(startOffset, endOffset).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

function countWords(text) {
  return (text.match(/\S+/g) || []).length;
}

function segmentKey(book, mode, limit, index) {
  return `${book.id}:${mode}:${limit || 0}:${index}`;
}

function copyModeLabel(mode) {
  return ({
    full: 'Copy full truyện',
    chars: 'Theo số ký tự',
    words: 'Theo số từ',
    chapters: 'Theo chương',
  })[mode];
}

async function openCopyTool(book) {
  const tool = $('#copyTool');
  tool.classList.remove('hidden');
  tool.scrollIntoView({ behavior: 'smooth', block: 'start' });
  copyToolState.mode = 'full';
  copyToolState.error = '';
  copyToolState.segments = [];
  await generateCopySegments(book);
}

function closeCopyTool() {
  const tool = $('#copyTool');
  if (tool) tool.classList.add('hidden');
}

function renderCopyTool(book) {
  const tool = $('#copyTool');
  if (!tool) return;

  const isLimited = copyToolState.mode === 'chars' || copyToolState.mode === 'words';
  const unit = copyToolState.mode === 'chars' ? 'ký tự' : 'từ';
  const totalChars = copyToolState.segments.reduce((sum, segment) => sum + segment.text.length, 0);
  const totalWords = copyToolState.segments.reduce((sum, segment) => sum + countWords(segment.text), 0);

  tool.innerHTML = `
    <div class="copy-tool-head">
      <div>
        <p class="eyebrow">CÔNG CỤ SAO CHÉP</p>
        <h2>${esc(book.title)}</h2>
        <p>Xuất plain text theo format <strong>Tên truyện → Chương → Nội dung</strong>.</p>
      </div>
      <button class="copy-close" type="button" id="closeCopyTool" aria-label="Đóng">×</button>
    </div>

    <div class="copy-mode-tabs" role="tablist" aria-label="Kiểu sao chép">
      ${['full', 'chars', 'words', 'chapters'].map((mode) => `
        <button type="button" class="copy-mode ${copyToolState.mode === mode ? 'active' : ''}" data-copy-mode="${mode}">
          ${copyModeLabel(mode)}
        </button>`).join('')}
    </div>

    ${isLimited ? `
      <div class="copy-limit-row">
        <label for="copyLimit">Giới hạn mỗi đoạn (${unit})</label>
        <div class="copy-limit-controls">
          <input id="copyLimit" type="number" min="1" step="1" inputmode="numeric" value="${copyToolState.limit}" placeholder="Ví dụ: 10000">
          <button id="generateCopy" type="button" class="copy-generate" ${copyToolState.loading ? 'disabled' : ''}>
            ${copyToolState.loading ? 'Đang tạo…' : 'Generate'}
          </button>
        </div>
        <p class="copy-help">Tool ưu tiên ngắt ở đoạn văn / câu / khoảng trắng để hạn chế cắt giữa từ.</p>
      </div>` : ''}

    ${copyToolState.error ? `<p class="copy-error">${esc(copyToolState.error)}</p>` : ''}

    ${copyToolState.loading ? '<div class="copy-loading">Đang tải toàn bộ chương…</div>' : ''}

    ${!copyToolState.loading && copyToolState.segments.length ? `
      <div class="copy-result-head">
        <strong>${copyToolState.segments.length === 1 ? '1 phần' : `${copyToolState.segments.length} phần`}</strong>
        <span>${totalChars.toLocaleString('vi-VN')} ký tự · ${totalWords.toLocaleString('vi-VN')} từ</span>
      </div>
      <div class="copy-segment-list">
        ${copyToolState.segments.map((segment, index) => {
          const key = segmentKey(book, copyToolState.mode, copyToolState.limit, index);
          const copied = copiedSegmentKeys.has(key);
          return `
            <button type="button" class="copy-segment ${copied ? 'copied' : ''}" data-copy-index="${index}" title="${segment.text.length.toLocaleString('vi-VN')} ký tự · ${countWords(segment.text).toLocaleString('vi-VN')} từ">
              <span>${esc(segment.label)}</span>
              <small>${segment.text.length.toLocaleString('vi-VN')} ký tự</small>
            </button>`;
        }).join('')}
      </div>
      <p id="copyStatus" class="copy-status" aria-live="polite"></p>` : ''}
  `;

  $('#closeCopyTool').onclick = closeCopyTool;

  tool.querySelectorAll('[data-copy-mode]').forEach((button) => {
    button.onclick = async () => {
      copyToolState.mode = button.dataset.copyMode;
      copyToolState.error = '';
      copyToolState.segments = [];
      if (copyToolState.mode === 'full' || copyToolState.mode === 'chapters') {
        await generateCopySegments(book);
      } else {
        renderCopyTool(book);
      }
    };
  });

  const generateButton = $('#generateCopy');
  if (generateButton) {
    generateButton.onclick = async () => {
      const input = $('#copyLimit');
      const value = Number.parseInt(input.value, 10);
      if (!Number.isFinite(value) || value < 1) {
        copyToolState.error = 'Hãy nhập giới hạn lớn hơn 0.';
        renderCopyTool(book);
        return;
      }
      copyToolState.limit = value;
      await generateCopySegments(book);
    };
  }

  tool.querySelectorAll('[data-copy-index]').forEach((button) => {
    button.onclick = () => copySegment(book, Number(button.dataset.copyIndex));
  });
}

async function generateCopySegments(book) {
  copyToolState.loading = true;
  copyToolState.error = '';
  renderCopyTool(book);

  try {
    const chapters = await loadBookChapters(book);

    if (copyToolState.mode === 'full') {
      copyToolState.segments = [{ label: 'Copy toàn bộ', text: formatFullBook(book, chapters) }];
    } else if (copyToolState.mode === 'chapters') {
      copyToolState.segments = chapters.map((chapterData, index) => ({
        label: `Chương ${index + 1}`,
        text: formatSingleChapter(book, chapterData),
      }));
    } else {
      const fullText = formatFullBook(book, chapters);
      const pieces = copyToolState.mode === 'chars'
        ? splitByCharacters(fullText, copyToolState.limit)
        : splitByWords(fullText, copyToolState.limit);
      copyToolState.segments = pieces.map((text, index) => ({ label: `Đoạn ${index + 1}`, text }));
    }
  } catch (error) {
    console.error(error);
    copyToolState.error = 'Không tải đủ nội dung truyện. Hãy thử lại.';
    copyToolState.segments = [];
  } finally {
    copyToolState.loading = false;
    renderCopyTool(book);
  }
}

async function writeClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  textarea.remove();
  if (!ok) throw new Error('clipboard');
}

async function copySegment(book, index) {
  const segment = copyToolState.segments[index];
  if (!segment) return;

  const status = $('#copyStatus');
  try {
    await writeClipboard(segment.text);
    copiedSegmentKeys.add(segmentKey(book, copyToolState.mode, copyToolState.limit, index));
    const button = document.querySelector(`[data-copy-index="${index}"]`);
    if (button) button.classList.add('copied');
    if (status) status.textContent = `Đã copy ${segment.label}. Bạn vẫn có thể bấm lại để copy lần nữa.`;
  } catch (error) {
    console.error(error);
    if (status) status.textContent = 'Không thể copy tự động trên trình duyệt này.';
  }
}

function updateProgress() {
  const element = $('#readingProgress');
  const max = document.documentElement.scrollHeight - innerHeight;
  element.style.width = `${max > 0 ? Math.min(100, (scrollY / max) * 100) : 0}%`;
}

window.addEventListener('scroll', updateProgress, { passive: true });

init().catch((error) => {
  console.error(error);
  $('#bookGrid').innerHTML = '<p>Không tải được thư viện truyện.</p>';
});

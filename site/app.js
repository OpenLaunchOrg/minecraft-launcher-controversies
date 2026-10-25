'use strict';

const root = document.documentElement;
function createIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#' + name);
  svg.append(use);
  return svg;
}
const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-toggle');
let userPaused = false;
try { userPaused = localStorage.getItem('open-record-motion') === 'reduced'; } catch { /* Storage is optional. */ }

function isReduced() { return userPaused || systemMotion.matches; }
function syncMotion() {
  const reduced = isReduced();
  root.dataset.motion = reduced ? 'reduced' : 'full';
  motionButton.setAttribute('aria-pressed', String(reduced));
  motionButton.disabled = systemMotion.matches;
  motionButton.querySelector('.motion-symbol').replaceChildren(createIcon(reduced ? 'play' : 'pause'));
  motionButton.querySelector('.motion-label').textContent = systemMotion.matches ? '跟随系统减少动态' : reduced ? '开启动效' : '暂停动态';
  motionButton.setAttribute('aria-label', motionButton.querySelector('.motion-label').textContent);
  motionButton.title = systemMotion.matches ? '遵循设备的减少动态设置' : reduced ? '开启动效' : '暂停动态';
  if (reduced) document.querySelectorAll('.reveal').forEach(node => node.classList.add('shown'));
}
motionButton.addEventListener('click', () => {
  userPaused = !userPaused;
  try { localStorage.setItem('open-record-motion', userPaused ? 'reduced' : 'full'); } catch { /* Storage is optional. */ }
  syncMotion();
});
systemMotion.addEventListener('change', syncMotion);
syncMotion();

// Content is visible without JavaScript. Only noninteractive headings receive reveal motion.
if ('IntersectionObserver' in window && !isReduced()) {
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('shown');
      revealObserver.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -24px 0px', threshold: 0.05 });
  document.querySelectorAll('.event h2,.section-heading,.migration-copy>h3,.launcher-heading>h2').forEach(node => {
    node.classList.add('reveal');
    revealObserver.observe(node);
  });
  root.classList.add('enhanced');
}

const chapterDates = [['2025', '.10'], ['2025', '.11'], ['2026', '.03'], ['2026', '.10'], ['2026', '.10']];
const chapters = [...document.querySelectorAll('[data-chapter]')];
let activeChapter = 0;
function activateChapter(index) {
  if (index === activeChapter) return;
  activeChapter = index;
  document.querySelectorAll('[data-scene]').forEach((scene, i) => scene.classList.toggle('active', i === index));
  document.querySelectorAll('.chapter-nav a').forEach((anchor, i) => {
    if (i === index) anchor.setAttribute('aria-current', 'step');
    else anchor.removeAttribute('aria-current');
  });
  document.querySelector('#stage-index').textContent = `${String(index + 1).padStart(2, '0')} / 05`;
  const date = document.querySelector('#stage-date');
  const month = document.createElement('span');
  month.textContent = chapterDates[index][1];
  date.replaceChildren(document.createTextNode(chapterDates[index][0]), month);
  if (!isReduced()) date.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
}
if ('IntersectionObserver' in window) {
  const chapterObserver = new IntersectionObserver(entries => {
    const entering = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (entering.length) activateChapter(Number(entering[0].target.dataset.chapter));
  }, { rootMargin: '-23% 0px -50% 0px', threshold: 0 });
  chapters.forEach(chapter => chapterObserver.observe(chapter));
}

const sources = [
  ['PCL：联机、再开', '维护者更新帖 · 2025-10-24', 'https://www.bilibili.com/opus/1127340164029349892/'],
  ['简洁联机标记约定', 'PCL Wiki · 协议文档', 'https://github.com/Meloong-Git/PCL/wiki/%E7%AE%80%E6%B4%81%E8%81%94%E6%9C%BA%E6%A0%87%E8%AE%B0%E7%BA%A6%E5%AE%9A'],
  ['PCL：联机再次暂时关闭说明', '维护者陈述 · 页面编辑于 2025-12-09，原发文时间未核实', 'https://www.bilibili.com/opus/1135872352762986504'],
  ['对 PCL 联机事件的记录', 'Neclyon · 社区个人文章 · 2025-11-28', 'https://blog.neclyon.dev/posts/my-thoughts-on-the-link-feature-being-shut-down/'],
  ['HMCL：海外下载源选项建议 #5864', '仓库 Issue 与维护者回复 · 2026-03-28', 'https://github.com/HMCL-dev/HMCL/issues/5864'],
  ['PCL 2.99.0.0 发布讨论 #9512', '维护者发布说明 · 2026-10-20', 'https://github.com/Meloong-Git/PCL/discussions/9512'],
  ['HMCL：中国大陆下载限制 #7017', '已合并代码变更 · 2026-10-20', 'https://github.com/HMCL-dev/HMCL/pull/7017'],
  ['PCL-CE：中国大陆安装限制 #3673', '已合并代码变更 · 2026-10-20', 'https://github.com/PCL-Community/PCL-CE/pull/3673'],
  ['PCLPoC 与研究报告', 'MiRin · 研究者报告与后续补充 · 2026-10-21 起', 'https://github.com/MiRinFork/PCLPoC'],
  ['PCL 公告执行路径分析', 'MrXiaoM · 静态逆向分析 · 2026-10-23，10-24 更新', 'https://www.mrxiaom.top/post/pcl-notice-rce-discovery/'],
  ['PCL：要求回应的公开讨论 #9544', '社区讨论 · 2026-10-24', 'https://github.com/Meloong-Git/PCL/discussions/9544'],
  ['PCL 上游源码仓库', '项目 README · 公开源码范围及同步方式', 'https://github.com/Meloong-Git/PCL'],
  ['有关 PCL 所谓“后门 / 漏洞”的说明', '维护者说明线索 · 核对时原页无法读取，仅由来源 10 转述计划', 'https://afdian.com/p/4ab1e3f2cecf11f1836552540025c377']
];
const sourceList = document.querySelector('#source-list');
for (const [title, provenance, url] of sources) {
  const item = document.createElement('li');
  const content = document.createElement('div');
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = title;
  link.append(createIcon('out'));
  const meta = document.createElement('small');
  meta.textContent = provenance;
  content.append(link, meta);
  item.append(content);
  sourceList.append(item);
}
const dialog = document.querySelector('#source-dialog');
const openSources = document.querySelector('#open-sources');
openSources.addEventListener('click', () => dialog.showModal());
document.querySelector('#close-sources').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => openSources.focus({ preventScroll: true }));
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});

// This demonstration updates local UI only; it never scans, imports or uploads files.
const playDemo = document.querySelector('#play-demo');
function setDemoButton(label, iconName) {
  playDemo.replaceChildren(document.createTextNode(label + ' '), createIcon(iconName));
}
const demoTitle = document.querySelector('#demo-title');
const demoDesc = document.querySelector('#demo-desc');
const demoStatus = document.querySelector('#demo-status');
const progress = document.querySelector('.demo-progress>span');
const fileLabels = [...document.querySelectorAll('[data-file]')];
const demoPhases = [
  { title: '找到旧数据，准备迁移', desc: '示意：检测 PCL2 设置与原有游戏目录。', status: '已检测到旧数据', files: ['已发现', '已发现', '待创建'] },
  { title: '保留设置，并准备备份', desc: '示意：保留已有内容，创建本次修改的备份。', status: '保留已有内容 · 备份就绪', files: ['保留已有', '目录已接入', '已创建'] },
  { title: '准备好了，继续你的世界', desc: '示意完成。真实导入不迁移账号令牌，需重新登录。', status: '迁移示意完成', files: ['已处理', '共用原目录', '备份就绪'] }
];
let demoTimer;
let demoRunning = false;
let demoStep = 0;
function renderDemo() {
  const phase = demoPhases[demoStep];
  demoTitle.textContent = phase.title;
  demoDesc.textContent = phase.desc;
  demoStatus.textContent = phase.status;
  document.querySelector('#demo-count').textContent = `${demoStep + 1} / 3`;
  progress.style.transform = `scaleX(${(demoStep + 1) / 3})`;
  fileLabels.forEach((label, index) => {
    label.textContent = phase.files[index];
    label.classList.toggle('done', demoStep > 0 || index < 2);
  });
  if (!isReduced()) demoTitle.animate([{ opacity: .3, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, easing: 'ease-out' });
}
function finishDemo() {
  demoRunning = false;
  setDemoButton('重新播放', 'refresh');
}
function queueDemo() {
  demoTimer = window.setTimeout(() => {
    if (!demoRunning) return;
    demoStep += 1;
    renderDemo();
    if (demoStep === 2) finishDemo();
    else queueDemo();
  }, 1500);
}
playDemo.addEventListener('click', () => {
  if (demoRunning) {
    window.clearTimeout(demoTimer);
    demoRunning = false;
    setDemoButton('继续演示', 'play');
    return;
  }
  if (demoStep === 2 || playDemo.textContent.includes('播放迁移')) {
    demoStep = 0;
    renderDemo();
  }
  demoRunning = true;
  setDemoButton('暂停演示', 'pause');
  queueDemo();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && demoRunning) {
    window.clearTimeout(demoTimer);
    demoRunning = false;
    setDemoButton('继续演示', 'play');
  }
});

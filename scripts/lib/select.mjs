/* 从 audit.json 选 3–5 个 demo 改动；供 brief.mjs / new-demo.mjs 复用。 */

const SEVERITY = { P0: 0, P1: 1, P2: 2 };
const CONFIDENCE = { high: 0, medium: 1, low: 2 };

// 在相同级别里优先选「用户能感知 / 主路径」的规则
const RULE_WEIGHT = {
  'a11y/reduced-motion': 0,
  'mobile/touch-hijack': 1,
  'mobile/no-touch-action': 2,
  'mobile/no-pointercancel': 3,
  'perf/layout-animation': 4,
  'a11y/clickable-div': 5,
  'a11y/input-label': 6,
  'a11y/img-alt': 7,
  'perf/blur-heavy': 8,
  'perf/transition-all': 9,
  'motion/linear-easing': 10,
  'modern/max-height-accordion': 11,
  'modern/custom-carousel': 12,
  'modern/custom-popover': 13,
};

export function selectFindings(findings, options = {}) {
  const max = options.max || 5;
  const list = Array.isArray(findings) ? findings.slice() : [];

  list.sort((a, b) => {
    return (
      (SEVERITY[a.severity] ?? 9) - (SEVERITY[b.severity] ?? 9) ||
      (RULE_WEIGHT[a.rule] ?? 99) - (RULE_WEIGHT[b.rule] ?? 99) ||
      (CONFIDENCE[a.confidence] ?? 9) - (CONFIDENCE[b.confidence] ?? 9) ||
      String(a.file).localeCompare(String(b.file)) ||
      (a.line || 0) - (b.line || 0)
    );
  });

  const selected = [];
  const usedRules = new Set();
  for (const finding of list) {
    if (usedRules.has(finding.rule)) continue;
    usedRules.add(finding.rule);
    selected.push(finding);
    if (selected.length >= max) break;
  }
  return selected;
}

export function briefMarkdown(findings, options = {}) {
  const title = options.title || 'UI 改版';
  const lines = [];
  lines.push('# Demo brief · ' + title);
  lines.push('');
  lines.push('> 由 `scripts/brief.mjs` 从体检 JSON 生成；提交前请人工复核证据与业务优先级。');
  lines.push('');
  lines.push('## selected（' + findings.length + ' 项）');
  lines.push('');
  findings.forEach((f, i) => {
    lines.push('### ' + (i + 1) + '. ' + f.title);
    lines.push('');
    lines.push('- 证据：`' + f.file + ':' + f.line + '` — `' + String(f.snippet || '').replace(/`/g, '\\`') + '`');
    lines.push('- 为什么：' + f.why);
    lines.push('- 改动：' + f.fix);
    if (f.patterns && f.patterns.length) lines.push('- 模式：' + f.patterns.join(' · '));
    lines.push('- 验收：改完后同一条规则不再命中；390px / reduced-motion / 键盘路径通过。');
    lines.push('');
  });
  lines.push('## preserve（不能动）');
  lines.push('');
  lines.push('- 文案、信息架构、品牌、logo、埋点、登录 / 支付入口');
  lines.push('- 原页面已有且可用的功能入口');
  lines.push('');
  lines.push('## constraints');
  lines.push('');
  lines.push('- 默认纯 HTML demo；React / Vue 项目交付组件片段 + `MotionKit.init`');
  lines.push('- 只使用 `library/motion-kit`；不新增运行时依赖');
  lines.push('- Before / After 使用同一份内容');
  lines.push('');
  lines.push('## 不在本轮');
  lines.push('');
  lines.push('- 未选中的体检项：留到下一轮，不混进本次 demo');
  lines.push('');
  return lines.join('\n');
}

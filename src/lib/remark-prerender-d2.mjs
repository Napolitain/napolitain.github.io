import { D2 } from '@terrastruct/d2';

const d2Options = {
  layout: 'dagre',
  themeID: 0,
  darkThemeID: 200,
  pad: 24,
  sketch: false,
};

function isD2Node(node) {
  return node?.type === 'code' && node.lang?.toLowerCase() === 'd2';
}

function hasD2Node(node) {
  if (isD2Node(node)) {
    return true;
  }

  return Array.isArray(node?.children) && node.children.some(hasD2Node);
}

async function disposeD2(d2) {
  try {
    await d2.ready;
    await d2.worker?.terminate?.();
  } catch {
    // Best-effort cleanup for @terrastruct/d2, which does not expose a public disposer.
  }
}

async function renderD2ToHtml(d2, source, salt) {
  const compiled = await d2.compile(source, d2Options);
  const rendered = await d2.render(compiled.diagram, {
    ...compiled.renderOptions,
    salt,
    noXMLTag: true,
  });
  const svg = typeof rendered === 'string' ? rendered : rendered?.svg ?? rendered?.html;

  if (typeof svg !== 'string') {
    const resultType = Object.prototype.toString.call(rendered);
    const keys = rendered && typeof rendered === 'object' ? Object.keys(rendered).join(', ') : 'none';
    throw new Error(`D2 render returned ${resultType} instead of SVG string. Keys: ${keys}`);
  }

  if (!svg.trimStart().startsWith('<svg')) {
    throw new Error(`D2 render did not return SVG markup. Preview: ${svg.slice(0, 80)}`);
  }

  return `<div class="diagram-render d2">${svg}</div>`;
}

async function transformNode(parent, file, state) {
  if (!parent || !Array.isArray(parent.children)) {
    return;
  }

  for (let index = 0; index < parent.children.length; index += 1) {
    const node = parent.children[index];

    if (isD2Node(node)) {
      try {
        const html = await renderD2ToHtml(state.d2, node.value, `d2-${state.count}`);
        state.count += 1;
        parent.children[index] = {
          type: 'html',
          value: html,
        };
      } catch (error) {
        const path = file?.path ?? 'unknown file';
        throw new Error(`Failed to prerender D2 diagram in ${path}: ${error instanceof Error ? error.message : String(error)}`);
      }
      continue;
    }

    await transformNode(node, file, state);
  }
}

export default function remarkPrerenderD2() {
  return async (tree, file) => {
    if (!hasD2Node(tree)) {
      return;
    }

    const d2 = new D2();

    try {
      await transformNode(tree, file, { count: 0, d2 });
    } finally {
      await disposeD2(d2);
    }
  };
}

import React, { useRef, useEffect, useCallback } from 'react';
import './NotionEditor.css';

/**
 * Notion-style WYSIWYG markdown editor.
 * Triggers auto-format on Space (for block types) and Enter (for list continuations).
 * Saves plain-text content with onSave called on every change.
 */
export default function NotionEditor({ initialContent, onSave, placeholder }) {
  const editorRef = useRef(null);

  // Initialise content once
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (initialContent) {
      el.innerHTML = markdownToBlocks(initialContent);
    }
    placeCursorAtEnd(el);
  }, []); // only on mount

  // Auto-format transformations on keydown
  const handleKeyDown = useCallback((e) => {
    const el = editorRef.current;
    if (!e || !el) return;

    if (e.key === ' ') {
      const block = getCurrentBlock();
      if (!block) return;
      const text = block.textContent;

      // Heading shortcuts: # , ## , ###
      const headingMatch = text.match(/^(#{1,3})$/);
      if (headingMatch) {
        e.preventDefault();
        const level = headingMatch[1].length;
        const tag = `h${level}`;
        replaceBlockWith(block, tag, '');
        return;
      }

      // Bullet list: * or -
      if (text === '*' || text === '-') {
        e.preventDefault();
        replaceBlockWith(block, 'ul-li', '');
        return;
      }

      // Numbered list: 1.
      if (/^\d+\.$/.test(text)) {
        e.preventDefault();
        replaceBlockWith(block, 'ol-li', '');
        return;
      }

      // Blockquote: >
      if (text === '>') {
        e.preventDefault();
        replaceBlockWith(block, 'blockquote', '');
        return;
      }
    }

    if (e.key === 'Enter') {
      const block = getCurrentBlock();
      if (!block) return;
      const tag = block.tagName?.toLowerCase();

      // Continue list items on enter, but break out on double-enter (empty item)
      if (tag === 'li') {
        if (block.textContent === '') {
          // Exit list
          e.preventDefault();
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          block.parentElement.parentElement
            ? block.closest('ul,ol').insertAdjacentElement('afterend', p)
            : el.appendChild(p);
          block.remove();
          setCursorInBlock(p);
          return;
        }
      }
    }
  }, []);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    // Inline markdown: bold **x**, italic _x__  — parse on every change
    applyInlineStyles(el);
    const plain = blocksToMarkdown(el);
    onSave(plain);
  }, [onSave]);

  const handlePaste = useCallback((e) => {
    // Paste as plain text to avoid HTML injections
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <div
      ref={editorRef}
      className="notion-editor"
      contentEditable
      suppressContentEditableWarning
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onPaste={handlePaste}
      data-placeholder={placeholder || 'Start writing…'}
      spellCheck
    />
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentBlock() {
  const sel = window.getSelection();
  if (!sel || !sel.anchorNode) return null;
  let node = sel.anchorNode;
  while (node && node.nodeType !== 1) node = node.parentNode;
  // Walk up to a direct child of the editor
  while (node && node.parentElement && !node.parentElement.classList.contains('notion-editor')) {
    node = node.parentElement;
  }
  return node;
}

function replaceBlockWith(block, type, content) {
  let newEl;
  if (type === 'ul-li') {
    const ul = document.createElement('ul');
    newEl = document.createElement('li');
    ul.appendChild(newEl);
    block.replaceWith(ul);
  } else if (type === 'ol-li') {
    const ol = document.createElement('ol');
    newEl = document.createElement('li');
    ol.appendChild(newEl);
    block.replaceWith(ol);
  } else if (type === 'blockquote') {
    newEl = document.createElement('blockquote');
    block.replaceWith(newEl);
  } else {
    newEl = document.createElement(type);
    block.replaceWith(newEl);
  }
  newEl.innerHTML = content || '<br>';
  setCursorInBlock(newEl);
}

function setCursorInBlock(el) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.setStart(el, 0);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function placeCursorAtEnd(el) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

// Very lightweight inline markdown: **bold** → <strong>, _italic_ → <em>
// Only runs on text nodes inside the editor to avoid destroying structure
function applyInlineStyles() {
  // Handled natively through CSS styling hints below; full inline processing
  // would require mutation observer to avoid cursor jumping. Skip for now.
}

// Convert DOM blocks back to Markdown text for storage
function blocksToMarkdown(el) {
  const lines = [];
  el.childNodes.forEach(node => {
    if (node.nodeType === 3) { lines.push(node.textContent); return; }
    const tag = node.tagName?.toLowerCase();
    const text = node.textContent;
    if (tag === 'h1') lines.push(`# ${text}`);
    else if (tag === 'h2') lines.push(`## ${text}`);
    else if (tag === 'h3') lines.push(`### ${text}`);
    else if (tag === 'blockquote') lines.push(`> ${text}`);
    else if (tag === 'ul') {
      node.querySelectorAll('li').forEach(li => lines.push(`- ${li.textContent}`));
    } else if (tag === 'ol') {
      node.querySelectorAll('li').forEach((li, i) => lines.push(`${i + 1}. ${li.textContent}`));
    } else if (tag === 'hr') lines.push('---');
    else lines.push(text); // p and others
  });
  return lines.join('\n');
}

// Convert saved markdown text to editor HTML blocks
function markdownToBlocks(md) {
  const lines = md.split('\n');
  const html = [];
  let inUl = false;
  let inOl = false;

  const closeList = () => {
    if (inUl) { html.push('</ul>'); inUl = false; }
    if (inOl) { html.push('</ol>'); inOl = false; }
  };

  lines.forEach(line => {
    if (/^### (.+)/.test(line))     { closeList(); html.push(`<h3>${line.slice(4)}</h3>`); }
    else if (/^## (.+)/.test(line)) { closeList(); html.push(`<h2>${line.slice(3)}</h2>`); }
    else if (/^# (.+)/.test(line))  { closeList(); html.push(`<h1>${line.slice(2)}</h1>`); }
    else if (/^> (.+)/.test(line))  { closeList(); html.push(`<blockquote>${line.slice(2)}</blockquote>`); }
    else if (/^- (.+)/.test(line))  {
      if (!inUl) { if (inOl) { html.push('</ol>'); inOl = false; } html.push('<ul>'); inUl = true; }
      html.push(`<li>${line.slice(2)}</li>`);
    }
    else if (/^\d+\. (.+)/.test(line)) {
      if (!inOl) { if (inUl) { html.push('</ul>'); inUl = false; } html.push('<ol>'); inOl = true; }
      html.push(`<li>${line.replace(/^\d+\. /, '')}</li>`);
    }
    else if (line === '---') { closeList(); html.push('<hr>'); }
    else if (line === '')   { closeList(); /* skip empty, p already adds spacing */ }
    else { closeList(); html.push(`<p>${line}</p>`); }
  });
  closeList();
  return html.join('') || '<p><br></p>';
}

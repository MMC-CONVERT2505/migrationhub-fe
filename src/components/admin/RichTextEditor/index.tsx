import React, { useCallback, useEffect, useRef, useState } from 'react';
import { uploadService } from '@/api/upload';
import { ApiError } from '@/api/client';

// Matches the extensions the storage service accepts; SVG is not among them.
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];
const ACCEPT_ATTR = '.png,.jpg,.jpeg,.webp';
const MAX_BYTES = 2 * 1024 * 1024;

/** Mirrors the server's blank check so the admin sees the problem before saving. */
export function isRichTextBlank(html: string): boolean {
  if (/<img\b/i.test(html)) return false;
  return (
    html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim().length === 0
  );
}

const ToolbarButton: React.FC<{
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, disabled, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    disabled={disabled}
    // Keeps focus (and the caret) inside the editor when the button is pressed.
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className="w-7 h-7 flex items-center justify-center rounded text-text-secondary hover:text-text-primary hover:bg-bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
  >
    {children}
  </button>
);

interface RichTextEditorProps {
  /** Initial HTML, read once on mount — remount via `key` to load a different answer. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

/**
 * Minimal contenteditable editor for FAQ answers. `document.execCommand` is
 * deprecated but remains the only way to do this without adding an editor
 * dependency, and every browser still implements it.
 *
 * Whatever this produces is re-sanitized server-side before storage — this
 * toolbar is for authoring convenience, never the security boundary.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write the answer…',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isEmpty, setIsEmpty] = useState(() => isRichTextBlank(value));

  // Seeded once: React must not own this subtree, or re-rendering it on every
  // keystroke would send the caret back to the start.
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    setIsEmpty(isRichTextBlank(html));
    onChange(html);
  }, [onChange]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  /** Puts the caret back before running a command — the file dialog and the link
   *  prompt both drop it, and a command with no range applies nowhere. */
  const restoreSelection = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    if (savedRange.current && el.contains(savedRange.current.commonAncestorContainer)) {
      sel.addRange(savedRange.current);
    } else {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.addRange(range);
    }
  }, []);

  const exec = useCallback(
    (command: string, arg?: string) => {
      restoreSelection();
      document.execCommand(command, false, arg);
      emit();
    },
    [emit, restoreSelection],
  );

  const handleLink = () => {
    saveSelection();
    const url = window.prompt('Link URL');
    if (!url) return;
    if (!/^(https?:\/\/|mailto:)/i.test(url)) {
      setError('Links must start with http://, https:// or mailto:.');
      return;
    }
    setError('');
    exec('createLink', url);
  };

  const handleImage = async (file: File | null) => {
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError('Use a PNG, JPG or WEBP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be 2 MB or smaller.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const { url } = await uploadService.upload(file);
      exec('insertHTML', `<img src="${url.replace(/"/g, '&quot;')}" alt="" />`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload that image.');
    } finally {
      setUploading(false);
    }
  };

  // Pasted markup would be stripped server-side anyway; inserting plain text
  // keeps what the admin sees in the box the same as what gets stored.
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    emit();
  };

  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-colors">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-bg-light">
        <ToolbarButton title="Bold" onClick={() => exec('bold')}>
          <span className="text-xs font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => exec('italic')}>
          <span className="text-xs italic font-serif">I</span>
        </ToolbarButton>

        <span className="w-px h-4 bg-border mx-1" />

        <ToolbarButton title="Bulleted list" onClick={() => exec('insertUnorderedList')}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12" />
          </svg>
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => exec('insertOrderedList')}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h1v4H3m0 6h2v1H3v1h2M9 6h12M9 12h12M9 18h12" />
          </svg>
        </ToolbarButton>

        <span className="w-px h-4 bg-border mx-1" />

        <ToolbarButton title="Add link" onClick={handleLink}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
          </svg>
        </ToolbarButton>
        <ToolbarButton title="Remove link" onClick={() => exec('unlink')}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656M4 4l16 16" />
          </svg>
        </ToolbarButton>

        <span className="w-px h-4 bg-border mx-1" />

        <ToolbarButton
          title="Insert image"
          disabled={uploading}
          onClick={() => {
            // Saved before the dialog opens — it takes focus away from the editor.
            saveSelection();
            fileRef.current?.click();
          }}
        >
          {uploading ? (
            <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h.01M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
          )}
        </ToolbarButton>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="relative">
        {isEmpty && (
          <p className="absolute top-3 left-3 text-sm text-text-secondary pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Answer"
          onInput={emit}
          onBlur={() => {
            saveSelection();
            emit();
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onPaste={handlePaste}
          className="faq-answer min-h-[160px] max-h-[60vh] overflow-y-auto px-3 py-3 text-sm text-text-primary leading-relaxed focus:outline-none"
        />
      </div>

      {error && (
        <p className="px-3 pb-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

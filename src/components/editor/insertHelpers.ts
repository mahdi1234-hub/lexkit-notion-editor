import type { LexicalEditor } from "lexical";
import { $getSelection, $isRangeSelection, $getRoot } from "lexical";

export function insertPlainText(editor: LexicalEditor, text: string) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      selection.insertText(text);
    } else {
      const root = $getRoot();
      const last = root.getLastChild();
      if (last && "append" in last) {
        // fallback: append a paragraph
      }
    }
  });
}

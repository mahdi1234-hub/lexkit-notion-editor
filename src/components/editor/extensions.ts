import {
  richTextExtension,
  historyExtension,
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  codeFormatExtension,
  blockFormatExtension,
  listExtension,
  linkExtension,
  imageExtension,
  tableExtension,
  horizontalRuleExtension,
  codeExtension,
  htmlExtension,
  markdownExtension,
  htmlEmbedExtension,
  createEditorSystem,
} from "@lexkit/editor";

export const extensions = [
  richTextExtension.configure({
    placeholder: "Start writing, or press '/' for commands...",
    classNames: {
      container: "lexkit-container",
      contentEditable: "lexkit-content",
      placeholder: "lexkit-placeholder",
    },
  }),
  historyExtension,
  boldExtension,
  italicExtension,
  underlineExtension,
  strikethroughExtension,
  codeFormatExtension,
  blockFormatExtension,
  listExtension,
  linkExtension,
  imageExtension.configure({
    defaultAlignment: "center",
    pasteListener: { insert: true, replace: true },
  }),
  tableExtension,
  horizontalRuleExtension,
  codeExtension,
  htmlExtension,
  markdownExtension,
  htmlEmbedExtension,
] as const;

export const { Provider: LexKitProvider, useEditor: useLexKitEditor } =
  createEditorSystem<typeof extensions>();

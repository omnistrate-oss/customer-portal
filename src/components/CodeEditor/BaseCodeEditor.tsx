import { FC, useEffect, useRef, useState } from "react";
import { Editor, loader, OnChange } from "@monaco-editor/react";
import { Box, IconButton, Stack } from "@mui/material";

import Tooltip from "../Tooltip/Tooltip";
import { Text } from "../Typography/Typography";

import CopyIcon from "./CopyIcon";
import CurlyBracesIcon from "./CurlyBracesIcon";
import ExitFullScreenIcon from "./ExitFullScreenIcon";
import FullScreenIcon from "./FullScreenIcon";
import LockIcon from "./LockIcon";
import { ResourceType } from "./systemParameters";
import { getSuggestionsByPrefix } from "./utils";

export type BaseCodeEditorProps = {
  value?: string;
  onChange?: OnChange;
  onBlur?: () => void;
  customSuggestions?: any[];
  shouldShowSuggestions?: boolean;
  language: "shell" | "json" | "yaml";
  isReadOnly?: boolean;
  resourceType?: ResourceType;
  height?: string;
  customTitleEnd?: React.ReactNode;
  spaces?: number;
  lineToHighlight?: number;
};

loader.init().then((monaco) => {
  monaco.editor.defineTheme("custom-dark", {
    inherit: true,
    base: "vs-dark",
    rules: [],
    colors: {
      "editor.background": "#1B2333",
    },
  });
});

const BaseCodeEditor: FC<BaseCodeEditorProps> = ({
  value = "",
  onChange = () => {},
  onBlur = () => {},
  customSuggestions,
  shouldShowSuggestions = true,
  language,
  isReadOnly,
  resourceType = "compose",
  height = "100%",
  customTitleEnd,
  spaces = 2,
  lineToHighlight,
}) => {
  const editorRef = useRef<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<any>({
    lineNumber: 1,
    column: 1,
  });
  const [decorationCollection, setDecorationCollection] = useState<any>(null);
  const [completionDisposable, setCompletionDisposable] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (completionDisposable && typeof completionDisposable.dispose === "function") {
        completionDisposable.dispose();
      }
    };
  }, [completionDisposable]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (decorationCollection) {
      decorationCollection.clear();
    }

    if (lineToHighlight !== undefined) {
      const newCollection = editorRef.current?.createDecorationsCollection([
        {
          range: {
            startLineNumber: lineToHighlight,
            startColumn: 1,
            endLineNumber: lineToHighlight,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: "highlighted-monaco-editor-line",
          },
        },
      ]);
      setDecorationCollection(newCollection);
    }
  }, [lineToHighlight]);

  return (
    <Stack id="monaco-editor-container" gap="10px" bgcolor="#1B2333" borderRadius="12px">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bgcolor="#171D2D"
        mt="10px"
        mx="12px"
        borderRadius="12px 12px 0px 0px"
        p="8px 16px"
        border="1px solid #2B3244"
      >
        <Stack direction="row" gap="5px" alignItems="center">
          {isReadOnly ? <LockIcon /> : <CurlyBracesIcon />}
          <Text weight="regular" size="xsmall" color="#FFFFFF">
            {isReadOnly ? "Readonly" : `Main.${language}`}
          </Text>
        </Stack>
        <Stack direction="row" alignItems="center">
          {customTitleEnd}
          <IconButton
            onClick={() =>
              isFullScreen
                ? document.exitFullscreen()
                : document.getElementById("monaco-editor-container")?.requestFullscreen()
            }
          >
            <Tooltip title="Full Screen">
              <span>{isFullScreen ? <ExitFullScreenIcon /> : <FullScreenIcon />}</span>
            </Tooltip>
          </IconButton>
          <IconButton
            onClick={() => {
              navigator.clipboard.writeText(value);
            }}
          >
            <Tooltip title="Copy">
              <span>
                <CopyIcon />
              </span>
            </Tooltip>
          </IconButton>
        </Stack>
      </Box>
      <Box flex="1">
        <Editor
          height={isFullScreen ? "100%" : height}
          width="100%"
          defaultLanguage={language}
          onMount={(editor) => {
            editorRef.current = editor;

            // Set Cursor Poistion in State
            editor.onDidChangeCursorPosition((e) => {
              setCursorPosition(e.position);
            });

            // Show the Suggestion Documentation/Details Automatically
            // @ts-ignore
            const { widget } = editor.getContribution("editor.contrib.suggestController");
            if (widget) {
              const suggestWidget = widget.value;
              if (suggestWidget && suggestWidget._setDetailsVisible) {
                suggestWidget._setDetailsVisible(true);
              }
            }

            // On Blur
            editor.onDidBlurEditorWidget(onBlur);
          }}
          beforeMount={(monaco) => {
            if (!shouldShowSuggestions) return;

            const disposable = monaco?.languages.registerCompletionItemProvider(language, {
              provideCompletionItems: (model, position) => {
                const text = model.getValueInRange({
                  startLineNumber: position.lineNumber,
                  startColumn: 0,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                });

                const words = text.replaceAll("\t", "").split(" ");
                const lastWord = words[words.length - 1]?.replaceAll('"', "").replaceAll("'", "") || "";

                const range = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: text.length - lastWord.length + 1,
                  endColumn: text.length + 1,
                };

                if (customSuggestions) {
                  return {
                    suggestions: customSuggestions.map((el) => ({
                      ...el,
                      kind: monaco.languages.CompletionItemKind.Variable,
                      range,
                    })),
                  };
                }

                const startsWith$sys = lastWord.startsWith("$sys");

                if (!startsWith$sys) {
                  return {
                    suggestions: [
                      {
                        label: "$sys",
                        detail: "System parameters",
                        kind: monaco.languages.CompletionItemKind.Module,
                        documentation: "System parameters",
                        insertText: "$sys",
                        range,
                      },
                    ],
                  };
                }

                const suggestions = getSuggestionsByPrefix(lastWord, resourceType).map((variable) => ({
                  label: variable.label,
                  detail: `(${variable.type}) ${variable.label}`,
                  kind: monaco.languages.CompletionItemKind.Variable,
                  documentation: variable.documentation,
                  insertText: variable.insertText,
                  range,
                }));

                return {
                  suggestions: suggestions.sort((a, b) => a.label.localeCompare(b.label)),
                };
              },
              triggerCharacters: ["$", "."],
            });

            setCompletionDisposable(disposable);
          }}
          theme="custom-dark"
          options={{
            readOnly: isReadOnly,
            minimap: {
              enabled: false,
            },
            scrollBeyondLastLine: false,
            fontSize: 15,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
            },
            tabSize: 2,
            lineNumbersMinChars: 4,
            suggest: {
              showValues: false,
            },
            contextmenu: false,
          }}
          value={value}
          onChange={onChange}
        />
      </Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="flex-end"
        gap="12px"
        bgcolor="#171D2D"
        borderRadius="0px 0px 12px 12px"
        p="8px 16px"
      >
        <Text weight="regular" size="xsmall" color="#FFFFFF">
          Ln {cursorPosition?.lineNumber}, Col {cursorPosition?.column}
        </Text>
        <Box display="flex" alignItems="center" gap="6px">
          <Box borderRadius="50%" height="8px" width="8px" bgcolor="#FFF" />
          <Text weight="regular" size="xsmall" color="#FFFFFF">
            Spaces: {spaces}
          </Text>
        </Box>
      </Box>
    </Stack>
  );
};

export default BaseCodeEditor;

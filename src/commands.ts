import * as vscode from "vscode";
import {
  createRepl,
  createTerminal,
  executeSelectionInRepl,
  loadFileInRepl,
  runFileInTerminal,
} from "./repl";
import { withEditor, withFilePath, withREPL, withRacket, withRaco } from "./utils";

function getOrDefault<K, V>(map: Map<K, V>, key: K, getDefault: () => V): V {
  const value = map.get(key);
  if (value) {
    return value;
  }
  const def = getDefault();
  map.set(key, def);
  return def;
}

function saveActiveTextEditorAndRun(f: () => void) {
  vscode.window.activeTextEditor?.document?.save().then(() => f());
}

function getTerminal(terminals: Map<string, vscode.Terminal>, filePath: string): vscode.Terminal {
  return vscode.workspace
    .getConfiguration("magicRacket.outputTerminal")
    .get("numberOfOutputTerminals") === "one"
    ? getOrDefault(terminals, "one", () => createTerminal(null))
    : getOrDefault(terminals, filePath, () => createTerminal(filePath));
}

export function runInTerminal(terminals: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    withRacket((command: string[]) => {
      const terminal = getTerminal(terminals, filePath);

      saveActiveTextEditorAndRun(() => runFileInTerminal(command, filePath, terminal));
    });
  });
}

export function testFile(terminals: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    withRaco((command: string[]) => {
      const terminal = getTerminal(terminals, filePath);

      saveActiveTextEditorAndRun(() => runFileInTerminal([...command, "test"], filePath, terminal));
    });
  });
}

export function loadInRepl(repls: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    withREPL((command: string[]) => {
      let loaded = true;
      const repl = getOrDefault(repls, filePath, () => {
        loaded = false;
        return createRepl(filePath, command);
      });
      if (loaded) {
        saveActiveTextEditorAndRun(() => loadFileInRepl(filePath, repl));
      }
    });
  });
}

export function executeSelection(repls: Map<string, vscode.Terminal>): void {
  withEditor((editor: vscode.TextEditor) => {
    withFilePath((filePath: string) => {
      withREPL((command: string[]) => {
        const repl = getOrDefault(repls, filePath, () => createRepl(filePath, command));
        executeSelectionInRepl(repl, editor);
      });
    });
  });
}

export function openRepl(repls: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    withREPL((command: string[]) => {
      const repl = getOrDefault(repls, filePath, () => createRepl(filePath, command));
      repl.show();
    });
  });
}

export function showOutput(terminals: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    const terminal = terminals.get(filePath);
    if (terminal) {
      terminal.show();
    } else {
      vscode.window.showErrorMessage("No output terminal exists for this file");
    }
  });
}

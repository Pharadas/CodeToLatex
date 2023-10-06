import * as vscode from "vscode";
import * as path from "path";
import pythonToLatex from "./parser/main";

export function activate(context: vscode.ExtensionContext) {
  let shouldShowInformationMessages = true;
  
  context.subscriptions.push(
    vscode.commands.registerCommand("code-to-latex.lineToLatex", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      let text: string = "";

      if (activeEditor) {
        text = String(
          activeEditor.document.lineAt(activeEditor.selection.active.line).text
        );
      }

      var quote = vscode.workspace.getConfiguration();
      var settings = JSON.parse(JSON.stringify(quote));

      let tex: string = "";
      try {
        text = text.replace(/^\ *(.)/g, '$1'); // remove trailing whitespace
        tex = pythonToLatex(text, settings['code_to_latex']);

      } catch (error) {
        const actions = [{ title: "Don't show again" }];

        if (shouldShowInformationMessages) {
          const result = await vscode.window.showInformationMessage(
            `Invalid Python`,
            ...actions
          );

          if (result !== null) {
            if (result === actions[0]) {
              shouldShowInformationMessages = false;
            }
          }
        }

        return;
      }

      const panel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
        "latexDisplay",
        "Latex Display",
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, "packages")),
          ],
        }
      );

      const pathToMathJaxPackage = panel.webview.asWebviewUri(
        vscode.Uri.file(
          path.join(context.extensionPath, "packages", "MathJax", "MathJax.js")
        )
      );

      panel.webview.html = getHTML(
        tex,
        text,
        pathToMathJaxPackage,
        panel.webview
      );
    })
  );
}

// When $a \ne 0$, there are two solutions to \(ax^2 + bx + c = 0\) and they are
// $$x = {-b \pm \sqrt{b^2-4ac} \over 2a}.$$
// http-equiv="Content-Security-Policy"
function getHTML(
  tex: string,
  originalLine: string,
  mathJaxPath: vscode.Uri,
  webview: vscode.Webview
): string {
  return `
		<!DOCTYPE html>
		<html>
		<head>
			<title>MathJax TeX Test Page</title>
			<!-- Copyright (c) 2010-2018 The MathJax Consortium -->
			<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
			<meta http-equiv="X-UA-Compatible" content="IE=edge" />
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<meta
				content="default-src 'none'; script-src ${webview.cspSource}"
			/>

			<script type="text/x-mathjax-config">
				MathJax.Hub.Config({
				tex2jax: {inlineMath: [["$","$"],["\\(","\\)"]]}
				});
			</script>
			<script type="text/javascript" src="${mathJaxPath}?config=TeX-AMS_HTML-full"></script>

		</head>
		<body>

		<p>
			$$${tex}$$
		</p>

		</body>
		</html>
	`;
}

export function deactivate() {}

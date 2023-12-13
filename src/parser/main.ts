import * as vscode from "vscode";
import {parse, ControlFlowGraph, Block} from "@andrewhead/python-program-analysis";

let recognizedFunctions: Record<string, string> = {}

const recognizedVariables: Record<string, string> = {
  "theta": "\\theta",
  "pi": "\\pi",
  "phi": "\\phi",
  "alpha": "\\alpha",
  "nu": "\\nu",
  "beta": "\\beta",
  "xi": "\\xi",
  "Xi": "\\Xi",
  "gamma": "\\gamma",
  "Gamma": "\\Gamma",
  "delta": "\\delta",
  "Delta": "\\Delta",
  "Pi": "\\Pi",
  "epsilon": "\\epsilon",
  "varepsilon": "\\varepsilon",
  "rho": "\\rho",
  "varrho": "\\varrho",
  "zeta": "\\zeta",
  "sigma": "\\sigma",
  "Sigma": "\\Sigma",
  "eta": "\\eta",
  "tau": "\\tau",
  "vartheta": "\\vartheta",
  "upsilon": "\\upsilon",
  "iota": "\\iota",
  "varphi": "\\varphi",
  "kappa": "\\kappa",
  "chi": "\\chi",
  "psi": "\\psi",
  "mu": "\\mu",
  "omega": "\\omega",
  "Omega": "\\Omega",
}

var userRecognizedVariables: Record<string, string> = {};

const recognizedOperators: Record<string, string> = {
  "/": "\\frac{$1}{$2}",
  "*": "$1\\cdot $2",
  "**": "{$1}^{$2}",
  "^": "{$1}^{$2}",
  "=": "$1=$2"
}

function blockToLatex(input: any): string {
  if (input.type === 'assign') {
    return blockToLatex(input.targets) + "=" + blockToLatex(input.sources);
  }

  else if (input.type === 'unop') {
    return input.op + blockToLatex(input.operand);
  }

  else if (input.type === 'list') {
    let temp = "\\begin{bmatrix}";

    for (let teno = 0; teno < input.items.length; teno++) {
      if (input.items[teno].type === 'list' || (teno < input.items.length - 1 && input.items[teno + 1].type === 'list')) {
        temp += blockToLatex(input.items[teno]);
        if (teno !== input.items.length - 1) {
          temp += "\\\\";
        }
      } else {
        temp += blockToLatex(input.items[teno]);
        if (teno !== input.items.length - 1) {
          temp += "&";
        }
      }
    }

    return temp + "\\end{bmatrix}";
  }

  else if (input.type === 'binop') {
    if (input.op in recognizedOperators) {
      let temp = recognizedOperators[input.op];
      temp = temp.replace("$1", blockToLatex(input.left));
      temp = temp.replace("$2", blockToLatex(input.right));
      return temp;
    }

    return blockToLatex(input.left) + input.op + blockToLatex(input.right);
  }

  else if (input.type === 'index') {
    return blockToLatex(input.value) + "_{" + blockToLatex(input.args) + "}";
  }

  else if (input.type === 'slice') {
    let start = "";
    let stop = "";
    let step = "";

    if (input.start !== undefined) {
      start = blockToLatex(input.start);
    }

    if (input.stop !== undefined) {
      stop = blockToLatex(input.stop);
    }

    if (input.step !== undefined) {
      step = blockToLatex(input.step);
    }

    return "_{" + start + ":" + stop + ":" + step + "}";
  }

  else if (input.type === 'tuple') {
    return blockToLatex(input.items);
  }

  else if (input.type === 'arg') {
    return blockToLatex(input.actual);
  }

  else if (input.type === 'dot') {
    let formattedName = input.name;

    if (formattedName in userRecognizedVariables) {
      formattedName = userRecognizedVariables[input.name];
    }

    if (formattedName in recognizedVariables) {
      formattedName = recognizedVariables[input.name];
    }

    if (vscode.window.activeTextEditor) {
      const currentDocument = vscode.window.activeTextEditor.document;
      const configuration = vscode.workspace.getConfiguration('', currentDocument.uri);
			if (configuration.get('codetolatex.removeObjectPrefix', {})) {
        return formattedName;
      }
    }

    return "\\text{" + blockToLatex(input.value) + "}" + "\." + formattedName;
  }

  else if (input.type === 'call') { // TODO: this should include the conversion of functions to custom latex
    if (input.arg1 !== undefined) {
      return blockToLatex(input.arg1);
    }

    let functionSignature = "";

    if (input.func.id === undefined) {
      functionSignature = input.func.name + ' ' + input.args.length;
    } else {
      functionSignature = input.func.id + ' ' + input.args.length;
    }

    if(functionSignature in recognizedFunctions) {
      let tempStr = recognizedFunctions[functionSignature];

      for (let r = 1; r < input.args.length + 1; r++) {
        tempStr = tempStr.replace("$" + r, blockToLatex(input.args[r - 1]));
      }

      return tempStr;
    }

    return blockToLatex(input.func) + "(" + blockToLatex(input.args) + ")";
  }

  else if (input.type === 'name') {
    let resultString = "";
    let h = "";
    let underscoreMatch = input.id.match(/\_/g);

    // we only change the underscore if it's a subindex (if there's only one)
    if (underscoreMatch !== null && underscoreMatch.length === 1) {
      let beforeUnderscore = input.id.match(/.*\_/g)[0];
      beforeUnderscore = beforeUnderscore.slice(0, beforeUnderscore.length - 1);
      let afterUnderscore = input.id.match(/\_.*/g)[0];
      afterUnderscore = afterUnderscore.slice(1, afterUnderscore.length);

      // we change the variable before and after the underscore
      // we give priority to the user variables
      if (beforeUnderscore in userRecognizedVariables) {
        resultString += userRecognizedVariables[beforeUnderscore];
      } else if (beforeUnderscore in recognizedVariables) {
        resultString += recognizedVariables[beforeUnderscore];
      } else {
        resultString += beforeUnderscore;
      }

      if (afterUnderscore in userRecognizedVariables) {
        resultString += "_{" + userRecognizedVariables[afterUnderscore] + "}";
      } else if (afterUnderscore in recognizedVariables) {
        resultString += "_{" + recognizedVariables[afterUnderscore] + "}";
      } else {
        resultString += "_{" + afterUnderscore + "}";
      }

      return resultString;
    }

    // make it a latex operator
    input.id = input.id.replaceAll(/\_/g, '\\_');

    // regardless of wether we changed the underscore or not, we want to 
    // check if the end value exists in our recognized variables
    if (input.id in userRecognizedVariables) {
      return userRecognizedVariables[input.id];
    }

    if (input.id in recognizedVariables) {
      return recognizedVariables[input.id];
    }
    return input.id;
  } 

  else if (input.type === 'literal') {
    return input.value;
  } else {
    let g = "";
    for (var i of input) {
      g += blockToLatex(i) + ",";
    }
    return g.slice(0, g.length - 1);
  }

  return "ERROR";
}

export default function pythonToLatex(code: string, config: any): string {
  if (config !== undefined){
    if (config.custom_functions !== undefined) {
      recognizedFunctions = config.custom_functions;
    }

    if (config.custom_variables !== undefined) {
      userRecognizedVariables = config.custom_variables;
    }
  }

  const tree = parse(code);
  const cfg = new ControlFlowGraph(tree);

  let t = cfg.blocks[0].statements;
  console.log(t);
  let f = blockToLatex(t);

  return f;
}
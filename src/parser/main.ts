import {parse, ControlFlowGraph, Block} from "@andrewhead/python-program-analysis";

// const parser = require("../node_modules/python-program-analysis");

import { log } from "console";

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
  "*": "$1$2",
  "^": "{($1)}^{$2}",
  "=": "$1=$2"
}

const operatorPrecedence: Record<string, number> = { 
  "=": 6,
  "%": 5,
  "^": 4,
  "*": 3,
  "/": 3,
  "+": 2,
  "-": 2
}

const leftAssociativeOperators: Record<string, number> = {
  "*": 1,
  "/": 1,
  "+": 1,
  "-": 1
}

const separators: Record<string, number> = {
  "%": 1,
  "^": 1,
  "*": 1,
  "/": 1,
  "+": 1,
  "-": 1,
  "[": 1,
  "]": 1,
  "(": 1,
  ")": 1,
  ",": 1,
  "=": 1,
  ">": 1,
  "<": 1
}

const keywords: Record<string, number> = {
  "and": 1,
  "as": 1,
  "assert": 1,
  "break": 1,
  "class": 1,
  "continue": 1,
  "def": 1,
  "del": 1,
  "elif": 1,
  "else": 1,
  "except": 1,
  "False": 1,
  "finally": 1,
  "for": 1,
  "from": 1,
  "global": 1,
  "if": 1,
  "import": 1,
  "in": 1,
  "is": 1,
  "lambda": 1,
  "None": 1,
  "nonlocal": 1,
  "not": 1,
  "or": 1,
  "pass": 1,
  "raise": 1,
  "return": 1,
  "True": 1,
  "try": 1,
  "while": 1,
  "with": 1,
  "yield": 1,
}

function blockToLatex(input: any): string {

  if (input.type === 'assign') {
    return blockToLatex(input.targets) + "=" + blockToLatex(input.sources);
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

  else if (input.arg1 !== undefined) {
    for (var i of input.arg1) {
      if (i.type === 'assign') {
        let g = "";
        for (let f = 0; f < i.targets.length; f++) {
          g += blockToLatex(i.targets[f]) + "=" + blockToLatex(i.sources[f]) + "\n";
        }
        return g;
      } else {
        return blockToLatex(input.arg1);
      }
    }

  } else if (input.type === 'index') {
    return blockToLatex(input.value) + "_{" + blockToLatex(input.args) + "}";
  }

  else if (input.type === 'tuple') {
    return blockToLatex(input.items);
  }

  else if (input.type === 'arg') {
    return blockToLatex(input.actual);
  }

  else if (input.type === 'dot') {
    return blockToLatex(input.value) + "." + input.name;
  }

  else if (input.type === 'call') { // TODO: this should include the conversion of functions to custom latex
    if (input.arg1 !== undefined) {
      return blockToLatex(input.arg1);
    }

    let function_signature = "";

    if (input.func.id === undefined) {
      function_signature = input.func.name + ' ' + input.args.length;
    } else {
      function_signature = input.func.id + ' ' + input.args.length;
    }

    if(function_signature in recognizedFunctions) {
      let tempStr = recognizedFunctions[function_signature];

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

    if (underscoreMatch !== null && underscoreMatch.length === 1) {
      let beforeUnderscore = input.id.match(/.*\_/g)[0];
      beforeUnderscore = beforeUnderscore.slice(0, beforeUnderscore.length - 1);
      let afterUnderscore = input.id.match(/\_.*/g)[0];
      afterUnderscore = afterUnderscore.slice(1, afterUnderscore.length);

      if (beforeUnderscore in recognizedVariables) {
        resultString += recognizedVariables[beforeUnderscore];
      } else if (beforeUnderscore in userRecognizedVariables) {
        resultString += userRecognizedVariables[beforeUnderscore];
      } else {
        resultString += beforeUnderscore;
      }

      if (afterUnderscore in recognizedVariables) {
        resultString += "_{" + recognizedVariables[afterUnderscore] + "}";
      } else if (afterUnderscore in userRecognizedVariables) {
        resultString += "_{" + userRecognizedVariables[afterUnderscore] + "}";
      } else {
        resultString += "_{" + afterUnderscore + "}";
      }

      return resultString;
    }

    input.id = input.id.replaceAll(/\_/g, '\\_');

    if (input.id in recognizedVariables) {
      return recognizedVariables[input.id];
    } else if (input.id in userRecognizedVariables) {
      return userRecognizedVariables[input.id];
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
  let f = blockToLatex(t);

  return f;
}

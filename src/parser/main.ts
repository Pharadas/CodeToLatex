const recognizedFunctions: Record<string, string> = {
  "abs 1": "|$1|",
  "sqrt 1": "\\sqrt{$1}",
  "sumar_dos_numeros 2": "$1+$2",
  "funcion_de_cruce_vectores 2": "\\vec{$1}\\times\\vec{$2}",
  "multiply 2": "(\\overrightarrow{$1}\\cdot\\overrightarrow{$2})",
  "cross 2": "(\\overrightarrow{$1}\\times\\overrightarrow{$2})",
  "max 2": "$1 > $2"
}

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

const recognizedOperators: Record<string, string> = {
  "/": "\\frac{$1}{$2}",
  "*": "$1\\cdot $2",
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

export default function pythonToLatex(lst: string): string {
  console.log("gaming time");
  let json = pythonTokenizer(lst);
  console.log(json);
  json = pythonToJson(json);
  return jsonToLatex(json);
}

function pythonTokenizer(line: string): string[] {
  console.log("original line: " + line);

  let result: string[] = [];
  let expression: string = "";
  line = line.replace(/\ /g, "");
  line = line.replace(/\*\*/g, "^");
  line = line.replace(/\_/g, "\\_");
  line = line.replace(/\=(.*)/, "\=\($1\)");

  for (let char of line) {
    if ((char in separators) || (char === " ")) {
      if (expression !== "") {
        if (expression in keywords) {
          throw new Error("Invalid python!");
        }
        if (Number.isNaN(parseInt(expression[0]))) { 
          expression = expression.replace(/^.+\./g, "");
        }
        result.push(expression);
        expression = "";
      }
      if (char !== " ") {
        result.push(char);
      }

    } else {
      expression += char;
    }
  }

  if (expression !== "") {
    if (expression in keywords) {
      throw new Error("Invalid python!");
    }
    if (Number.isNaN(parseInt(expression[0]))) { 
      expression = expression.replace(/^.+\./g, "");
    }
    result.push(expression);
  }

  return result;
}

function pythonToJson(tokens: string[]): string[] {
  let resultStack: string[] = [];
  let operatorStack: any = [];
  let functionStack: any = [];

  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];

    // * Si el token es una funcion
    if ((tokens[i + 1] === "(") && !(token in operatorPrecedence) && (token !== "(")) {
      // * Un poco tonto, pero por ahora funciona simplemente guardar si es una funcion o no
      operatorStack.push([token]);
      functionStack.push([token, 1, operatorStack.length])
    } else if (token in operatorPrecedence) {
      let lastOperator: string = operatorStack[operatorStack.length - 1];

      while (
        (lastOperator !== "(") &&
        (
          (operatorPrecedence[lastOperator] > operatorPrecedence[token]) ||
          (
            (operatorPrecedence[lastOperator] === operatorPrecedence[token]) && (token in leftAssociativeOperators)
          )
        )
      ) {
        resultStack.push(operatorStack.pop());
        lastOperator = operatorStack[operatorStack.length - 1];
      }
      operatorStack.push(token);

    } else if (token === "(") {
      operatorStack.push(token);

    } else if ((token === ")") || (token === ",")) {
      // * Ahora (si esta bien escrita la ecuacion) siempre
      // * Deberia de haber algo hasta el  "("
      while (operatorStack[operatorStack.length - 1] !== "(") {
        resultStack.push(operatorStack.pop());
      }

      // * Descartamos el "(" una vez que lo encontro, solo si estamos cerrando un parentesis,
      // * si no, entonces solo metemos todo lo de la coma al stack
      if (token === ",") {
        functionStack[functionStack.length - 1][1]++;
      } else {
        // * Primero, actualizar la funcion en el stack resultante si es que
        // * El ")" que se cerro era de una funcion
        if ((functionStack.length > 0) && (operatorStack[operatorStack.length - 2][0] === functionStack[functionStack.length - 1][0])) {
          let currentFunction = functionStack.pop();
          operatorStack[currentFunction[2] - 1].push(currentFunction[1]);
        }

        operatorStack.pop();
      }
      // * Checar si es una funcion viendo si hay algo mas en la lista
      if (typeof(operatorStack[operatorStack.length - 1]) !== "string") {
        resultStack.push(operatorStack.pop());
      }

      // * Si el token es una variable
    } else {
      resultStack.push(token);
    }
  }

  while (operatorStack.length !== 0) {
    resultStack.push(operatorStack.pop());
  }

  return resultStack;
}

function jsonToLatex(lst: any): any {
  // console.log("converting json to latex #########");

  let stack: string[] = [];
  let parenthesesAccounted: boolean = false;
  // console.log(lst);

  for (let j = 0; j < lst.length; j++) { 
    // console.log(stack);

    if (!(lst[j] in operatorPrecedence) && (typeof(lst[j]) === "string")) {
      if (lst[j] in recognizedVariables) {
        stack.push(recognizedVariables[lst[j]]);
      } else {
        stack.push(lst[j]);
      }
    } else {
      // * Si no es un string, sabemos que es una funcion
      if (typeof(lst[j]) !== "string") {
        parenthesesAccounted = true;
        let tempStr = "";
        let consumeStartIndex = stack.length - lst[j][1];

        // * La 'function signature' es solo el nombre de la funcion y la cantidad de parametros.
        // * Tal vez para lenguajes con function overloading esto no sea lo mas correcto, pero
        // * al menos para python por ahora deberia funcionar.
        let functionSignature = "" + lst[j][0] + " " + lst[j][1];
        // * Si reconozco la funcion, solo ir consumiendo los parametros para luego
        // * formatearlos como diga el json
        if (functionSignature in recognizedFunctions) {
          let tempLst: any = [];

          while (stack.length > consumeStartIndex) {
            tempLst.push(stack.splice(consumeStartIndex, 1));
          }

          tempStr = recognizedFunctions[functionSignature];
          for (let i = 0; i < tempLst.length; i++) {
            tempStr = tempStr.replace("$" + (i + 1), tempLst[i]);
          }
          stack.push(tempStr);

        // * Si no reconozco la funcion, solo meterla como tal
        } else {
          while (stack.length > consumeStartIndex) {
            tempStr += stack.splice(consumeStartIndex, 1) + ",";
          }

          tempStr = tempStr.slice(0, -1);
          stack.push(lst[j][0] + "(" + tempStr + ")");
        }

      } else {
        // console.log("###############");
        // console.log(stack);
        let op1 = stack.pop();
        let op2 = stack.pop();

        if (lst[j] in recognizedOperators) {
          let tempStr = recognizedOperators[lst[j]];
          tempStr = tempStr.replace("$1", String(op2));
          tempStr = tempStr.replace("$2", String(op1));

          stack.push(tempStr);
        } else {
          if (parenthesesAccounted) {
            parenthesesAccounted = false;
            stack.push(op2 + lst[j] + op1);
          } else {
            stack.push("(" + op2 + lst[j] + op1 + ")");
          }
        }
      }
    }
  }

  return stack.pop();
}

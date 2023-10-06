Code to latex aims to allow users to visualize their math-dense code with latex notation
![image](https://user-images.githubusercontent.com/60682906/187249869-3499267e-faad-4a8f-9d68-7e8434bde3f4.png)  

It can use user-defined functions and variables which when recognized will be converted into the given latex notation
Recognized functions should be added into the workspace's settings.json 

E.g:
```
"code_to_latex.custom_functions": {
  "abs 1": "|$1|",
  "sqrt 1": "\\sqrt{$1}",
  "multiply 2": "(\\overrightarrow{$1}\\cdot\\overrightarrow{$2})",
  "cross 2": "(\\overrightarrow{$1}\\times\\overrightarrow{$2})",
}
```

This will evaluate any functions named cross with 2 paramaters as input into:  

![image](https://user-images.githubusercontent.com/60682906/187250444-0a071bf6-6074-4ee0-99d4-e8d72b3aa3db.png)

Given a variable, it will convert any matching variable token into the appropriate latex form
E.g: (These are predefined)

```
"code_to_latex.custom_variables": {
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
```

![image](https://github.com/Pharadas/CodeToLatex/assets/60682906/fe5b89e7-2597-446c-91b3-4b7cd85aa45b)
->
![image](https://github.com/Pharadas/CodeToLatex/assets/60682906/337cf84b-d021-45c7-a23f-f46b051f60e2)

This extension also allows visualizing n-d matrices

![image](https://github.com/Pharadas/CodeToLatex/assets/60682906/3d702527-f970-4e13-87be-00cdd68f55ab)

![image](https://github.com/Pharadas/CodeToLatex/assets/60682906/4e76b69b-72d9-447a-8eae-41e661475ba1)

You can use the command "Line to Latex" when your cursor is over the line you want to convert
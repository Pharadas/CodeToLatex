# Python to latex

This unfinished project aims to allow users to see python code as latex formulas for easy reading, it uses a modified version of the shunting yard algorithm, fitted for functions of any number of parameters.  

Examples:
![image](https://user-images.githubusercontent.com/60682906/187249869-3499267e-faad-4a8f-9d68-7e8434bde3f4.png)  

It can also take in custom functions with user-defined latex formatting, these functions are defined in a json style object:  
```
{
  "cross 2": "(\\overrightarrow{$1}\\times\\overrightarrow{$2})"
}
```
This will evaluate any functions named cross with 2 paramaters as input into:  

![image](https://user-images.githubusercontent.com/60682906/187250444-0a071bf6-6074-4ee0-99d4-e8d72b3aa3db.png)

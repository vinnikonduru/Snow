import me from 'math-expressions';

export var appliedFunctionSymbols = [
  "abs", "exp", "log", "ln", "log10", "sign", "sqrt", "erf",
  "acos", "acosh", "acot", "acoth", "acsc", "acsch", "asec",
  "asech", "asin", "asinh", "atan", "atanh",
  "cos", "cosh", "cot", "coth", "csc", "csch", "sec",
  "sech", "sin", "sinh", "tan", "tanh",
  'arcsin', 'arccos', 'arctan', 'arccsc', 'arcsec', 'arccot', 'cosec',
  'arg',
  'min', 'max', 'mean', 'median',
  'floor', 'ceil', 'round',
  'sum', 'prod', 'var', 'std',
  'count', 'mod'
];

export var textToAst = new me.converters.textToAstObj({
  appliedFunctionSymbols
});

export var latexToAst = new me.converters.latexToAstObj({
  appliedFunctionSymbols
});


export function normalizeMathExpression({ value, simplify, expand = false,
  createVectors = false, createIntervals = false
}) {

  if (createVectors) {
    value = value.tuples_to_vectors();
  }
  if (createIntervals) {
    value = value.to_intervals();
  }
  if (expand) {
    value = value.expand();
  }
  if (simplify === "full") {
    return value.simplify();
  } else if (simplify === "numbers") {
    return value.evaluate_numbers();
  } else if (simplify === "numberspreserveorder") {
    return value.evaluate_numbers({ skip_ordering: true });
  }
  return value;
}

export function findFiniteNumericalValue(value) {
  // return undefined if value is undefined
  // returns null if value has a non-numerical value (including Infinity)
  // otherwise, returns numerical value

  if (value === undefined) {
    return undefined;
  }

  if (Number.isFinite(value)) {
    return value;
  }

  if (value.evaluate_to_constant !== undefined) {
    value = value.evaluate_to_constant();
    if (Number.isFinite(value)) {
      return value;
    }
  }

  // couldn't find numerical value
  return null;
}


export function convertValueToMathExpression(value) {
  if (value === undefined || value === null) {
    return me.fromAst('\uFF3F');  // long underscore
  } else if (value instanceof me.class) {
    return value;
  } else if (typeof value === "number" || typeof value === "string") {
    // let value be math-expression based on value
    return me.fromAst(value);
  } else {
    return me.fromAst('\uFF3F');  // long underscore
  }
}

export function returnNVariables(n, variablesSpecified) {

  // console.log(`return N variables`, n, variablesSpecified)

  if (!Number.isInteger(n) || n < 1) {
    return [];
  }

  let nVariablesSpecified = variablesSpecified.length;

  if (nVariablesSpecified === 0) {
    if (n === 1) {
      return [me.fromAst("x")];
    } else if (n === 2) {
      return [me.fromAst("x"), me.fromAst("y")];
    } else if (n === 3) {
      return [me.fromAst("x"), me.fromAst("y"), me.fromAst("z")]
    } else {
      let variables = [];
      for (let i = 1; i <= n; i++) {
        variables.push(me.fromAst(textToAst.convert(`x_${i}`)))
      }
      return variables;
    }
  }


  if ((new Set(variablesSpecified.map(x => x.toString()))).size
    < nVariablesSpecified) {
    console.warn('Duplicate variables specified')
  }

  if (n <= nVariablesSpecified) {
    return variablesSpecified.slice(0, n);
  }

  let variablesUsed = [...variablesSpecified.map(x => x.toString())];
  let variables = [...variablesSpecified];
  for (let i = nVariablesSpecified + 1; i <= n; i++) {
    let preferredVariables;
    if (i == 1) {
      if (n > 3) {
        preferredVariables = ["x_1"];
      } else {
        preferredVariables = ["x"];
      }
    } else if (i == 2) {
      if (n > 3) {
        preferredVariables = ["x_2", "y_2"];
      } else {
        preferredVariables = ["y", "x_2"];
      }
    } else if (i == 3) {
      if (n > 3) {
        preferredVariables = ["x_3", "y_3", "z_3"];
      } else {
        preferredVariables = ["z", "x_3", "z_3"];
      }
    } else {
      preferredVariables =
        ["x", "y", "z", "u", "v", "w", "X", "Y", "Z"].map(x => `${x}_${i}`)
    }
    let addedVariable = false;
    for (let v of preferredVariables) {
      if (!variablesUsed.includes(v)) {
        variables.push(me.fromAst(textToAst.convert(v)));
        variablesUsed.push(v);
        addedVariable = true;
        break;
      }
    }
    if (!addedVariable) {
      let v = preferredVariables[0]
      variables.push(me.fromAst(textToAst.convert(v)));
      variablesUsed.push(v);
      console.warn(`Variables added were not unique`)
    }
  }

  return variables;

}


export function mergeVectorsForInverseDefinition({ desiredVector, currentVector, workspace, workspaceKey }) {

  if (desiredVector.tree[0] === "vector" && currentVector.tree[0] === "vector") {

    let vectorAst;
    if (workspace[workspaceKey]) {
      vectorAst = workspace[workspaceKey].slice(0);
    } else {
      vectorAst = currentVector.tree.slice(0);
    }

    for (let [ind, value] of desiredVector.tree.entries()) {
      if (value !== undefined) {
        vectorAst[ind] = value;
      }
    }

    desiredVector = me.fromAst(vectorAst);
    workspace[workspaceKey] = vectorAst;

  }

  return desiredVector;
}

export function substituteUnicodeInLatexString(latexString) {

  let substitutions = [
    ['\u03B1', '\\alpha '], // 'α'
    ['\u03B2', '\\beta '], // 'β'
    ['\u03D0', '\\beta '], // 'ϐ'
    ['\u0393', '\\Gamma '], // 'Γ'
    ['\u03B3', '\\gamma '], // 'γ'
    ['\u0394', '\\Delta '], // 'Δ'
    ['\u03B4', '\\delta '], // 'δ'
    ['\u03B5', '\\epsilon '], // 'ε' should this be varepsilon?
    ['\u03F5', '\\epsilon '], // 'ϵ'
    ['\u03B6', '\\zeta '], // 'ζ'
    ['\u03B7', '\\eta '], // 'η'
    ['\u0398', '\\Theta '], // 'Θ'
    ['\u03F4', '\\Theta '], // 'ϴ'
    ['\u03B8', '\\theta '], // 'θ'
    ['\u1DBF', '\\theta '], // 'ᶿ'
    ['\u03D1', '\\theta '], // 'ϑ'
    ['\u03B9', '\\iota '], // 'ι'
    ['\u03BA', '\\kappa '], // 'κ'
    ['\u039B', '\\Lambda '], // 'Λ'
    ['\u03BB', '\\lambda '], // 'λ'
    ['\u03BC', '\\mu '], // 'μ'
    ['\u00B5', '\\mu '], // 'µ' should this be micro?
    ['\u03BD', '\\nu '], // 'ν'
    ['\u039E', '\\Xi '], // 'Ξ'
    ['\u03BE', '\\xi '], // 'ξ'
    ['\u03A0', '\\Pi '], // 'Π'
    ['\u03C0', '\\pi '], // 'π'
    ['\u03D6', '\\pi '], // 'ϖ' should this be varpi?
    ['\u03C1', '\\rho '], // 'ρ'
    ['\u03F1', '\\rho '], // 'ϱ' should this be varrho?
    ['\u03A3', '\\Sigma '], // 'Σ'
    ['\u03C3', '\\sigma '], // 'σ'
    ['\u03C2', '\\sigma '], // 'ς' should this be varsigma?
    ['\u03C4', '\\tau '], // 'τ'
    ['\u03A5', '\\Upsilon '], // 'Υ'
    ['\u03C5', '\\upsilon '], // 'υ'
    ['\u03A6', '\\Phi '], // 'Φ'
    ['\u03C6', '\\phi '], // 'φ' should this be varphi?
    ['\u03D5', '\\phi '], // 'ϕ'
    ['\u03A8', '\\Psi '], // 'Ψ'
    ['\u03C8', '\\psi '], // 'ψ'
    ['\u03A9', '\\Omega '], // 'Ω'
    ['\u03C9', '\\omega '], // 'ω'
  ]

  for(let sub of substitutions) {
    latexString = latexString.replaceAll(sub[0], sub[1])
  }

  return latexString;

}
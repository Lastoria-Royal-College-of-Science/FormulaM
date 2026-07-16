const TRAILING_CHARGE_RE = /(\d*[+-])$/;

function readDigits(text: string, startIndex: number): { value: string; endIndex: number } {
  let endIndex = startIndex;
  while (/\d/.test(text[endIndex] ?? "")) endIndex += 1;
  return { value: text.slice(startIndex, endIndex), endIndex };
}

function readElement(text: string, startIndex: number): { value: string; endIndex: number } {
  let endIndex = startIndex + 1;
  if (/[a-z]/.test(text[endIndex] ?? "")) endIndex += 1;
  return { value: text.slice(startIndex, endIndex), endIndex };
}

function splitTrailingCharge(formula: string): { body: string; charge: string } {
  const match = formula.match(TRAILING_CHARGE_RE);
  if (!match || match.index === undefined) return { body: formula, charge: "" };
  return {
    body: formula.slice(0, match.index),
    charge: match[1],
  };
}

function formatChargeForMhchem(charge: string): string {
  if (!charge) return "";
  if (charge === "+" || charge === "-") return charge;
  return `^${charge}`;
}

function formulaBodyToMhchem(body: string): string {
  if (!body) throw new Error("Formula cannot be empty.");

  const parts: string[] = [];
  let index = 0;
  let squareDepth = 0;
  let parenDepth = 0;

  while (index < body.length) {
    const char = body[index];

    if (char === "[" && /\d/.test(body[index + 1] ?? "")) {
      const digits = readDigits(body, index + 1);
      if (/^[A-Z]$/.test(body[digits.endIndex] ?? "")) {
        const element = readElement(body, digits.endIndex);
        if (body[element.endIndex] === "]") {
          parts.push(`{}^{${digits.value}}${element.value}`);
          index = element.endIndex + 1;
          continue;
        }
      }
    }

    if (/^[A-Z]$/.test(char)) {
      const element = readElement(body, index);
      parts.push(element.value);
      const digits = readDigits(body, element.endIndex);
      if (digits.value) parts.push(digits.value);
      index = digits.endIndex;
      continue;
    }

    if (char === "[") {
      squareDepth += 1;
      parts.push(char);
      index += 1;
      continue;
    }

    if (char === "]") {
      squareDepth -= 1;
      if (squareDepth < 0)
        throw new Error(`Unbalanced formula bracket near "${body.slice(index)}".`);
      parts.push(char);
      index += 1;
      continue;
    }

    if (char === "(") {
      parenDepth += 1;
      parts.push(char);
      index += 1;
      continue;
    }

    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth < 0)
        throw new Error(`Unbalanced formula parenthesis near "${body.slice(index)}".`);
      parts.push(char);
      index += 1;
      continue;
    }

    if (/\d/.test(char)) {
      const digits = readDigits(body, index);
      parts.push(digits.value);
      index = digits.endIndex;
      continue;
    }

    throw new Error(`Unsupported formula syntax near "${body.slice(index)}".`);
  }

  if (squareDepth !== 0) throw new Error("Formula contains unbalanced brackets.");
  if (parenDepth !== 0) throw new Error("Formula contains unbalanced parentheses.");

  return parts.join("");
}

export function formulaToMhchemTex(formula: string): string {
  const trimmed = formula.trim();
  if (!trimmed) throw new Error("Formula cannot be empty.");

  const { body, charge } = splitTrailingCharge(trimmed);
  return `\\ce{${formulaBodyToMhchem(body)}${formatChargeForMhchem(charge)}}`;
}

export function tryFormulaToMhchemTex(formula: string): string | null {
  try {
    return formulaToMhchemTex(formula);
  } catch {
    return null;
  }
}

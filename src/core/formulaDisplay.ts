export type FormulaDisplayToken = {
  kind: "text" | "sub" | "sup";
  text: string;
};

function readElement(text: string, startIndex: number): { value: string; endIndex: number } {
  let endIndex = startIndex + 1;
  if (/[a-z]/.test(text[endIndex] ?? "")) endIndex += 1;
  return { value: text.slice(startIndex, endIndex), endIndex };
}

function readDigits(text: string, startIndex: number): { value: string; endIndex: number } {
  let endIndex = startIndex;
  while (/\d/.test(text[endIndex] ?? "")) endIndex += 1;
  return { value: text.slice(startIndex, endIndex), endIndex };
}

function splitTrailingCharge(text: string): { body: string; charge: string } {
  const match = text.match(/(\d*[+-])$/);
  if (!match || match.index === undefined) return { body: text, charge: "" };
  return {
    body: text.slice(0, match.index),
    charge: match[1],
  };
}

export function tokenizeFormulaDisplay(formula: string): FormulaDisplayToken[] {
  const { body, charge } = splitTrailingCharge(formula);
  const tokens: FormulaDisplayToken[] = [];
  let index = 0;

  while (index < body.length) {
    const char = body[index];

    if (char === "[" && /\d/.test(body[index + 1] ?? "")) {
      const digits = readDigits(body, index + 1);
      if (/^[A-Z]$/.test(body[digits.endIndex] ?? "")) {
        const element = readElement(body, digits.endIndex);
        if (body[element.endIndex] === "]") {
          tokens.push(
            { kind: "text", text: "[" },
            { kind: "sup", text: digits.value },
            { kind: "text", text: element.value },
            { kind: "text", text: "]" },
          );
          index = element.endIndex + 1;
          continue;
        }
      }
    }

    if (/^[A-Z]$/.test(char)) {
      const element = readElement(body, index);
      tokens.push({ kind: "text", text: element.value });
      const digits = readDigits(body, element.endIndex);
      if (digits.value) tokens.push({ kind: "sub", text: digits.value });
      index = digits.endIndex;
      continue;
    }

    if (/\d/.test(char)) {
      const digits = readDigits(body, index);
      tokens.push({ kind: "sub", text: digits.value });
      index = digits.endIndex;
      continue;
    }

    tokens.push({ kind: "text", text: char });
    index += 1;
  }

  if (charge) tokens.push({ kind: "sup", text: charge });
  return tokens;
}

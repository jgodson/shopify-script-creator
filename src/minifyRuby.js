export function minifyRuby(input) {
  const captureStartingBrackets = /([\[\{\(])/g;
  const captureEndingBrackets = /([\]\}\)])/g;
  const commaOrSemicolon = /[,;]/;
  const output = {};
  let currentBrackets = [];
  const BRACKETMAP = {
    '[': ']',
    ']': '[',
    '(': ')',
    ')': '(',
    '{': '}',
    '}': '{',
  };

  // split input into lines
  let lines = input.split('\n');

  // remove whitespace lines
  lines = lines.filter((line) => line.trim().length > 0);

  for (let line in lines) {
    let content = lines[line].trim();

    // remove single line and in-line comments
    if (content[0] === '#') {
      content = "";
    } else if (content.indexOf('#') > -1) {
      const index = content.indexOf('#');
      if (content[index + 1] !== '{') {
        content = content.substring(0, index).trim();
      }
    }

    const length = content.length;
    const foundStartingBrackets = content.match(captureStartingBrackets) || [];
    const foundEndingBrackets = content.match(captureEndingBrackets) || [];

    if (foundStartingBrackets.length !== foundEndingBrackets.length) {
      if (foundStartingBrackets.length > foundEndingBrackets.length) {
        let numberUnmatched = 0;
        foundStartingBrackets.forEach((bracket, index) => {
          if (foundEndingBrackets[index - numberUnmatched] !== BRACKETMAP[bracket]) {
            currentBrackets.push(bracket);
            numberUnmatched++;
          }
        });
      } else if (foundEndingBrackets.length > foundStartingBrackets.length) {
        let numberUnmatched = 0;
        foundEndingBrackets.forEach((bracket, index) => {
          if (foundStartingBrackets[index - numberUnmatched] !== BRACKETMAP[bracket]) {
            const index = currentBrackets.lastIndexOf(BRACKETMAP[bracket]);
            currentBrackets.splice(index, 1);
            numberUnmatched++;
          }
        });

        if (currentBrackets.length === 0 && !commaOrSemicolon.test(content[length - 1])) {
          content += ';';
        }
      }
    } else if (content !== "" && currentBrackets.length === 0 && !commaOrSemicolon.test(content[length - 1])) {
      content += ';';
    }

    lines[line] = content;
  }

  // Add result and savings to return value
  output.result = lines.join('');
  output.savings = input.length - output.result.length;

  return output;
}

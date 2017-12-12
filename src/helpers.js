  function capitalize(word) {
    return word[0].toUpperCase() + word.substring(1);
  }

  function splitAndCapitalize(splitOn, words) {
    words = words.split(splitOn);
    words[0] = capitalize(words[0]);
    return words.join(' ');
  }

  function splitCamelCase(word) {
    const isCapital = /[A-Z]/;
    const seperator = " ";
    let isFirstCapital = true;
    const newWord = [];
    word = word.split('');
    for (const index in word) {
      const letter = word[index];
      if (isCapital.test(letter)) {
        if (!isFirstCapital) {
          newWord.push(seperator + letter);
        } else {
          isFirstCapital = false;
          newWord.push(letter);
        }
      } else {
        newWord.push(letter);
      }
    }
    return newWord.join('');
  }

  function isCampaignSelect(inputName) {
    if (inputName.indexOf('campaignSelect') === -1) { return false; }
    const temparr = inputName.split('-');
    return temparr.length > 1 && temparr[1].split('_')[0] === temparr[temparr.length - 1].split('_')[0];
  }

  function getInputType(inputName) {
    const type = inputName.split('-');
    return type[type.length - 1].split('_')[0];
  }

  function getObjectFormats(campaignName, inputs) {
    const keys = Object.keys(inputs);
    // Default to the last input in the array
    let targetInput = inputs[keys[keys.length - 1]];

    for (let index = 0, length = keys.length; index < length; index++) {
      const key = keys[index];
      if (!Array.isArray(inputs[key])) { break; }
      const foundInput = inputs[key].filter((input) => input.value === campaignName);
      if (foundInput.length > 0) {
        targetInput = foundInput[0];
        break;
      }
    }

    let targetObjectInput = null;
    if (targetInput.inputs) {
      targetObjectInput = targetInput.inputs[Object.keys(targetInput.inputs).pop()];
    } else {
      targetObjectInput = targetInput;
    }
    return [targetObjectInput.inputFormat, targetObjectInput.outputFormat];
  }

  function formatObject(inOut, value, inputFmt, outputFmt) {
    if (inOut == 'input') {
      // Remove {} or []
      value = value.substring(value.length - 1, 0).substring(1);
      if (value === "") { return value; }

      const lines = value.split('\t').map((line) => {
        const values = line.split('=>').map((value) => value.trim());
        let output = inputFmt;
        for (let index = 0; index < values.length; index++) {
          const type = output.match(/{\w+:(\w+)}/)[1];
          if (type === "text") {
            // Only grab what's in "". Removes unncessary stuff like :discount or ,
            const value = values[index].match(/"(.+)"/);
            values[index] = value ? value[1] : value;
          } else {
            values[index] = values[index].split(',').map((value) => {
              // Replace any [] found
              value = value.replace(/[\[\]]/g, '');
              // Removes "" around each value in the array
              value = value.substring(value.length - 1, 0).substring(1);
              return value.trim();
            });
            values[index] = values[index].filter((value) => value !== "").join(', ');
          }
          // Skip null inputs, unless it's the last one (optional paramater)
          if (values[index] === null && (index === values.length - 1)) {
            output = output.replace(/{\w+:\w+}/i, "");
          } else if (values[index] !== null) {
            output = output.replace(/{\w+:\w+}/i, values[index]);
          }
        }
        return output;
      }).join('\n');
      return lines;
    } else {
      const inputFormatRepl = inputFmt.replace(/{\w+:(\w+)}/gi, '').trim();
      const splitter = inputFormatRepl[0];
      const requiredInputs = inputFormatRepl.split(splitter).length;
      const lines = value.split('\n').map((line) => {
        let values = line.split(splitter).map((value) => value.trim());

        // Only allow blank value as the last input (optional paramater)
        values = values.filter((value, index) => {
          if (index !== values.length - 1) {
            return value !== "";
          } else {
            return true;
          }
        });

        // Throw an error if we don't have the right number of inputs so the user can correct
        if (values.length !== requiredInputs) {
          throw Error("Number of inputs does not match required input format");
        }

        let output = outputFmt;
        for (let index = 0; index < values.length; index++) {
          const type = output.match(/{(\w+)}/)[1];
          if (type === 'array') {
            // Add "" around each value in the array
            values[index] = values[index].split(',').map((value) => `"${value.trim()}"`);
            values[index] = values[index].filter((value) => value !== '""').join();
          }
          output = output.replace(/{\w+}/i, values[index]);
        }
        return output;
      }).join(',\t');
      return `${lines}`;
    }
  }

export {
  capitalize,
  splitAndCapitalize,
  splitCamelCase,
  isCampaignSelect,
  getInputType,
  getObjectFormats,
  formatObject
}
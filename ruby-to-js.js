const {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
} = require('fs');
const {
  join
} = require('path');

const Errors = {
  ENOENT: 'ENOENT',
};

const Colors = {
  Red: '\x1b[31m%s\x1b[0m',
  Blue: '\x1b[34m%s\x1b[0m',
  Cyan: '\x1b[36m%s\x1b[0m',
  Yellow: '\x1b[33m%s\x1b[0m',
  Green: '\x1b[32m%s\x1b[0m',
};

const commandArgs = process.argv.slice(2);
const rubyDir = join(__dirname, 'ruby_scripts');
const jsDir = join(__dirname, 'src/scripts');
const searchRegex = /const classes = {[^;]+;/;
const args = {
  verbose: commandArgs.some((arg) => arg === '-v' || arg === '--verbose'),
  check: commandArgs.some((arg) => arg === '-c' || arg === '--check'),
};

// Do the thing
rubyToJS();

function rubyToJS() {
  const results = [];
  if (args.check === false) {
    console.log('Compiling .rb files and adding to .js files...');
  } else {
    console.log('Checking to ensure all .rb files were added to .js files...');
  }

  const rootDirContents = readdirSync(rubyDir);

  rootDirContents.forEach((fileOrDirectory) => {
    const path = `${rubyDir}/${fileOrDirectory}`;
    if (checkIfDirectory(path)) {
      if (args.verbose) {
        console.log(Colors.Blue, `Compiling files from ${fileOrDirectory}`);
      }

      const injectableCode = compileScripts(path);

      if (injectableCode) {
        const result = overwriteClassesInFile({
          dirName: fileOrDirectory,
          code: injectableCode
        });

        results.push(result);
      }
    }
  });

  const changeCount = results.filter((result) => result === true).length;

  if (args.check === true) {
    if (changeCount > 0) {
      console.log(Colors.Red, 'Changes were detected in .rb files that are not present in .js files');
      process.exit(1);
    } else {
      console.log(Colors.Green, 'No changes detected');
      process.exit(0);
    }
  } else {
    if (changeCount > 0) {
      console.log(Colors.Green, `Changes were applied to ${changeCount} file(s)`);
    } else {
      console.log(Colors.Green, 'No changes were made');
    }
  }
}

function checkIfDirectory(path) {
  try {
    return statSync(path).isDirectory();
  } catch (error) {
    if (error.code === Errors.ENOENT) {
      return false;
    }

    throw error;
  }
}

function overwriteClassesInFile({
  dirName,
  code
}) {
  const jsFilePath = `${jsDir}/${dirName}.js`;
  const fileContents = readFileSync(jsFilePath, 'utf8');
  const newContents = fileContents.replace(searchRegex, addVariableDefinition(code));

  if (fileContents !== newContents) {
    if (args.check === false) {
      writeFileSync(jsFilePath, newContents);

      if (args.verbose) {
        console.log(Colors.Green, `  Successfully wrote to ${dirName}.js`);
      }
    }

    return true;
  } else {
    if (args.verbose) {
      console.log(Colors.Green, `  No changes needed to ${dirName}.js`);
    }

    return false;
  }
}

function compileScripts(path) {
  const directoryContents = readdirSync(path);

  if (directoryContents.length === 0) {
    if (args.verbose) {
      console.log(Colors.Yellow, '  Skipped empty directory');
    }
    return null;
  }

  const jsCode = [];

  directoryContents.forEach((fileName) => {
    if (args.verbose) {
      console.log(Colors.Cyan, `  Adding ${fileName}`);
    }

    const rubyCode = readFileSync(`${path}/${fileName}`, 'utf8').trim();

    jsCode.push(wrapRubyCode({
      fileName,
      code: rubyCode
    }));
  });

  return jsCode.join('\n\n');
}

function wrapRubyCode({
  fileName,
  code
}) {
  return `  ${snakeCaseToPascalCase(fileName.replace('.rb', ''))}: \`\n${code}\`,`;
}

function snakeCaseToPascalCase(word) {
  return word.split('_').map((split) => split[0].toUpperCase() + split.substring(1)).join('');
}

function addVariableDefinition(code) {
  return `const classes = {\n${code}\n};`;
}

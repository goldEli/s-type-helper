const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');
const path = require('path');

function readFile(filePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
      if (!err) {
        resolve(data);
      } else {
      }
    });
  });
}

/**
 * 代码字符串转成语法树
 * @param {*} code
 */
function codeToAst(code) {
  const ast = parser.parse(code, {
    sourceType: 'module', // 识别ES Module
    plugins: [
      'jsx', // enable jsx
      'classProperties',
      'dynamicImport',
      'optionalChaining',
      'decorators-legacy',
    ],
  });
  return ast;
}

/**
 * @param {*} ast
 */
function getKeys(ast, actionsName) {
  return new Promise((resolve, reject) => {
    traverse(ast, {
      VariableDeclaration({ node }) {
        if (
          !!actionsName &&
          actionsName === node.declarations[0].id.name &&
          node.declarations[0].init.elements
        ) {
          const keys = node.declarations[0].init.elements.map((item) => {
            return item.value;
          });
          resolve(keys);
          return
        }

        if (
          !!actionsName &&
          actionsName === node.declarations[0].id.name &&
          node.declarations[0].init.properties
        ) {
          const keys = node.declarations[0].init.properties.map((item) => {
            return item.key.name;
          });
          resolve(keys);
          return
        }
      },
      CallExpression({ node }) {
        if (!!actionsName) {
          return;
        }
        if (
          node.callee.name === 'actionsFactory' &&
          !!node.arguments[0].elements
        ) {
          const keys = node.arguments[0].elements.map((element) => {
            return element.value;
          });

          resolve(keys);
          return;
        }

        if (
          node.callee.name === 'actionsFactory' &&
          node.arguments[0].type === 'Identifier'
        ) {
          const actionsName = node.arguments[0].name;
          resolve(getKeys(ast, actionsName));
          return;
        }
      },
    });
  });
}

async function getActionsInfo(filePath) {
  const code = await readFile(filePath);
  const ast = codeToAst(code);
  const keys = await getKeys(ast);
  var reg = /((?<=\/actions\/).).*(?=.js)/;
  var str = filePath.match(reg)[0];
  return {
    filePath,
    absolutePath: str,
    filename: `${handleName(str)}.d.ts`,
    keys,
  };
}

async function createActionsType(filePath, targetFilePath) {
  const actionsInfo = await getActionsInfo(filePath);

  const newCode = createCode(actionsInfo.absolutePath, actionsInfo.keys);
  writeFile(path.join(targetFilePath, actionsInfo.filename), newCode);
}

function writeFile(filePath, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, contents, function (err) {
      if (err) {
      }
    });
  });
}

function createFolder(path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, function (err) {
      if (err) {
      } else {
        resolve();
      }
    });
  });
}

function createFile(path, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, '', function (err) {
      if (err) {
      } else {
        resolve();
      }
    });
  });
}

function createCode(path, keys) {
  const keysStr = JSON.stringify(keys);
  if (!keys.length) {
    return '';
  }
  const name = handleName(path);
  return `
    /* eslint-disable */
    function stringLiterals<T extends string>(args: T[]): T[] {
        return args
      }
      
      type TElement<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<
        infer TElement
      >
        ? TElement
        : never
      
      const ${name} = stringLiterals(${keysStr})
      
      declare module 'snx@actions/${path}' {
        type TKeys = TElement<typeof ${name}>
        var actionHelper: {
          actionNames: Record<TKeys, string>
        } & Record<TKeys, (payload: { [key in string]: any }) => void>
        export default actionHelper
      }
      

    `;
}

function handleName(str) {
  return str.replace(/\/|-/g, '_');
}

async function fileExists(path) {
  return !!(await fs.promises.stat(path).catch((e) => false));
}

// copy file
async function copyFile(source, target) {
  return new Promise((resolve, reject) => {
    fs.copyFile(source, target, (err) => {
      if (err) {
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  createActionsType,
  fileExists,
  createFolder,
  createFile,
  copyFile,
};

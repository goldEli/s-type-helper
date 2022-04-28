const path = require('path');
const fs = require('fs');

const glob = require('glob');
const {
  createActionsType,
  fileExists,
  copyFile,
  createFolder,
} = require('./util');

const rootDir = process.cwd();

const additionalTypesDir = path.join(rootDir, './additionalTypes');

const sourceActionsDir = path.join(rootDir, './src/actions/**/*.js');

const actionsTypesDir = path.join(rootDir, './additionalTypes/actions');

console.log({ rootDir, additionalTypesDir, actionsTypesDir, sourceActionsDir });

function getAllFileNames() {
  return new Promise((resolve, reject) => {
    // options is optional
    glob(sourceActionsDir, {}, function (er, files) {
      resolve(files);
    });
  });
}

/**
 * check file exist
 */
async function createDefaultFiles() {
  if (!fs.existsSync(additionalTypesDir)) {
    fs.mkdirSync(additionalTypesDir);
    console.log('create additionalTypes folder');
  }
  if (!fs.existsSync(actionsTypesDir)) {
    fs.mkdirSync(actionsTypesDir);
  }

  if (!(await fileExists(path.join(actionsTypesDir, 'react-intl.d.ts')))) {
    await copyFile(
      path.join(__dirname, './additionalTypes/react-intl.d.ts'),
      path.join(additionalTypesDir, 'react-intl.d.ts')
    );
  }
}

async function main() {
  await createDefaultFiles();
  const allFiles = await getAllFileNames();
  console.log(allFiles);
  for (const file of allFiles) {
    createActionsType(file, actionsTypesDir);
  }
  console.log(
    '\x1b[36m%s\x1b[0m',
    'Feel free to contract @Eli Miao if you have any questions.'
  );
}

main();

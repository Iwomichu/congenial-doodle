import { Language, Pattern } from './Language';
import { es6Import, requireImport } from './JavaScript';

const gitDiffPattern: Pattern = {
  import: new RegExp('\\++import .+ from ["\'`]([\\./\\w-_]+)["\'`];?'),
  dependency: es6Import.dependency,
};
const typeScript = new Language('TypeScript', [requireImport, es6Import], 'ts');
const typeScriptGitDiff = new Language('TypeScript', [gitDiffPattern], 'ts');
export { typeScript, typeScriptGitDiff };

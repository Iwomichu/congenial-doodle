import { Language, Pattern } from './Language';

const pattern: Pattern = {
  import: new RegExp('import .+ from ["\'`]([\\./\\w-_]+)["\'`];?'),
  dependency: new RegExp('^[\\w-_]+$'),
};
const gitDiffPattern: Pattern = {
  import: new RegExp('\\++import .+ from ["\'`]([\\./\\w-_]+)["\'`];?'),
  dependency: pattern.dependency,
};
const typeScript = new Language('TypeScript', [pattern], 'ts');
const typeScriptGitDiff = new Language('TypeScript', [gitDiffPattern], 'ts');
export { typeScript, typeScriptGitDiff };

import { Language, Pattern } from './Language';

const pattern: Pattern = {
  import: new RegExp(
    'import .+ from ["\'`]([\\./\\w-_]+)["\'`];?',
  ),
  externalDependency: new RegExp('^[\\w-_]+$'),
};
const typeScript = new Language('TypeScript', [pattern], 'ts');
export { typeScript };

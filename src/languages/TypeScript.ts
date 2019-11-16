import { Language, Pattern } from './Language';

const pattern: Pattern = {
  import: new RegExp(
    'import .+ from ["\'`]([\\./\\w-_]+)["\'`];?',
  ),
  dependency: new RegExp('^[\\w-_]+$'),
};
const typeScript = new Language('TypeScript', [pattern], 'ts');
export { typeScript };

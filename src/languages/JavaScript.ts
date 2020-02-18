import { Language, Pattern } from './Language';
import { keywordResolver } from './knownLanguages';
import { npmJsApi } from '../api/NpmJsAPI';

const requireImport = {
  import: new RegExp(`[\\w\\s=]*require\\([\\'\\"]?([\\w-_]+)[\\'\\"]\\);?$`),
  dependency: new RegExp('^[\\w-_]+$'),
};

const es6Import: Pattern = {
  import: new RegExp('import .+ from ["\'`]([\\./\\w-_]+)["\'`];?'),
  dependency: new RegExp('^[\\w-_]+$'),
};

const javaScript = new Language('JavaScript', [requireImport, es6Import], 'js');

const npmResolver: keywordResolver = async (library: string) => {
  const version = await npmJsApi.getPackage(library);
  if (version) return version.keywords;
  else return [];
};

export { requireImport, es6Import, javaScript, npmResolver };

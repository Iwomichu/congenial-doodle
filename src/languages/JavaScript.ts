import { Language, Pattern } from './Language';
import { keywordResolver } from './knownLanguages';
import { npmJsApi } from '../api/NpmJsAPI';

const javaScript = new Language(
  'JavaScript',
  [
    {
      import: new RegExp(
        `[\\w\\s=]*require\\([\\'\\"]?([\\w-_]+)[\\'\\"]\\);?$`,
      ),
      dependency: new RegExp('^[\\w-_]+$'),
    },
  ],
  'js',
);

const npmResolver: keywordResolver = async (library: string) => {
  const version = await npmJsApi.getPackage(library);
  if (version) return version.keywords;
  else return [];
};

export { javaScript, npmResolver };

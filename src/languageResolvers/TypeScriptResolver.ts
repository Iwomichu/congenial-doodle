import { LanguageResolver } from './LanguageResolver';

class TypeScriptResolver implements LanguageResolver {
  extension: string;
  constructor() {
    this.extension = 'ts';
  }
  getDependencies(fileContent: string[]) {
    const importPattern = new RegExp(
      'import \\{?\\s*\\w+\\s*\\}? from ["\'`]([\\./\\w-_]+)["\'`];?',
    );
    const dependencyPattern = new RegExp('^[\\w-_]+$');

    return <RegExpExecArray>fileContent
      .map(line => importPattern.exec(line))
      .map(line => {
        if (line && dependencyPattern.test(line[1])) {
          return line[1];
        } else return '';
      })
      .filter(line => line.length);
  }
}
const typeScriptResolver = new TypeScriptResolver();
export default typeScriptResolver;

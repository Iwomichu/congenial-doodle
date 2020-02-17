import SimpleFile from '../models/SimpleFile';

import { knownExtensions } from '../languages/knownLanguages';

export default class LineByLineAnalysis {
  public static getUsedLibraries(file: SimpleFile) {
    const extension = file.name.split('.').pop() || ''; //get that from languages
    const language = knownExtensions.get(extension.toLowerCase());
    if (!language) return [];
    else {
      return language.resolveExternalDependencies(file.content.split('\n'));
    }
  }
}

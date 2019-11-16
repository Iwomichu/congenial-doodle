import { Language, Pattern } from './Language';

const javaScript = new Language(
  'JavaScript',
  [
    {
      import: new RegExp(`require\\([\\'\\"]?([\\w-_]+)[\\'\\"]\\);?$`),
      dependency: new RegExp('^[\\w-_]+$'),
    },
  ],
  'js',
);

export { javaScript };

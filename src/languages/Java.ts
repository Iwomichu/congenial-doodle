import { LanguageJVM } from './LanguageJVM';

const java = new LanguageJVM(
  'Java',
  [
    {
      dependency: new RegExp(`^[\\w\\.]+;?$`),
      import: new RegExp(`^import ([\\w\\.]+);?$`),
      package: new RegExp(`^package ([\\w\\.]+);?$`),
      ignoredPackages: [
          new RegExp(`^java\\w*`),
          new RegExp(`^javax\\w*`)
      ]
    },
  ],
  'java',
);

export { java };

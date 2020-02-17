import { Parser } from 'acorn';
import {
  ParseResult,
  CommitPairDifferenceFiles,
  TreesPair,
  GitDiffParserResultPairWithTrees,
} from './Types';
const jsx = require('acorn-jsx');
const jsParser = Parser.extend(jsx());
const acornWalk = require('acorn-walk');

export default class TreeAnalysis {
  public static getTreeDiffNodes(
    zippedParseResults: ParseResult[],
    filesPairs: CommitPairDifferenceFiles[],
  ) {
    const trees: TreesPair[] = filesPairs.map(pair => {
      return {
        before: pair[0].map(file =>
          jsParser.parse(file.content, {
            sourceType: 'module',
            allowReserved: true,
            locations: true,
          }),
        ),
        after: pair[1].map(content =>
          jsParser.parse(content.content, {
            sourceType: 'module',
            allowReserved: true,
            locations: true,
          }),
        ),
      };
    });
    const diffsWithTrees = zippedParseResults.map(
      (elem, index) =>
        [elem.result, trees[index]] as GitDiffParserResultPairWithTrees,
    );
    return diffsWithTrees.map(this.mapDiffToNodes);
  }

  public static mapDiffToNodes(pair: GitDiffParserResultPairWithTrees) {
    return pair[0].commits[0].files.map((file, index) =>
      file.lines.map(line =>
        acornWalk.findNodeAround(pair[1].after[index], line.ln2),
      ),
    );
  }
}

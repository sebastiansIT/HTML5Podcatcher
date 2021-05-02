/** This modul contains functions to parse different data formats.
 *
  @module  podcatcher/parser
  @author  Sebastian Spautz [sebastian@human-injection.de]
  @requires module:podcatcher/parser/RSS20
 * @license GPL-3.0-or-later
 *
 * Copyright 2016, 2019, 2021 Sebastian Spautz
 *
 * This file is part of "HTML5 Podcatcher".
 *
 * "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * "HTML5 Podcatcher" is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */

/* global HTML5Podcatcher */
import rss20SourceParser from './rss_2-0.js'

// ====================================== //
// === Interface ISourceParser        === //
// ====================================== //
/** Interface defining functions which parses documents for information about
 * a source and its episodes.
 *
 * @interface ISourceParser
 */

/** Parse the given XMLDocument and update the defined source.
 *
 * @function
 * @name module:podcatcher/parser~ISourceParser#parse
 * @param {object} source The source to be importet.
 * @param {external:XMLDocument} xmlDocument The XML document to be parsed.
 * @returns {object} The updated source.
 */

// ====================================== //
// === Singelton SourceParserFacade   === //
// ====================================== //
/** Singelton facade for source parser.
 *
 * @class
 */
class SourceParserFacade {
  /** Create a parser facade with a empty list of registerd parsers.
   */
  constructor () {
    const sourceParserList = []

    this.registerSourceParser = (sourceParser) => {
      sourceParserList.push(sourceParser)
    }

    this.sourceParser = () => {
      let parser

      sourceParserList.forEach(listedParser => {
        // Actual only one parser is implemented. So no desicion is neccesarily.
        parser = listedParser
      })
      if (!parser) {
        HTML5Podcatcher.logger('Missing source parser', 'error')
      }
      return parser
    }
  }

  /** Parse the given XMLDocument and update the defined source with one of
   * the registered Parsers.
   *
   * @param {object} source The source to be importet.
   * @param {external:XMLDocument} xmlDocument The XML document to be parsed.
   * @returns {object} The updated source.
   */
  parse (source, xmlDocument) {
    const sourceParser = this.sourceParser()
    if (sourceParser) {
      const result = sourceParser.parse(source, xmlDocument)
      return result
    }
  }
}

const sourceParser = new SourceParserFacade()
// Register the RSS 2.0 Parser
sourceParser.registerSourceParser(rss20SourceParser)
export default sourceParser

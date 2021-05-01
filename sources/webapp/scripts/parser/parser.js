/** This modul contains functions to parse different data formats.

    @module  HTML5Podcatcher/Parser
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:HTML5Podcatcher/Configuration
    @license Copyright 2015 Sebastian Spautz

    This file is part of "HTML5 Podcatcher".

    "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    any later version.

    "HTML5 Podcatcher" is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/.
*/

/* global HTML5Podcatcher */

var parserAPI = (function () {
  'use strict'

  // ====================================== //
  // === Interface ISourceParser        === //
  // ====================================== //
  /** Interface defining functions which parses documents for information about a source and its episodes.
    * @interface
    */
  const ISourceParser = function () {}

  ISourceParser.prototype.parse = function (/* source, doc */) {
    throw new Error('not implemented')
  }

  // See http://podlove.org/simple-chapters/
  ISourceParser.prototype.parsePodloveSimpleChapters = function (node) {
    let i
    let chapters
    let chapter
    const jumppoints = []

    if (node && node.length > 0) {
      HTML5Podcatcher.logger('Found "Podlove Simple Chapters" in feed', 'debug', 'Parser')
      chapters = node[0].getElementsByTagNameNS('http://podlove.org/simple-chapters', 'chapter')
      for (i = 0; i < chapters.length; i += 1) {
        chapter = chapters[i]
        jumppoints.push({
          type: 'chapter',
          time: this.parseNormalPlayTime(chapter.attributes.start.value) / 1000,
          title: chapter.attributes.title.value,
          uri: chapter.attributes.href ? chapter.attributes.href.value : undefined,
          image: chapter.attributes.image ? chapter.attributes.image.value : undefined
        })
      }
    }

    return jumppoints
  }

  // See https://www.ietf.org/rfc/rfc2326.txt Chapter 3.6
  ISourceParser.prototype.parseNormalPlayTime = function (normalPlayTime) {
    var parts, milliseconds
    parts = normalPlayTime.split('.')
    if (parts[1]) {
      milliseconds = parseFloat('0.' + parts[1]) * 1000
    } else {
      milliseconds = 0
    }
    parts = parts[0].split(':')
    if (parts.length === 3) {
      milliseconds = milliseconds + parseInt(parts[2], 10) * 1000
      milliseconds = milliseconds + parseInt(parts[1], 10) * 60 * 1000
      milliseconds = milliseconds + parseInt(parts[0], 10) * 60 * 60 * 1000
    } else if (parts.length === 2) {
      milliseconds = milliseconds + parseInt(parts[1], 10) * 1000
      milliseconds = milliseconds + parseInt(parts[0], 10) * 60 * 1000
    } else if (parts.length === 1) {
      milliseconds = milliseconds + parseInt(parts[0], 10) * 1000
    }
    return milliseconds
  }

  // ====================================== //
  // === Singelton SourceParserFacade=== //
  // ====================================== //
  /** Singelton facade for source parser.
    * It is exported as the global member "document.HTML5Podcatcher.api.parser.SourceParser".
    * @class
    */
  const SourceParserFacade = function () {
    var sourceParserList = []

    this.registerSourceParser = function (sourceParser) {
      sourceParserList.push(sourceParser)
    }

    this.sourceParser = function () {
      var parser

      sourceParserList.forEach(function (listedParser) {
        // TODO zust�ndigkeit checken
        parser = listedParser
      })
      if (!parser) {
        HTML5Podcatcher.logger('Missing source parser', 'error')
      }
      return parser
    }
  }

  SourceParserFacade.prototype.parse = function (source, doc) {
    var sourceParser = this.sourceParser()
    if (sourceParser) {
      return sourceParser.parse(source, doc)
    }
  }

  return {
    ISourceParser: ISourceParser,
    SourceParser: new SourceParserFacade()
  }
}())

/** The modul "Parser" is available at document.HTML5Podcatcher.api.parser.
  * @global
  * @name "HTML5Podcatcher.api.parser"
  * @see module:HTML5Podcatcher/Parser
  */
HTML5Podcatcher.api.parser = parserAPI

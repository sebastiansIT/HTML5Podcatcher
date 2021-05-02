/** This modul contains functions to parse XML format "Podlove Simple Chapter".
    See http://podlove.org/simple-chapters/ for the specification.

    @module  podcatcher/parser/PSC
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:podcatcher/parser/NPT
    @requires module:podcatcher/utils/logging
    @license Copyright 2021 Sebastian Spautz

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

import NptParser from './normalPlayTime.js'
import { Logger } from '../utils/logging.js'

const LOG = new Logger('podcatcher/parser/PSC')
/**
 * @param {external:Node} parentNode
 * @returns {external:Node|undefined}
 */
export function findChaptersNode (parentNode) {
  let chaptersNode =
    parentNode.getElementsByTagNameNS('http://podlove.org/simple-chapters/', 'chapters')

  if (chaptersNode.length <= 0) {
    // in the past some guys use a wrong namespace without the trailing slash
    chaptersNode = parentNode.getElementsByTagNameNS(
      'http://podlove.org/simple-chapters',
      'chapters'
    )

    if (chaptersNode.length > 0) {
      LOG.info(`${parentNode} uses wrong XML namespace: There should be a trailing slash in the URI`)
    } else {
      // some guys like c3d2 Pentacast uses a wrong namespace with https and wrong toplevel domain
      chaptersNode = parentNode.getElementsByTagNameNS(
        'https://podlove.de/simple-chapters',
        'chapters'
      )

      if (chaptersNode.length > 0) {
        LOG.info(`${parentNode} uses wrong XML namespace: It is https://podlove.de/simple-chapters but it should be http://podlove.org/simple-chapters`)
      }
    }
  }

  if (chaptersNode && chaptersNode.length >= 1) {
    // TODO HTML5Podcatcher.logger('Found "Podlove Simple Chapters" in feed', 'debug', 'Parser')
    return chaptersNode[0]
  }
}

/** Parse the XML in format "Podlove Simple Chapber" and returns a list
 * of jumppoints.
 *
 * @param {external:Node} chaptersNode
 * @returns {object[]} Array with jumppoints.
 */
export function parse (chaptersNode) {
  let i
  let chapters
  let chapter
  const jumppoints = []

  if (chaptersNode) {
    chapters = chaptersNode.getElementsByTagName('chapter')
    for (i = 0; i < chapters.length; i += 1) {
      chapter = chapters[i]
      jumppoints.push({
        type: 'chapter',
        time: NptParser(chapter.attributes.start.value) / 1000,
        title: chapter.attributes.title.value,
        uri: chapter.attributes.href ? chapter.attributes.href.value : undefined,
        image: chapter.attributes.image ? chapter.attributes.image.value : undefined
      })
    }
  }

  return jumppoints
}

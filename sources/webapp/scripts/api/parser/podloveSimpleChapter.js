/**
 * This modul contains functions to parse XML format "Podlove Simple Chapter".
 * See https://github.com/podlove/podlove-specifications/blob/master/podlove-simple-chapters.md
 * for the specification.
 * @module  podcatcher/parser/PSC
 * @author  Sebastian Spautz [sebastian@human-injection.de]
 * @requires module:podcatcher/parser/NPT
 * @requires module:podcatcher/utils/logging
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

import NptParser from './normalPlayTime.js'
import { Logger } from '../utils/logging.js'

/**
 * Logger.
 * @constant {module:podcatcher/utils/logging.Logger}
 */
const LOGGER = new Logger('podcatcher/parser/PSC')

/**
 * XML namespace.
 * @constant {string}
 */
const NAMESPACE = 'http://podlove.org/simple-chapters'

/**
 * Acceptable XML namespaces for the "RSS Namespace Extension for Podcast".
 * @constant {Array<string>}
 */
const PODLOVE_EXTENSION_NAMESPACES = [
  NAMESPACE,
  'http://podlove.org/simple-chapters/',
  'https://podlove.de/simple-chapters'
]

/**
 * Identifies a Capters Element as a child of the given node.
 * @param {external:Node} parentNode The parent to search inside.
 * @returns {external:Node|undefined} A Chapters node if available.
 */
export function findChaptersNode (parentNode) {
  let chaptersNode =
    parentNode.getElementsByTagNameNS(NAMESPACE, 'chapters')

  if (chaptersNode.length <= 0) {
    // in version 1.1 there is a trailing slash
    chaptersNode = parentNode.getElementsByTagNameNS(
      'http://podlove.org/simple-chapters/',
      'chapters'
    )

    if (!chaptersNode.length > 0) {
      // some guys like c3d2 Pentacast uses a wrong namespace with https and wrong toplevel domain
      chaptersNode = parentNode.getElementsByTagNameNS(
        'https://podlove.de/simple-chapters',
        'chapters'
      )

      if (chaptersNode.length > 0) {
        LOGGER.info(`${parentNode} uses wrong XML namespace: It is https://podlove.de/simple-chapters but it should be http://podlove.org/simple-chapters`)
      }
    }
  }

  if (chaptersNode && chaptersNode.length >= 1) {
    LOGGER.debug('Found "Podlove Simple Chapters" in feed')
    return chaptersNode[0]
  }
}

/**
 * Parse the XML in format "Podlove Simple Chapber" and returns a list
 * of jumppoints.
 * @param {external:Node} chaptersNode The Chapters element.
 * @returns {object[]} Array with jumppoints.
 */
export function parse (chaptersNode) {
  let i
  let chapters
  let chapter
  const jumppoints = []

  if (chaptersNode) {
    chapters = findPodloveSimpleChapterElements(chaptersNode, 'chapter')
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

/**
 * Search inside the parent element for an child with the given name and one of
 * the acceptable namespces for "Podlove Simple Chapter".
 * @param {external:Node} parentElement The element to search in.
 * @param {string} elementName The name of the element to search for.
 * @returns {Array<external:Node>} The nodes found or an empty array.
 */
function findPodloveSimpleChapterElements (parentElement, elementName) {
  let elements = []
  PODLOVE_EXTENSION_NAMESPACES.forEach((item, i) => {
    elements = elements.concat(
      Array.from(parentElement.getElementsByTagNameNS(item, elementName))
    )
  })

  return elements
}

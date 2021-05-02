/** This modul contains functions to parse JSON format "Podcast 2.0 Chapters".
 * See  for the specification.
 *
 * @module  podcatcher/parser/podcast20chapters
 * @requires module:podcatcher/utils/logging
 * @author  SebastiansIT [sebastian@human-injection.de]
 * @license GPL-3.0-or-later
 *
 * Copyright 2021 Sebastian Spautz
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

import { Logger } from '../utils/logging.js'

/** Logger.
 *
 * @constant {module:podcatcher/utils/logging.Logger}
 */
const LOGGER = new Logger('podcatcher/parser/PSC')

/** MIME type of Podcast 2.0 chapters files.
 *
 * @constant {string}
 */
export const MIME_TYPE = 'application/json+chapters'

/** Parses a Object with chapter informations.
 *
 * @param {object} document JSON document.
 * @returns {Array} An array of jump points.
 */
export function parse (document) {
  const jumppoints = []
  // metadata about episode will be ignored
  if (document.chapters && document.chapters.forEach) {
    document.chapters.forEach((chapter, i) => {
      if (chapter.startTime && typeof chapter.startTime === 'number') {
        if (!(chapter.toc === false)) { // don't compute silent chapters
          jumppoints.push({
            type: 'chapter',
            time: chapter.startTime,
            title: chapter.title || undefined,
            uri: chapter.url || undefined,
            image: chapter.img || undefined
          })
          // location information will be ignored
          if (chapter.endTime && typeof chapter.endTime === 'number') {
            jumppoints.push({
              type: 'chapter',
              time: chapter.endTime,
              title: undefined,
              uri: undefined,
              image: undefined
            })
          }
        }
      } else {
        LOGGER.error(`Podcast 2.0 Chapter has an invalid start time "${chapter.startTime}".`)
      }
    })
  } else {
    LOGGER.error(`JSON document ${document} with Podcast 2.0 Chapters is invalid.`)
  }

  return jumppoints
}

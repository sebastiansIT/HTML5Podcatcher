/** Contains a class to represent a set of podcast sources.
 *
 * @module podcatcher/model/sources
 * @author  Sebastian Spautz [sebastian@human-injection.de]
 * @requires module:podcatcher/utils/logging
 * @license GPL-3.0-or-later
 *
 * Copyright 2023 Sebastian Spautz
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
import { getProvider } from '../web/fetch.js'

/** Logger.
 *
 * @constant {module:podcatcher/utils/logging.Logger}
 * @private
 */
const LOGGER = new Logger('Model/Source')

/** Instances of this class represents a set of source objects.
 *
 * @class
 * @param {external:URL} url The URL identifing this source.
 */
export default class Source {
  /**
   * Create a sources.
   *
   * @param {external:URL} url An array of sources.
   */
  constructor (url) {
    this.uri = url
    this.link = undefined
    this.title = undefined
    this.description = undefined
    this.license = undefined
    this.language = undefined
    this.img = {}
    this.img.uri = undefined
  }

  /**
   * Update a source from the web.
   *
   * @param {number} limitOfNewEpisodes The maximum number of episodes marked as new.
   * @returns {external:Promise} A promise that fullfiled with TODO
   */
  update (limitOfNewEpisodes = 5) {
    return getProvider.downloadXML(this.uri.toString())
      .then((document) => {
        LOGGER.debug(document)
        // TODO call parser with limit
        // TODO speicher der neuen Daten zurück in den Storage
      })
  }
}

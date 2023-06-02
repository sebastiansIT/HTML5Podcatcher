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

/* global HTML5Podcatcher */

import { Logger } from '../utils/logging.js'
import WebAccessProvider from '../web/fetch.js'

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
  /** Create a sources.
   *
   * @param {external:URL} url An array of sources.
   */
  constructor (url) {
    this.url = url
    this.webaccess = new WebAccessProvider(HTML5Podcatcher.api.configuration.proxyUrlPattern)

    // TODO lade eventuell vorhandene Daten aus dem Storage
  }

  /** Update a source from the web.
   *
   * @param {number} limitOfNewEpisodes The maximum number of episodes marked as new.
   * @returns {external:Promise} A promise that fullfiled with TODO
   */
  update (limitOfNewEpisodes = 5) {
    return this.webaccess.downloadXML(this.url.toString())
      .then((document) => {
        LOGGER.debug(document)
        // TODO call parser with limit
        // TODO speicher der neuen Daten zurück in den Storage
      })
  }
}

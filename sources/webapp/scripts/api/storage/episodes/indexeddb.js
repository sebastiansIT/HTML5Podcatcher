/**
 * Implementation of an Storage for podcast source based on the
 * Indexed Database API.
 *
 * @module  podcatcher/storage/episodes/indexeddb
 * @requires module:podcatcher/utils/logging
 * @author  SebastiansIT [sebastian@human-injection.de]
 * @license GPL-3.0-or-later
 *
 * Copyright 2023 Sebastian Spautz
 *
 * This file is part of "HTML5 Podcatcher".
 *
 * "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 *"HTML5 Podcatcher" is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */

import { Logger } from '../../utils/logging.js'
import AbstractIndexedDB from '../indexeddb.js'
import { comparator as EpisodeSort } from '../../model/episode.js'

/**
* Logger.
*
* @constant {module:podcatcher/utils/logging.Logger}
* @private
*/
const LOGGER = new Logger('Storage/Episodes/IndexedDB')

const STORE = 'episodes'

/**
* Implementation of the Interface ISourcesProvider based on the HTML5
* Indexed DB API.
*
* @class
* @implements {module:podcatcher/storage/episodes~EpisodesStorageProvider}
*/
export default class IndexedDBStorageProvider extends AbstractIndexedDB {
  /**
   * Read all Episodes of a given source.
   *
   * @param {module:podcatcher/model/sources.Source} source The source.
   * @returns {Promise<{module:podcatcher/model/episodes.Episode}[]}, Error>} A database connection.
   */
  readEpisodes (source) {
    return this.openConnection()
      .then((database) => this.openTransaction(database, STORE))
      .then((transaction) => {
        return new Promise((resolve, reject) => {
          const store = transaction.objectStore(STORE)
          const index = store.index('sources')
          const cursor = index.openCursor(IDBKeyRange.only(source.title))
          const episodes = []
          cursor.onsuccess = (event) => {
            const result = event.target.result
            if (result) {
              // checks episode.updated to be a Date object
              if (result.value.updated && !(result.value.updated instanceof Date)) {
                result.value.updated = new Date(result.value.updated)
              }
              episodes.push(result.value)
              result.continue()
            } else {
              resolve(episodes.sort(EpisodeSort))
            }
          }
          cursor.onerror = (event) => {
            const errorMessage = `${event.target.error.name} while reading episodes from IndexedDB (${event.target.error.message})`
            LOGGER.debug(errorMessage)
            reject(new Error(errorMessage))
          }
        })
      })
  }
}

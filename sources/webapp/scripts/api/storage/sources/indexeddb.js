/**
 * Implementation of an Storage for podcast source based on the
 * Indexed Database API.
 * @module  podcatcher/storage/sources/indexeddb
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
import Source from '../../model/source.js'

/**
 * Logger.
 * @constant {module:podcatcher/utils/logging.Logger}
 * @private
 */
const LOGGER = new Logger('Storage/Sources/IndexedDB')
const STORE = 'sources'

/**
 * Implementation of the Interface ISourcesProvider based on the HTML5
 * Indexed DB API.
 * @class
 * @implements {module:podcatcher/storage/sources~SourcesStorageProvider}
 */
export default class IndexedDBStorageProvider extends AbstractIndexedDB {
  /**
   * Read a given source from the Database.
   * @param {external:URL} url The URL of the source.
   * @returns {Promise<{module:podcatcher/model/sources.Source}, Error>} The source from the Database or a new and empty one.
   */
  readSource (url) {
    return this.openConnection()
      .then((database) => this.openTransaction(database, STORE))
      .then((transaction) => {
        return new Promise((resolve, reject) => {
          const store = transaction.objectStore(STORE)
          const request = store.get(url)
          request.onsuccess = (event) => {
            let source
            if (event.target.result) {
              LOGGER.debug('Source ' + event.target.result.uri + ' readed from database')
              const result = event.target.result
              source = new Source(url)
              source.description = result.description
              source.img.uri = result.image
              source.language = result.language
              source.license = result.license
              source.link = result.link
              source.title = result.title
            } else {
              LOGGER.debug('Source is not saved in database. Create new one.')
              source = new Source(url)
            }
            this.closeConnection(transaction.db)
            resolve(source)
          }
          request.onerror = (event) => {
            const errorMessage = `${event.target.error.name} while reading source ${url} from IndexedDB (${event.target.error.message})`
            LOGGER.debug(errorMessage)
            reject(new Error(errorMessage))
          }
        })
      })
  }

  /**
   * Delete the given source from the storage.
   * @param {module:podcatcher/model/sources.Source} source The podcast source to delete from storage.
   * @returns {Promise<{module:podcatcher/model/sources.Source}, Error>} A Promise resolving the deleted source.
   */
  deleteSource (source) {
    return this.openConnection()
      .then((database) => this.openTransaction(database, STORE, 'readwrite'))
      .then((transaction) => {
        return new Promise((resolve, reject) => {
          const store = transaction.objectStore(STORE)
          const request = store.delete(source.uri)
          request.onsuccess = () => {
            LOGGER.debug('Source ' + source.uri + ' deleted from database')
            this.closeConnection(transaction.db)
            resolve(source)
          }
          request.onerror = (event) => {
            const errorMessage = `${event.target.error.name} while deleting source "${source.uri}" from IndexedDB (${event.target.error.message})`
            LOGGER.debug(errorMessage)
            reject(new Error(errorMessage))
          }
        })
      })
  }
}

/** This module contains functions for persistency of podcast episodes
    based on IndexedDB.

    @module  podcatcher/storage/episodes/indexeddb
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:podcatcher/utils/logging
    @license Copyright 2020 Sebastian Spautz

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

import { Logger } from '../../utils/logging.js'

/** Logger.
  * @constant {module:podcatcher/utils/logging.Logger}
  */
const LOGGER = new Logger('podcatcher/storage/episodes/indexeddb')

/** Name of the database "table" to store episodes in.
 * @constant {string}
 */
const STORE_NAME_EPISODES = 'episodes'

/**
 * Creates or update all internals of a indexeddb to read and write podcast episodes.
 * @param {external:IDBDatabase} connection - The database connection.
 * @returns {undefined}
 */
export function updateIndexedDb (connection) {
  let episodeStore

  // Add object store for episodes
  if (!connection.objectStoreNames.contains(STORE_NAME_EPISODES)) {
    episodeStore = connection.createObjectStore(STORE_NAME_EPISODES, { keyPath: 'uri' })
    episodeStore.createIndex('source', 'source', { unique: false })
  }
  // Add index "status" to episode store
  episodeStore = event.currentTarget.transaction.objectStore(STORE_NAME_EPISODES)
  if (!episodeStore.indexNames.contains('status')) {
    episodeStore.createIndex('status', 'playback.played', { unique: false })
  }
  // Add index "source" to episode store
  episodeStore = event.currentTarget.transaction.objectStore(STORE_NAME_EPISODES)
  if (!episodeStore.indexNames.contains('sources')) {
    episodeStore.createIndex('sources', 'source', { unique: false })
  }
}

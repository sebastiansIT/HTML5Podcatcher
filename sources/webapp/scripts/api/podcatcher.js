/**
 * The HTML5Podcatcher API.
    @module  podcatcher
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:podcatcher/utils/logging
    @requires module:podcatcher/web/fetch
    @requires module:podcatcher/storage/settings/localstorage
    @requires module:podcatcher/model/sourcelist
    @requires module:podcatcher/parser
    @license GPL-3.0-or-later
 *
    Copyright 2019 Sebastian Spautz
 *
    This file is part of "HTML5 Podcatcher".
 *
    "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    any later version.
 *
    "HTML5 Podcatcher" is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 *
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/.
 */

import { logManager, Logger } from './utils/logging.js'
import WebAccessProvider from './web/fetch.js'
import WebStorageSettingsProvider from './storage/settings/webstorage.js'
import StorageSourcesProvider from './storage/sources/indexeddb.js'
import StorageEpisodeProvider from './storage/episodes/indexeddb.js'
import Sourcelist from './model/sourcelist.js'
import Episode, { toggleEpisodeStatus } from './model/episode.js'
import Source from './model/source.js'
import * as ParserModul from './parser/parser.js'

const settingsStorageProvider = new WebStorageSettingsProvider()

const api = {
  model: {
    Sources: Sourcelist,
    Episode,
    Source
  },
  utils: {
    createLogger: (module) => new Logger(module),
    tooglePaybackStatus: toggleEpisodeStatus
  },
  configuration: {
    logging: {
      addLogRule: (appender, minLevel, maxLevel) => logManager.addLogRule(appender, minLevel, maxLevel)
    },
    /**
     * @summary Access to the user settings.
     * @description Access to the user settings as part of the entire Configuration. User settings are a key/value-store. In this store you can save all kind of user defined information for your application.
     * @namespace
     */
    settings: {
      /**
       * Set a value for the given key of a user setting.
       * @param {string} key - The key of the user setting you want to set.
       * @param {(string|number)} value - The value for the user setting you want to set.
       * @returns {Promise} A Promise resolves to undefined.
       */
      set: function (key, value) {
        return settingsStorageProvider.writeSettingsValue(key, value)
      },

      /**
       * Get the value for the given user setting.
       * @param {string} key - The key of the application setting you ask for.
       * @param {(string|number)} defaultValue - The default.
       * @returns {Promise} A Promise resolves to the value or, if not set, the default.
       */
      get: function (key, defaultValue) {
        return settingsStorageProvider.readSettingsValue(key)
          .then((value) => {
            return value || defaultValue
          })
      }
    }
  },
  storage: {
    sources: new StorageSourcesProvider(), // Temporär für umgestalltung auf Module
    episodes: new StorageEpisodeProvider()
  },
  parser: ParserModul,
  web: new WebAccessProvider(null) // Temporär für umgestalltung auf Module
}

export default api

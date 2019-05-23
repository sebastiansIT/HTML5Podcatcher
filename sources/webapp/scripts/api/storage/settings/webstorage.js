/** Implementation of an Storage for configuration values based on the Local Storage API

    @module  podcatcher/storage/settings/localstorage
    @requires module:podcatcher/utils/logging
    @author  SebastiansIT [sebastian@human-injection.de]
    @license Copyright 2013-2015, 2019 Sebastian Spautz

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
/* global window, localStorage */

import { Logger } from '../../utils/logging.js'

/** Logger
  * @constant {module:podcatcher/utils/logging.Logger}
  * @private
  */
const LOGGER = new Logger('Storage/Settings/LocalStorage')

/** Implementation of the Interface ISettingsProvider based on the HTML5 Local Storage API
  * @class
  * @implements module:podcatcher/storage/settings~SettingsStorageProvider
  * @param {string} [settingIdentifier=settings] - The prefix for all keys that references settings in the Local Storage.
  */
class WebStorageSettingsProvider {
  constructor (settingIdentifier) {
    this.settingPrefix = settingIdentifier || 'settings'
  }

  get supported () {
    return window.localStorage
  }

  // TODO do I need a value changed event?

  writeSettingsValue (key, value) {
    try {
      localStorage.setItem(this.settingPrefix + '.' + key, value)
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }
  readSettingsValue (key) {
    try {
      var value = localStorage.getItem(this.settingPrefix + '.' + key)
      if (value === null) {
        return Promise.resolve(undefined)
      }
      return Promise.resolve(value)
    } catch (exception) {
      if (exception.code === 18) {
        LOGGER.fatal(`Please activate cookies in your browser settings! [${exception.name}: ${exception.message}]`)
      } else {
        LOGGER.error(exception)
      }
      Promise.reject(exception)
    }
  }
  listSettings () {
    var i, key
    var settings = {}
    for (i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i)
      if (localStorage.key(i).slice(0, this.settingPrefix.length + 1) === this.settingPrefix + '.') {
        settings[localStorage.key(i).slice(this.settingPrefix.length + 1)] = localStorage.getItem(key)
      }
    }
    return Promise.resolve(settings)
  }
  clearSettings () {
    var i, key
    for (i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i)
      if (localStorage.key(i).slice(0, this.settingPrefix.length + 1) === this.settingPrefix + '.') {
        localStorage.removeItem(key)
      }
    }
    return Promise.resolve()
  }

  toString () {
    return 'Settings storage provider based on Local Storage API [Prefixe ' + this.settingPrefix + ']'
  }
}
export default WebStorageSettingsProvider

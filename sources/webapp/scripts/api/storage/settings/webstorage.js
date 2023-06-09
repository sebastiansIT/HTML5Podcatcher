/**
 * Implementation of an Storage for configuration values based on the Local
 * Storage API.
    @module  podcatcher/storage/settings/localstorage
    @requires module:podcatcher/utils/logging
    @author  SebastiansIT [sebastian@human-injection.de]
    @license GPL-3.0-or-later
 *
    Copyright 2013-2015, 2019 Sebastian Spautz
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
/* global window, localStorage */

import { Logger } from '../../utils/logging.js'

/**
 * Logger.
 * @constant {module:podcatcher/utils/logging.Logger}
 * @private
 */
const LOGGER = new Logger('Storage/Settings/LocalStorage')

/**
 * Implementation of the Interface ISettingsProvider based on the HTML5
 * Local Storage API.
 * @class
 * @implements {module:podcatcher/storage/settings~SettingsStorageProvider}
 * @param {string} [settingIdentifier=settings] - The prefix for all keys that references settings in the Local Storage.
 */
class WebStorageSettingsProvider {
  /**
   * Creates a new settings provider width a given cluster identifier.
   * @param {string} [settingIdentifier] The cluster identifier.
   */
  constructor (settingIdentifier) {
    this.settingPrefix = settingIdentifier || 'settings'
  }

  /**
   * Returns True if this provider is supported by the Platform.
   * @returns {boolean} True if supported.
   */
  get supported () {
    return window.localStorage
  }

  // TODO do I need a value changed event?

  /**
   * Write a value for a key.
   * @param {string} key The key of the settings property.
   * @param {string} value The value of the settings property.
   * @returns {Promise} A promsie to write a value.
   */
  writeSettingsValue (key, value) {
    try {
      localStorage.setItem(this.settingPrefix + '.' + key, value)
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Reads the value for the given key.
   * @param {string} key The Key of a settings property.
   * @returns {Promise<string>} A promise to read the value.
   */
  readSettingsValue (key) {
    try {
      const value = localStorage.getItem(this.settingPrefix + '.' + key)
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

  /**
   * Lists all available keys.
   * @returns {Promise<Map<string, string>>} A promise for a map of key value pairs.
   */
  listSettings () {
    const settings = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (localStorage.key(i).slice(0, this.settingPrefix.length + 1) === this.settingPrefix + '.') {
        settings[localStorage.key(i).slice(this.settingPrefix.length + 1)] = localStorage.getItem(key)
      }
    }
    return Promise.resolve(settings)
  }

  /**
   * Clear all setting properties.
   * @returns {Promise} A Promise for clearing the settings.
   */
  clearSettings () {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (localStorage.key(i).slice(0, this.settingPrefix.length + 1) === this.settingPrefix + '.') {
        localStorage.removeItem(key)
      }
    }
    return Promise.resolve()
  }

  /**
   * Returns a name of the provider.
   * @returns {string} A name for the provider.
   */
  toString () {
    return 'Settings storage provider based on Local Storage API [Prefixe ' + this.settingPrefix + ']'
  }
}
export default WebStorageSettingsProvider

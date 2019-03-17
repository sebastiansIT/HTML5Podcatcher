/** This modul contains functions to manipulate the configuration. The configuration includes the subscriped podcast sources, the episodes, user settings an application settings.
    @module  HTML5Podcatcher/Configuration
    @requires HTML5Podcatcher/Storage
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @license Copyright 2015, 2016 Sebastian Spautz

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

/* global document */
/* global HTML5Podcatcher */

var configurationAPI = (function () {
  'use strict'
  var readConfiguration, overrideConfiguration, mergeConfigurations, resetConfiguration, settings
  var storage = HTML5Podcatcher.api.storage.StorageProvider

  /** An object containing the entire configuration. This includs all sources, all not jet listened episodes and all user settings.
    * @typedef {Object} Configuration
    * @property {!Array} config.sources - An array with all sources and feeds.
    * @property {!Array} config.episodes - An array with all not listened episodes.
    * @property {!Object} config.settings - An object containing all user settings (key/value-pairs).
    */

  /** The `ConfigurationReadedCallback` is called after each export of the entire configuration.
    *
    * @callback ConfigurationReadedCallback
    * @param {module:HTML5Podcatcher/Configuration~Configuration} config - The complete configuration (Application settings + sources + new episodes).
    */

  /** The `ConfigurationChangedCallback` is called after each import of the entire configuration.
    *
    * @callback ConfigurationChangedCallback
    * @param {module:HTML5Podcatcher/Configuration~Configuration} config - The complete configuration (Application settings + sources + new episodes).
    */

  /** @summary Access to the user settings.
    * @desc Access to the user settings as part of the entire Configuration. User settings are a key/value-store. In this store you can save all kind of user defined information for your application.
    * @namespace
    */
  settings = {
    /** Set a value for the given key of a user setting.
      * @param {string} key - The key of the user setting you want to set.
      * @param {(string|number)} value - The value for the user setting you want to set.
        */
    set: function (key, value) {
      storage.writeSettingsValue(key, value)
    },

    /** Get the value for the given user setting.
      * @param {string} key - The key of the application setting you ask for.
      * @param {(string|number)} defaultValue - The default.
      * @return The value or, if not set, the default.
      */
    get: function (key, defaultValue) {
      var value = storage.readSettingsValue(key) || defaultValue
      return value
    }
  }

  /** Collect all configuration values (User settings + sources + new episodes) into one object.
    * @param {module:HTML5Podcatcher/Configuration~ConfigurationReadedCallback} [onReadCallback] - The function that is called when the export is finished.
    */
  readConfiguration = function (onReadCallback) {
    var config
    config = { episodes: [], sources: [], settings: {} }
    // Export Settings
    config.settings = storage.listSettings()
    // Export active storage engine data
    storage.readSources(function (sourceArray) {
      sourceArray.forEach(function (source) {
        config.sources.push(source)
      })
      /* for (i = 0; i < sourceArray.length; i += 1) {
          config.sources.push(sourceArray[i]);
      } */
      storage.readPlaylist(false, function (episodeArray) {
        episodeArray.forEach(function (episode) {
          // remove information about download status - downloaded files aren't exportet
          delete episode.isFileSavedOffline
          config.episodes.push(episode)
        })
        /* for (i = 0; i < episodeArray.length; i += 1) {
            //remove information about download status - downloaded files aren't exportet
            delete episodeArray[i].isFileSavedOffline;
            config.episodes.push(episodeArray[i]);
        } */
        if (onReadCallback && typeof onReadCallback === 'function') {
          onReadCallback(config)
        }
      })
    })
  }

  /** Override the entire configuration including sources and episodes.
    * @param {Configuration} config - A complete configuration containing application settings, sources and episodes.
    * @param {module:HTML5Podcatcher/Configuration~ConfigurationChangedCallback} [onOverrideCallback] - The function that is called when import is finished.
    */
  overrideConfiguration = function (config, onOverrideCallback) {
    // (1) Delete old configuration. Then...
    resetConfiguration(function () {
      // (2) save the given configuration
      mergeConfigurations(config, onOverrideCallback)
    })
  }

  /** Merge the given configuration object into the active configuration. That means all sources in the parameter "config" are added.
    * @param {Configuration} config - A complete configuration containing application settings, sources and episodes.
    * @param {module:HTML5Podcatcher/Configuration~ConfigurationChangedCallback} [onMergedCallback] - The function that is called when import is finished.
    */
  mergeConfigurations = function (config, onMergedCallback) {
    var episodes = config.episodes
    var sources = config.sources
    // ... (1) copy all new settings and...
    Object.keys(config.settings).forEach(function (property) {
      if (!settings.get(property)) {
        settings.set(property, config.settings[property])
      }
    })
    /* for (property in config.settings) {
        if (config.settings.hasOwnProperty(property)) {
            if (!settings.get(property)) {
                settings.set(property, config.settings[property]);
            }
        }
    } */
    // ... (2) write all sources/feeds to the storage. Afterwards...
    storage.writeSources(sources, function () {
      // TODO ... (3) update all sources and...
      // ... (4) write all given episodes to the storage.
      // TODO don't override complete episodes - only override the attributes.
      storage.writeEpisodes(episodes, function () {
        if (onMergedCallback && typeof onMergedCallback === 'function') {
          onMergedCallback(config)
        }
      })
    })
  }

  /** Reset all configuration values (Application settings + sources + new episodes). Attention: This deletes all you Podcasts!
    * @param {module:HTML5Podcatcher/Configuration~ConfigurationChangedCallback} [onResetCallback] - The function that is called when the reset is finished and all data is deleted.
    */
  resetConfiguration = function (onResetCallback) {
    storage.cleanStorage(function () {
      if (onResetCallback && typeof onResetCallback === 'function') {
        onResetCallback({ sources: [], episodes: [], settings: {} })
      }
    })
  }

  // ====================================== //
  // === Export public Elements         === //
  // ====================================== //
  return {
    'readConfiguration': readConfiguration,
    'overrideConfiguration': overrideConfiguration,
    'mergeConfigurations': mergeConfigurations,
    'resetConfiguration': resetConfiguration,
    'settings': settings,
    /** Configures a custom logger function. This function is called by the global function "HTML5Podcatcher.logger" instead of the default console log if it is set.
      * @function
      * @param {string} message - The message of the log entry.
      * @param {string} logLevel - The level (i.E. error, warn, note, info, debug) of the log entry.
      * @param {string} [tag] - A tag, categorising the log message.
        */
    logger: undefined,
    /** Configures the time to wait for network requests.
      * @type {number}
      */
    downloadTimeout: 600000,
    /** Configures a URL pattern that is used when a file or a feed can't download directly.
      * In this URL the placeholder $url$ is replaced with the adress of the file or feed you want to load.
      * @example 'http://podcatcher.sebastiansit.de/proxy.py?url=$url$'
      * @type {string}
      */
    proxyUrlPattern: undefined
  }
}())

/** The modul "Configuration" is available at document.HTML5Podcatcher.api.configuration.
  * @global
  * @name "HTML5Podcatcher.api.configuration"
  * @see module:HTML5Podcatcher/Configuration
  */
HTML5Podcatcher.api.configuration = configurationAPI

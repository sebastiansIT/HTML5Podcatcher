/** @module  HTML5Podcatcher/Storage/WebStorage
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
/* global HTML5Podcatcher */
var webStorageImplementation = (function () {
  'use strict'
  var WebStorageDataProvider, WebStorageSettingsProvider

  // ========================================== //
  // === Implementation of DataProvider     === //
  // ========================================== //
  /** Provides access to a data storage implemented with Local/Web Storage API.
  * @class
  * @implements module:HTML5Podcatcher/Storage~IDataProvider
  * @param {string} [sourceIdentifier] - The prefix for all keys that references source objects.
  * @param {string} [episodeIdentifier] - The prefix for all keys that references episode objects.
  */
  WebStorageDataProvider = function (sourceIdentifier, episodeIdentifier) {
    var sourcePrefix = sourceIdentifier || 'source'
    var episodePrefix = episodeIdentifier || 'episode'
    this.getSourcePrefix = function () { return sourcePrefix }
    this.getEpisodePrefix = function () { return episodePrefix }
    this.isSupportedByCurrentPlatform = localStorage
  }
  WebStorageDataProvider.prototype = new HTML5Podcatcher.api.storage.IDataProvider()
  WebStorageDataProvider.prototype.constructor = WebStorageDataProvider
  WebStorageDataProvider.prototype.toString = function () {
    return 'Data storage provider based on Web Storage API [Prefixes ' + this.getSourcePrefix() + ' and ' + this.getEpisodePrefix() + ']'
  }
  WebStorageDataProvider.prototype.cleanStorage = function (onDeleteCallback) {
    localStorage.clear()
    if (onDeleteCallback && typeof onDeleteCallback === 'function') {
      onDeleteCallback()
    }
  }
  // == Access on storage for sources
  WebStorageDataProvider.prototype.readSource = function (sourceUri, onReadCallback) {
    var source
    source = JSON.parse(localStorage.getItem(this.getSourcePrefix() + '.' + sourceUri))
    if (!source) {
      source = { 'uri': sourceUri }
    }
    if (onReadCallback && typeof onReadCallback === 'function') {
      onReadCallback(source)
    }
  }
  /** Get a Array with all Sources from the persistent storage */
  WebStorageDataProvider.prototype.readSources = function (onReadCallback) {
    var pushFunction, i
    var sourceArray = []
    pushFunction = function (source) {
      sourceArray.push(source)
    }
    for (i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i).slice(0, 7) === (this.getSourcePrefix() + '.')) {
        this.readSource(localStorage.key(i).substring(7), pushFunction)
      }
    }

    if (onReadCallback && typeof onReadCallback === 'function') {
      onReadCallback(sourceArray)
    }
  }
  WebStorageDataProvider.prototype.writeSource = function (source, onWriteCallback) {
    localStorage.setItem(this.getSourcePrefix() + '.' + source.uri, JSON.stringify(source))

    if (onWriteCallback && typeof onWriteCallback === 'function') {
      onWriteCallback(source)
    }
  }
  WebStorageDataProvider.prototype.writeSources = function (sources, onWriteCallback) {
    var i
    for (i = 0; i < sources.length; i++) {
      this.writeSource(sources[i])
    }

    if (onWriteCallback && typeof onWriteCallback === 'function') {
      onWriteCallback(sources)
    }
  }
  WebStorageDataProvider.prototype.deleteSource = function (source, onDeleteCallback) {
    localStorage.removeItem(this.getSourcePrefix() + '.' + source.uri)

    if (onDeleteCallback && typeof onDeleteCallback === 'function') {
      onDeleteCallback(source)
    }
  }
  // == Access on storage for episodes
  WebStorageDataProvider.prototype.readEpisode = function (episodeUri, onReadCallback) {
    var episode
    if (episodeUri) {
      // Read Episode from local DOM-Storage
      episode = JSON.parse(localStorage.getItem(this.getEpisodePrefix() + '.' + episodeUri))
      if (!episode) {
        episode = { 'uri': episodeUri }
      }
      // Convert "updated" to date object
      if (episode.updated) {
        episode.updated = new Date(episode.updated)
      }
      // Generate "playback" object if not exists
      if (!episode.playback) {
        episode.playback = { 'played': false, 'currentTime': 0 }
      }
    }

    if (onReadCallback && typeof onReadCallback === 'function') {
      onReadCallback(episode)
    }
  }
  WebStorageDataProvider.prototype.readPlaylist = function (showAll, onReadCallback) {
    if (!showAll) {
      showAll = false
    }
    var i, filter
    var playlist = []
    filter = function (episode) {
      if (episode.playback.played === false || showAll === true) {
        playlist.push(episode)
      }
    }
    for (i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i).slice(0, 8) === (this.getEpisodePrefix() + '.')) {
        this.readEpisode(localStorage.key(i).substring(8), filter)
      }
    }
    playlist.sort(HTML5Podcatcher.sortEpisodes)

    if (onReadCallback && typeof onReadCallback === 'function') {
      onReadCallback(playlist)
    }
  }
  WebStorageDataProvider.prototype.readEpisodesBySource = function (source, onReadCallback) {
    var i, filter
    var episodes = []
    filter = function (episode) {
      if (episode.source === source.title) {
        episodes.push(episode)
      }
    }
    for (i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i).slice(0, 8) === this.getEpisodePrefix() + '.') {
        this.readEpisode(localStorage.key(i).substring(8), filter)
      }
    }
    episodes.sort(HTML5Podcatcher.sortEpisodes)

    if (onReadCallback && typeof onReadCallback === 'function') {
      onReadCallback(episodes)
    }
  }
  WebStorageDataProvider.prototype.writeEpisode = function (episode, onWriteCallback) {
    localStorage.setItem(this.getEpisodePrefix() + '.' + episode.uri, JSON.stringify(episode))

    if (onWriteCallback && typeof onWriteCallback === 'function') {
      onWriteCallback(episode)
    }
  }
  WebStorageDataProvider.prototype.writeEpisodes = function (episodes, onWriteCallback) {
    var i
    for (i = 0; i < episodes.length; i++) {
      this.writeEpisode(episodes[i])
    }

    if (onWriteCallback && typeof onWriteCallback === 'function') {
      onWriteCallback(episodes)
    }
  }

  // ========================================== //
  // === Implementation of SettingsProvider === //
  // ========================================== //
  /** Implementation of the Interface ISettingsProvider based on the HTML5 Local Storage API
    * @class
    * @implements module:HTML5Podcatcher/Storage~ISettingsProvider
    * @param {string} [settingIdentifier] - The prefix for all keys that references settings in the Local Storage.
    */
  WebStorageSettingsProvider = function (settingIdentifier) {
    var settingPrefix = settingIdentifier || 'settings'
    this.getSettingPrefix = function () { return settingPrefix }
    this.isSupportedByCurrentPlatform = window.localStorage
  }
  WebStorageSettingsProvider.prototype = new HTML5Podcatcher.api.storage.ISettingsProvider()
  WebStorageSettingsProvider.prototype.constructor = WebStorageSettingsProvider
  WebStorageSettingsProvider.prototype.toString = function () {
    return 'Settings storage provider based on Web Storage API [Prefixe ' + this.getSettingPrefix + ']'
  }

  WebStorageSettingsProvider.prototype.writeSettingsValue = function (key, value) {
    localStorage.setItem(this.getSettingPrefix() + '.' + key, value)
  }
  WebStorageSettingsProvider.prototype.readSettingsValue = function (key) {
    try {
      var value = localStorage.getItem(this.getSettingPrefix() + '.' + key)
      if (value === null) {
        return undefined
      }
      return value
    } catch (exception) {
      if (exception.code === 18) {
        HTML5Podcatcher.logger('Please activate Cookies in your Browser settings! [' + exception.name + ': ' + exception.message + ']', 'fatal')
      } else {
        HTML5Podcatcher.logger(exception, 'error')
      }
    }
  }
  WebStorageSettingsProvider.prototype.listSettings = function () {
    var i, key
    var settings = {}
    for (i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i)
      if (localStorage.key(i).slice(0, this.getSettingPrefix().length + 1) === this.getSettingPrefix() + '.') {
        settings[localStorage.key(i).slice(this.getSettingPrefix().length + 1)] = localStorage.getItem(key)
      }
    }
    return settings
  }
  WebStorageSettingsProvider.prototype.cleanStorage = function () {
    var i, key
    for (i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i)
      if (localStorage.key(i).slice(0, this.getSettingPrefix().length + 1) === this.getSettingPrefix() + '.') {
        localStorage.removeItem(key)
      }
    }
  }

  // ========================================== //
  // === Export public Elements             === //
  // ========================================== //
  return {
    'WebStorageDataProvider': WebStorageDataProvider,
    'WebStorageSettingsProvider': WebStorageSettingsProvider
  }
}())// end Modul webStorage

/** The modul "WebStorage" is available at document.HTML5Podcatcher.api.storage.WebStorage.
  * @global
  * @name "HTML5Podcatcher.api.storage.WebStorage"
  * @see module:HTML5Podcatcher/Storage/WebStorage
  */
HTML5Podcatcher.api.storage.webStorage = webStorageImplementation

HTML5Podcatcher.api.storage.StorageProvider.registerDataProvider(new HTML5Podcatcher.api.storage.webStorage.WebStorageDataProvider())
HTML5Podcatcher.api.storage.StorageProvider.registerSettingsProvider(new HTML5Podcatcher.api.storage.webStorage.WebStorageSettingsProvider())

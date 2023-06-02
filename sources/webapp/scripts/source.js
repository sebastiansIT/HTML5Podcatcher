/*  Copyright 2015, 2019, 2023 Sebastian Spautz

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
/* global navigator */
/* global window */
/* global document */
/* global $ */
/* global HTML5Podcatcher, POD */
/* global GlobalUserInterfaceHelper, UI */

import podcatcher from './api/podcatcher.js'
import ui from './ui/ui.js'

const LOGGER = podcatcher.utils.createLogger('hp5/view/source')
// TODO ersetze window podcatcher durch import podcatcher
// TODO ersetzt UI durch import ui
// TODO var durch let oder const ersetzen

GlobalUserInterfaceHelper.renderSourceDetails = function (source) {
  'use strict'
  var markup = UI.renderSource(source)
  // insert markup in page
  $('#information').empty()
  $('#information').append(markup)
  // set current values in toolbar
  $('#openSourceWebsite').attr('href', source.link)
  // read list of episodes and render them
  POD.storage.readEpisodesBySource(source, function (episodes) {
    UI.renderEpisodeList(episodes, 'desc')
  })
}

/** Central 'ready' event handler */
document.addEventListener('DOMContentLoaded', function (/* event */) {
  'use strict'
  let sourceUri

  const init = function () {
    LOGGER.debug('Open Source Details')
    window.podcatcher.configuration.settings.get('proxyUrl')
      .then((value) => {
        HTML5Podcatcher.api.configuration.proxyUrlPattern = value
      })
      .catch((error) => LOGGER.error(error))
    // ------------------- //
    // -- Initialise UI -- //
    // ------------------- //
    // Quota and Filesystem initialisation
    window.podcatcher.configuration.settings.get('quota')
      .then((value) => {
        HTML5Podcatcher.api.storage.StorageProvider.init({ quota: value })
      })
      .catch((error) => LOGGER.error(error))

    // Render Feed Details
    // Load Source and render Markup
    POD.storage.readSource(sourceUri, function (source) {
      UI.renderSourceDetails(source)
    })
    if (!navigator.onLine) {
      document.querySelectorAll('#updateSource, #openSourceWeb').forEach((element) => {
        element.setAttribute('disabled', 'disabled')
      })
    }
    // --------------------------- //
    // -- Register Eventhandler -- //
    // --------------------------- //
    // Init Events from PWA installing process
    UI.initWebManifest()
    // Register ServiceWorker
    UI.initServiceWorker()
    // Data manipulation events
    // * New or changed source
    document.addEventListener('writeSource', function (event) {
      var source
      source = event.detail.source
      UI.renderSourceDetails(source)
    }, false)
    // * New or changes episode
    document.addEventListener('writeEpisode', function (event) {
      const episode = event.detail.episode
      const episodeUI = UI.renderEpisode(episode)
      const playlistEntries = document.getElementById('episodes').querySelectorAll('.entries li')

      // find episode in HTML markup
      for (let i = 0; i < playlistEntries.length; i++) {
        if (playlistEntries[i].dataset.episodeUri === episode.uri) {
          playlistEntries[i].replaceWith(episodeUI)
          return
        }
      }
    }, false)

    // Events in list of episodes
    $('.content').on('click', '.status', function (event) {
      event.preventDefault()
      event.stopPropagation()
      POD.storage.readEpisode($(this).closest('li').data('episodeUri'), function (episode) {
        POD.toggleEpisodeStatus(episode)
      })
    })
    $('.content').on('click', '.downloadFile', UI.eventHandler.downloadEpisodeFile)
    $('.content').on('click', '.delete', function (event) {
      event.preventDefault()
      event.stopPropagation()
      POD.storage.readEpisode($(this).closest('li').data('episodeUri'), function (episode) {
        UI.logHandler('Deleting file "' + episode.offlineMediaUrl + '" starts now', 'info')
        POD.storage.deleteFile(episode)
      })
    })
    // Toolbar events
    document.getElementById('deleteSource').addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()

      const removeFunction = () => window.location.href = 'sources.html'
      POD.storage.readSource(sourceUri, function (source) {
        POD.storage.deleteSource(source, removeFunction)
      })
    })

    document.getElementById('updateSource').addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()

      const button = event.target
      const source = new podcatcher.model.Source(new URL(sourceUri))

      button.setAttribute('disabled', 'disabled')
      button.classList.add('spinner')
      // start update of the source
      source.update()
        .then(() => {
          LOGGER.info(`Succesfully updated source: ${source.url}.`)
          button.removeAttribute('disabled')
          button.classList.remove('spinner')
        })
        .catch((error) => {
          LOGGER.error(`Failure on updating source: ${error}.`)
          button.removeAttribute('disabled')
          button.classList.remove('spinner')
        })
    })

    UI.initGeneralUIEvents()
    UI.initConnectionStateEvents()
  }

  // Get source URI from query string
  sourceUri = window.location.search.split('uri=')[1]
  // Get alternativly the URI from Local Storage Setting
  if (!sourceUri) {
    window.podcatcher.configuration.settings.get('ShowDetailsForSource')
      .then((value) => {
        sourceUri = value
        // if query string and Local Storage Settings doesn't contain source uri redirect to sources.html
        if (!sourceUri) {
          window.location.href = 'sources.html'
        } else {
          init()
        }
      })
      .catch((error) => {
        LOGGER.error(error)
      })
  } else {
    init()
  }
})

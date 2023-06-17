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
/* global GlobalUserInterfaceHelper, UI */

import podcatcher from './api/podcatcher.js'
import ui from './ui/ui.js'

const LOGGER = podcatcher.utils.createLogger('hp5/view/source')
// TODO ersetze window podcatcher durch import podcatcher
// TODO ersetzt UI durch import ui

GlobalUserInterfaceHelper.renderSourceDetails = function (source) {
  'use strict'
  const markup = UI.renderSource(source)
  // insert markup in page
  document.getElementById('information').replaceChildren()
  document.getElementById('information').append(markup)
  // set current values in toolbar
  document.getElementById('openSourceWebsite').setAttribute('href', source.link)
  // read list of episodes and render them
  podcatcher.storage.episodes.readEpisodes(source)
    .then((episodes) => UI.renderEpisodeList(episodes, 'desc'))
}

/** Central 'ready' event handler */
document.addEventListener('DOMContentLoaded', function (/* event */) {
  'use strict'
  let sourceUri

  const init = async function () {
    LOGGER.debug('Open Source Details View')
    // ------------------- //
    // -- Initialise UI -- //
    // ------------------- //
    // Quota and Filesystem initialisation
    // TODO ersetzt das analog dem proyxURL im Fetch-Modul
    podcatcher.configuration.settings.get('quota')
      .then((value) => {
        HTML5Podcatcher.api.storage.StorageProvider.init({ quota: value })
      })
      .catch((error) => LOGGER.error(error))

    // Render Feed Details
    // Load Source and render Markup
    podcatcher.storage.sources.readSource(sourceUri)
    .then((source) => UI.renderSourceDetails(source))
    .catch((error) => LOGGER.error(error))

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
    document.addEventListener('writeSource', (event) => {
      const source = event.detail.source
      UI.renderSourceDetails(source)
    }, false)
    // * New or changes episode
    document.addEventListener('writeEpisode', (event) => {
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
    document.querySelector('.content').addEventListener('click', (event) => {
      if (event.target.closest('.status')) {
        event.preventDefault()
        event.stopPropagation()

        podcatcher.storage.episodes.readEpisode(event.target.closest('li').dataset.episodeUri)
          .then((episode) => {
            podcatcher.utils.tooglePaybackStatus(episode)
            // TODO Delete offline File
            return podcatcher.storage.episodes.writeEpisode(episode)
          })
          .catch((error) => LOGGER.error(error))
      }
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

      // TODO hier noch mal zuerst die Source zu lesen ist überflüssig
      podcatcher.storage.sources.readSource(sourceUri)
        .then((source) => podcatcher.storage.sources.deleteSource(source))
        .then(() => window.location.href = 'sources.html')
        .catch((error) => LOGGER.error(error))
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
          LOGGER.info(`Succesfully updated source: ${source.uri}.`)
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
    podcatcher.configuration.settings.get('ShowDetailsForSource')
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

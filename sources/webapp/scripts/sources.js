/*  Copyright 2015, 2019 Sebastian Spautz

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
/* global navigator, window, document, XMLSerializer */
/* global $ */
/* global HTML5Podcatcher, POD, UI */

import podcatcher from './api/podcatcher.js'
import ui from './ui/ui.js'

const LOGGER = podcatcher.utils.createLogger('hp5/view/sources')
// TODO ersetze window podcatcher durch import podcatcher
// TODO ersetzt UI durch import ui
// TODO var durch let oder const ersetzen

/** Central 'ready' event handler */
document.addEventListener('DOMContentLoaded', () => {
  'use strict'

  LOGGER.debug('Opens Source View')

  // -------------------------- //
  // -- Check Pre Conditions -- //
  // -------------------------- //
  UI.preConditionCheck(function (preConditionCheckResult) {
    if (preConditionCheckResult === 'missing proxy') {
      window.location.href = 'settings.html'
    } else if (preConditionCheckResult === 'missing sources') {
      $('#addSourceView').toggleClass('fullscreen')
    }
  })
  // ------------------- //
  // -- Initialise UI -- //
  // ------------------- //
  POD.storage.readSources(function (sources) {
    UI.renderSourceList(sources)
    // Disable "online only" functionality
    if (!navigator.onLine) {
      document.querySelectorAll('#refreshPlaylist, #showAddSourceView').forEach((element) => {
        element.setAttribute('disabled', 'disabled')
      })
    }
  })
  // --------------------------- //
  // -- Register Eventhandler -- //
  // --------------------------- //
  // Init Events from PWA installing process
  UI.initWebManifest()
  // Register ServiceWorker
  UI.initServiceWorker()
  // Connection State Events
  UI.initConnectionStateEvents()

  document.getElementById('sourceslist').addEventListener('click', (event) => {
    if (event.target.closest('.details')) {
      event.preventDefault()
      event.stopPropagation()

      // TODO kann man das nicht auch über url params lösen?
      window.podcatcher.configuration.settings.set(
        'ShowDetailsForSource', 
        event.target.closest('li').dataset.sourceUri
      )
        .then(() => window.location.href = 'source.html')
        .catch((error) => LOGGER.error(error))
    }
  })

  // Update one Source
  document.getElementById('sourceslist').addEventListener('click', (event) => {
    if (event.target.closest('.update')) {
      event.preventDefault()
      event.stopPropagation()

      const button = event.target.parentElement
      const source = new podcatcher.model.Source(new URL(button.getAttribute('href')))

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
    }
  })

  // Delete Source from Database
  document.getElementById('sourceslist').addEventListener('click', (event) => {
    if (event.target.closest('.delete')) {
      event.preventDefault()
      event.stopPropagation()
      
      const sourceElement = event.target.closest('li')
      if (sourceElement) {
        podcatcher.storage.sources.readSource(sourceElement.dataset.sourceUri)
          .then((source) => podcatcher.storage.sources.deleteSource(source))
          .then(() => { 
            sourceElement.classList.toggle('deleted')
            window.setTimeout(() => sourceElement.remove(), 400)
          })
          .catch((error) => LOGGER.error(error))
      }
    }
  })
    
  // New or Changed Source
  document.addEventListener('writeSource', function (event) {
    const source = event.detail.source
    const sourcelist = document.getElementById('sourceslist')
    const sourcelistEntries = sourcelist.querySelector('.entries li')
    const sourceUI = UI.renderSource(source)

    for (let i = 0; i < sourcelistEntries.length; i++) {
      if (sourcelistEntries[i].dataset.sourceUri === source.uri) {
        // TODO fade in and out
        sourcelistEntries[i].replaceWith(sourceUI)
        return
      }
    }
    // show source if not listed before
    sourcelist.querySelector('.entries').appendChild(sourceUI)
  }, false)

  // Reload all Podcasts
  document.getElementById('refreshPlaylist').addEventListener('click', UI.eventHandler.refreshAllSources)
  // Open and close the dialog to insert new Feeds/Sources
  document.querySelectorAll('#showAddSourceView, #addSourceView .closeDialog').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      document.getElementById('addSourceView').classList.toggle('fullscreen')
    })
  })
  // Adds a new feed/source
  document.getElementById('loadSourceButton').addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    const urlInput = document.getElementById('addSourceUrlInput')
    if (urlInput.checkValidity()) {
      new podcatcher.model.Source(urlInput.value.trim()).update()
        .then(() => {
          document.getElementById('addSourceView').classList.toggle('fullscreen')
          urlInput.value = ''
        })
        .catch((error) => LOGGER.error(error))
    }
  })
  document.getElementById('exportSourceList').addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()

    const opmlDocument = document.implementation.createDocument(null, 'opml', null)
    const opmlHead = opmlDocument.createElement('head')
    const opmlBody = opmlDocument.createElement('body')
    let opmlElement
    opmlDocument.documentElement.setAttribute('version', '2.0')
    opmlDocument.documentElement.appendChild(opmlHead)
    opmlDocument.documentElement.appendChild(opmlBody)
    // Title of the OPML document
    opmlElement = opmlDocument.createElement('title')
    opmlElement.appendChild(opmlDocument.createTextNode('HTML5Podcatcher Podcast List'))
    opmlHead.appendChild(opmlElement)
    // Date
    opmlElement = opmlDocument.createElement('dateCreated')
    opmlElement.appendChild(opmlDocument.createTextNode(new Date().toISOString()))
    opmlHead.appendChild(opmlElement)
    // Owner
    window.podcatcher.configuration.settings.get('syncronisationKey')
      .then((value) => {
        if (value) {
          opmlElement = opmlDocument.createElement('ownerName')
          opmlElement.appendChild(opmlDocument.createTextNode(value))
          opmlHead.appendChild(opmlElement)
        }
      })
      .then(() => {
        // Single Outline representing a Podcast
        POD.storage.readSources(sources => {
          sources.forEach(source => {
            opmlElement = opmlDocument.createElement('outline')
            opmlElement.setAttribute('type', 'rss')
            opmlElement.setAttribute('text', source.title)
            opmlElement.setAttribute('description', source.description)
            opmlElement.setAttribute('language', source.language)
            opmlElement.setAttribute('xmlUrl', source.uri)
            opmlElement.setAttribute('htmlUrl', source.link)
            opmlBody.appendChild(opmlElement)
          })

          POD.logger('Start download of OPML file now', 'debug', 'OPML export')
          var element = document.createElement('a')
          element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent('<?xml version="1.0" encoding="utf-8"?>' + new XMLSerializer().serializeToString(opmlDocument)))
          element.setAttribute('download', 'html5podcatcher.opml')
          element.style.display = 'none'
          document.body.appendChild(element)
          element.click()
          document.body.removeChild(element)
        })
      })
      .catch((error) => {
        LOGGER.error(error)
      })
  }, true)
  UI.initGeneralUIEvents()
  UI.initConnectionStateEvents()
})

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
/* global navigator, window, document, console, XMLSerializer */
/* global $ */
/* global HTML5Podcatcher, POD, UI */

/** Central 'ready' event handler */
$(document).ready(function () {
  'use strict'

  const LOGGER = window.podcatcher.utils.createLogger('hp5/view/sources')
  LOGGER.debug('Opens Source View')
  window.podcatcher.configuration.settings.get('proxyUrl')
    .then((value) => {
      HTML5Podcatcher.api.configuration.proxyUrlPattern = value
    })
    .catch((error) => LOGGER.error(error))

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
    if (!navigator.onLine) {
      $('#refreshPlaylist, #showAddSourceView').attr('disabled', 'disabled')
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
  $('#sourceslist').on('click', '.details', function (event) {
    event.preventDefault()
    event.stopPropagation()
    window.podcatcher.configuration.settings.set('ShowDetailsForSource', $(this).closest('li').data('sourceUri'))
      .catch((error) => LOGGER.error(error))
    window.location.href = 'source.html'
  })

  // Update one Source
  $('#sourceslist').on('click', '.update', function (event) {
    var limitOfNewEpisodes = 5
    var button = event.target
    var source = { uri: button.getAttribute('href') }

    event.preventDefault()
    event.stopPropagation()

    button.setAttribute('disabled', 'disabled')
    button.classList.add('spinner')
    // start update of the source
    HTML5Podcatcher.web.downloadSource(source, limitOfNewEpisodes, function () {
      button.removeAttribute('disabled')
      button.classList.remove('spinner')
    })
  })

  // Delete Source from Database
  $('#sourceslist').on('click', '.delete', function (event) {
    event.preventDefault()
    event.stopPropagation()
    var i, removeFunction
    removeFunction = function (element) {
      $(element).remove()
    }
    POD.storage.readSource($(this).closest('li').data('sourceUri'), function (source) {
      POD.storage.deleteSource(source, function (source) {
        for (i = 0; i < $('#sourceslist .entries li').length; i++) {
          if ($($('#sourceslist .entries li')[i]).data('sourceUri') === source.uri) {
            $($('#sourceslist .entries li')[i]).slideUp(400, removeFunction(this))
            break
          }
        }
      })
    })
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
  $('#showAddSourceView, #addSourceView .closeDialog').on('click', function (event) {
    event.preventDefault()
    event.stopPropagation()
    $('#addSourceView').toggleClass('fullscreen')
  })
  // Adds a new feed/source
  document.getElementById('loadSourceButton').addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()
    let urlInput = document.getElementById('addSourceUrlInput')
    if (urlInput.checkValidity()) {
      POD.storage.readSource(urlInput.value.trim(), function (source) {
        POD.web.downloadSource(source)
        document.getElementById('addSourceView').classList.toggle('fullscreen')
        urlInput.value = ''
      })
    }
  })
  document.getElementById('exportSourceList').addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()

    let opmlDocument = document.implementation.createDocument(null, 'opml', null)
    let opmlHead = opmlDocument.createElement('head')
    let opmlBody = opmlDocument.createElement('body')
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

/*  Copyright 2014 - 2016, 2019 Sebastian Spautz

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
/* global navigator, window, document */
/* global console, global */
/* global $ */
/* global POD, UI */
UI.exportConfiguration = function (onExportCallback) {
  'use strict'
  POD.api.configuration.readConfiguration(onExportCallback)
}
UI.importConfiguration = function (config, onImportCallback) {
  'use strict'
  POD.api.configuration.overrideConfiguration(config, onImportCallback)
}

/** Transfer the list of voices as option elements to the given
  * select element.
  * @private
  * @param {external:HTMLSelectElement} selectElement The element to insert the available voices in.
  * @returns {undefined}
  */
function populateVoiceList (selectElement) {
  const voices = window.h5p.speech.voices()

  for (let i = 0; i < voices.length; i++) {
    const option = document.createElement('option')
    option.textContent = voices[i].name + ' (' + voices[i].lang + ')'

    option.dataset['lang'] = voices[i].lang
    option.setAttribute('value', voices[i].name)
    selectElement.appendChild(option)
  }
}

function initSpeechSynthesisSettings () {
  const settingsElement = document.getElementById('speechSynthesisSettings')
  const rateElement = document.getElementById('speechSynthesisRateSelect')
  const pitchElement = document.getElementById('speechSynthesisPitchSelect')
  const volumeElement = document.getElementById('speechSynthesisVolumeSelect')
  const voicesElement = document.getElementById('speechSynthesisVoiceSelect')

  rateElement.value = UI.settings.get('speechSynthesisRate', 1)
  pitchElement.value = UI.settings.get('speechSynthesisPitch', 1)
  volumeElement.value = UI.settings.get('speechSynthesisVolume', 1)
  document.getElementById('speechSynthesisRateValue').textContent = Math.floor(rateElement.value * 100) + '%'
  document.getElementById('speechSynthesisPitchValue').textContent = pitchElement.value
  document.getElementById('speechSynthesisVolumeValue').textContent = Math.floor(volumeElement.value * 100) + '%'

  if (window.h5p.speech) {
    populateVoiceList(document.getElementById('speechSynthesisVoiceSelect'))
    const favorites = UI.settings.get('speechSynthesisFavoriteVoices', '').split(',')
    for (let i = 0; i < voicesElement.options.length; i++) {
      const option = voicesElement.options.item(i)
      if (favorites.includes(option.value)) {
        option.selected = true
      }
    }

    settingsElement.addEventListener('change', function (event) {
      event.preventDefault()
      event.stopPropagation()
      document.getElementById('speechSynthesisRateValue').textContent = Math.floor(rateElement.value * 100) + '%'
      document.getElementById('speechSynthesisPitchValue').textContent = pitchElement.value
      document.getElementById('speechSynthesisVolumeValue').textContent = Math.floor(volumeElement.value * 100) + '%'
    }, false)

    const testButton = document.getElementById('testSpeechSynthesisSettingsButton')
    testButton.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()

      let favorites = []
      for (let i = 0; i < voicesElement.selectedOptions.length; i++) {
        favorites.push(voicesElement.selectedOptions.item(i).value)
      }
      window.h5p.speech.synthesiser.favoriteVoices = favorites
      window.h5p.speech.synthesiser.rate = rateElement.value
      window.h5p.speech.synthesiser.pitch = pitchElement.value
      window.h5p.speech.synthesiser.volume = volumeElement.value

      window.h5p.speech.synthesiser.speak('This is a test of the speech syntesis.', 'en')
        .catch((errorCodeOrError) => {
          POD.logger(errorCodeOrError.message || errorCodeOrError, 'error')
        })
    })

    const saveButton = document.getElementById('saveSpeechSynthesisSettingsButton')
    saveButton.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()

      if (document.getElementById('speechSynthesisForm').checkValidity()) {
        let favorites = []
        for (let i = 0; i < voicesElement.selectedOptions.length; i++) {
          favorites.push(voicesElement.selectedOptions.item(i).value)
        }
        window.h5p.speech.synthesiser.favoriteVoices = favorites
        UI.settings.set('speechSynthesisFavoriteVoices', favorites)
        window.h5p.speech.synthesiser.rate = rateElement.value
        UI.settings.set('speechSynthesisRate', rateElement.value)
        window.h5p.speech.synthesiser.pitch = pitchElement.value
        UI.settings.set('speechSynthesisPitch', pitchElement.value)
        window.h5p.speech.synthesiser.volume = volumeElement.value
        UI.settings.set('speechSynthesisVolume', volumeElement.value)
      } else {
        UI.logHandler('Please check your configuration for the Web Speech API.', 'error')
      }
    })
  } else {
    settingsElement.classList.addClass('nonedisplay')
  }
}

/** Central 'ready' event handler */
document.addEventListener('DOMContentLoaded', function () {
  'use strict'
  var quota, appInfoRequest
  POD.logger('Opens Settings View', 'debug')

  // -- Initialise UI -- //
  // Init Proxy-Settings
  if (window.navigator.mozApps) { // is an Open Web App runtime
    appInfoRequest = window.navigator.mozApps.getSelf()
    appInfoRequest.onsuccess = function () {
      if (appInfoRequest.result) { // checks for installed app
        if (appInfoRequest.result.manifest.type === 'privileged' || appInfoRequest.result.manifest.type === 'certified') {
          // TODO replace inline style
          document.getElementById('proxy').style.display = 'none'
        }
      }
    }
  }
  if (UI.settings.get('proxyUrl')) {
    document.getElementById('httpProxyInput').value = UI.settings.get('proxyUrl')
    POD.api.configuration.proxyUrlPattern = UI.settings.get('proxyUrl')
  }

  // Init quota and filesystem
  if (POD.api.storage.chromeFileSystem !== undefined && POD.api.storage.StorageProvider.fileStorageProvider() instanceof POD.api.storage.chromeFileSystem.ChromeFileSystemFileProvider) {
    // TODO replace inline style
    document.getElementById('FileSystemAPI').style.display = 'block'
    quota = UI.settings.get('quota')
    if (!quota) {
      quota = 1024 * 1024 * 200
    }
    POD.api.storage.StorageProvider.fileStorageProvider().requestFileSystemQuota(quota, function (usage, quota) {
      UI.settings.set('quota', quota)
      var quotaConfigurationMarkup
      quotaConfigurationMarkup = document.getElementById('memorySizeInput')
      if (quotaConfigurationMarkup) {
        quotaConfigurationMarkup.value = (quota / 1024 / 1024)
        quotaConfigurationMarkup.setAttribute('min', Math.ceil(usage / 1024 / 1024))
        // TODO replace inline style
        quotaConfigurationMarkup.style.background = 'linear-gradient( 90deg, rgba(0,100,0,0.45) ' + Math.ceil((usage / quota) * 100) + '%, transparent ' + Math.ceil((usage / quota) * 100) + '%, transparent )'
      }
    })
  } else {
  // TODO replace inline style
    document.getElementById('FileSystemAPI').style.display = 'none'
  }

  // Init settings for logging
  if (UI.settings.get('logLevel')) {
    document.getElementById('logLevelSelect').value = UI.settings.get('logLevel')
  }

  // Init settings for syncronisation
  if (UI.settings.get('syncronisationEndpoint')) {
    document.getElementById('syncEndpoint').value = UI.settings.get('syncronisationEndpoint')
  }
  if (UI.settings.get('syncronisationKey')) {
    document.getElementById('syncKey').value = UI.settings.get('syncronisationKey')
  }

  // Init configuration for sortint of playlist
  if (UI.settings.get('playlistSort')) {
    document.getElementById('episodeSortSelect').value = UI.settings.get('playlistSort')
  }

  // Init settings for playback
  document.getElementById('playbackRateSelect').value = UI.settings.get('playbackRate', 1)
  document.getElementById('playbackRateValue').textContent = UI.settings.get('playbackRate', 1) * 100 + '%'

  // -------------------------- //
  // -- Check Pre Conditions -- //
  // -------------------------- //
  UI.preConditionCheck(function (preConditionCheckResult) {
    if (preConditionCheckResult === 'missing proxy') {
      UI.logHandler('Please insert the URL of a HTTP proxy (Example: "https://domain.net/proxy.py?url=$url$"). Use $url$ as a placeholder for the URL (feed or file) the proxy should load.', 'warn')
    }
  })
  // -- Register Eventhandler -- //
  // General UI Events
  UI.initGeneralUIEvents()
  // Init Events from PWA installing process
  UI.initWebManifest()
  // Register ServiceWorker
  UI.initServiceWorker()
  // Connection State Events
  UI.initConnectionStateEvents()
  // Configuration UI Events
  $('#memorySizeForm').on('submit', function (event) {
    event.preventDefault()
    event.stopPropagation()

    var value = document.getElementById('memorySizeInput').value

    if (document.getElementById('memorySizeInput').checkValidity()) {
      POD.api.storage.StorageProvider.fileStorageProvider().requestFileSystemQuota(value * 1024 * 1024)
    } else {
      UI.logHandler('Please insert a number', 'error')
    }
  })
  $('#saveProxyConfigurationButton').on('click', function (event) {
    event.preventDefault()
    event.stopPropagation()
    if ($('#httpProxyInput')[0].checkValidity()) {
      UI.settings.set('proxyUrl', $('#httpProxyInput').val())
    } else {
      UI.logHandler('Please insert a URL!', 'error')
    }
  })
  $('#saveSortConfigurationButton').on('click', function (event) {
    event.preventDefault()
    event.stopPropagation()
    UI.settings.set('playlistSort', $('#episodeSortSelect').val())
  })

  // Save Playback Settings
  document.getElementById('savePlaybackSettingsButton').addEventListener('click', function (event) {
    event.preventDefault()
    event.stopPropagation()
    UI.settings.set('playbackRate', document.getElementById('playbackRateSelect').value)
  }, false)

  document.getElementById('playbackRateSelect').addEventListener('change', function (event) {
    event.preventDefault()
    event.stopPropagation()
    document.getElementById('playbackRateValue').textContent = document.getElementById('playbackRateSelect').value * 100 + '%'
  }, false)

  // Transfer a JSON-Object with the whole configuration to a HTTP endpoint
  $('#SyncronisationForm').on('submit', function (event) {
    event.preventDefault()
    event.stopPropagation()

    var form = event.currentTarget
    var syncEndpoint, syncKey
    syncEndpoint = document.getElementById('syncEndpoint').value
    syncKey = document.getElementById('syncKey').value

    if (form.checkValidity()) {
      UI.settings.set('syncronisationEndpoint', syncEndpoint)
      UI.settings.set('syncronisationKey', syncKey)
      POD.api.configuration.readConfiguration(function (config) {
        POD.api.web.createXMLHttpRequest(function (xhr) {
          xhr.open('POST', syncEndpoint, true)
          xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
          xhr.onload = function () {
            POD.logger('Sended syncronisation value successfully.', 'note')
          }
          xhr.addEventListener('error', function (xhrError) {
            POD.logger('Can\'t upload configuration to syncronisation endpoint (' + xhrError.error + ')', 'error')
          })
          xhr.ontimeout = function () {
            POD.logger('Timeout after ' + (xhr.timeout / 60000) + ' minutes.', 'error')
          }
          xhr.send(JSON.stringify({ key: syncKey, value: config }))
        })
      })
    } else {
      POD.logger('Please insert a URL and a name!', 'error')
    }
  })

  // Load a JSON-Object with a complete configuration from a HTTP endpoint.
  $('#receiveSyncData').on('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    var syncEndpoint, syncKey, syncValue
    syncEndpoint = document.getElementById('syncEndpoint').value
    syncKey = document.getElementById('syncKey').value

    POD.api.web.createXMLHttpRequest(function (xhr) {
      xhr.open('GET', syncEndpoint + '?key=' + syncKey, true)
      xhr.onload = function () {
        POD.logger('Loaded syncronisation value successfully.', 'info')
        syncValue = JSON.parse(xhr.responseText)
        // set playback status of all episodes explicit to unlisend
        syncValue.entries[0].value.episodes.forEach((episode) => {
          episode.playback.played = false
        })
        POD.api.configuration.mergeConfigurations(syncValue.entries[0].value, function () {
          POD.api.configuration.proxyUrlPattern = POD.api.configuration.settings.get('proxyUrl')
          // update Sources width 0 as max new episodes
          POD.web.downloadAllSources(0, function (status) {
            POD.logger('Merged syncronisation value into local configuration successfully.', 'note')
          }, function (total, progress) {
            UI.logHandler(`Updated ${progress} of ${total} sources`, 'info', 'Import')
          })
        })
      }
      xhr.addEventListener('error', function (xhrError) {
        POD.logger('Can\'t download configuration from syncronisation endpoint (' + xhrError.error + ')', 'error')
      })
      xhr.ontimeout = function () {
        POD.logger('Timeout after ' + (xhr.timeout / 60000) + ' minutes.', 'error')
      }
      xhr.send()
    })
  })

  // Exports the whole configuration as a JSON-String to a text area field
  $('#exportConfiguration').on('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    var button = event.currentTarget

    button.setAttribute('disabled', 'disabled')
    UI.exportConfiguration(function (config) {
      document.getElementById('SerialisedConfigurationInput').value = JSON.stringify(config)
      button.removeAttribute('disabled')
    })
  })

  // Imports a complete configuration from a text area
  $('#importConfiguration').on('click', function (event) {
    event.preventDefault()
    event.stopPropagation()

    var config
    var button = event.currentTarget

    button.setAttribute('disabled', 'disabled')
    config = JSON.parse(document.getElementById('SerialisedConfigurationInput').value)
    UI.importConfiguration(config, function () {
      // update Sources width 0 as max new episodes
      POD.web.downloadAllSources(0, function (status) {
        button.removeAttribute('disabled')
        UI.logHandler('Finished import of configuration', 'note', 'configuration')
      }, function (total, progress) {
        UI.logHandler(`Updated ${progress} of ${total} sources`, 'info', 'Import')
      })
    })
  })

  $('#saveLogingConfiguration').on('click', function (event) {
    event.preventDefault()
    event.stopPropagation()
    UI.settings.set('logLevel', $('#logLevelSelect').val())
    UI.logHandler('Save loging configuration.', 'debug')
  })

  initSpeechSynthesisSettings()
}, false)

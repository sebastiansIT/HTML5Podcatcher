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

  return Promise.all([
    window.podcatcher.configuration.settings.get('speechSynthesisRate', 1),
    window.podcatcher.configuration.settings.get('speechSynthesisPitch', 1),
    window.podcatcher.configuration.settings.get('speechSynthesisVolume', 1)
  ])
    .then(([rate, pitch, volume]) => {
      rateElement.value = rate
      document.getElementById('speechSynthesisRateValue').textContent = Math.floor(rateElement.value * 100) + '%'
      pitchElement.value = pitch
      document.getElementById('speechSynthesisPitchValue').textContent = pitchElement.value
      volumeElement.value = volume
      document.getElementById('speechSynthesisVolumeValue').textContent = Math.floor(volumeElement.value * 100) + '%'
    })
    .then(() => {
      if (window.h5p.speech) {
        populateVoiceList(document.getElementById('speechSynthesisVoiceSelect'))
        window.podcatcher.configuration.settings.get('speechSynthesisFavoriteVoices', '')
          .then((favorites) => {
            favorites = favorites.split(',')
            for (let i = 0; i < voicesElement.options.length; i++) {
              const option = voicesElement.options.item(i)
              if (favorites.includes(option.value)) {
                option.selected = true
              }
            }
          })

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

          const setSetting = window.podcatcher.configuration.settings.set
          if (document.getElementById('speechSynthesisForm').checkValidity()) {
            let favorites = []
            for (let i = 0; i < voicesElement.selectedOptions.length; i++) {
              favorites.push(voicesElement.selectedOptions.item(i).value)
            }
            window.h5p.speech.synthesiser.favoriteVoices = favorites
            setSetting('speechSynthesisFavoriteVoices', favorites)
              .then(() => {
                window.h5p.speech.synthesiser.rate = rateElement.value
                return setSetting('speechSynthesisRate', rateElement.value)
              })
              .then(() => {
                window.h5p.speech.synthesiser.pitch = pitchElement.value
                return setSetting('speechSynthesisPitch', pitchElement.value)
              })
              .then(() => {
                window.h5p.speech.synthesiser.volume = volumeElement.value
                return setSetting('speechSynthesisVolume', volumeElement.value)
              })
              .catch((error) => LOGGER.error(error))
          } else {
            UI.logHandler('Please check your configuration for the Web Speech API.', 'error')
          }
        })
      } else {
        settingsElement.classList.add('nonedisplay')
      }
    })
}

let LOGGER = null

/** Central 'ready' event handler */
document.addEventListener('DOMContentLoaded', function () {
  'use strict'
  var appInfoRequest

  LOGGER = window.podcatcher.utils.createLogger('hp5/view/settings')
  LOGGER.debug('Opens Settings View')

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

  window.podcatcher.configuration.settings.get('proxyUrl')
    .then((value) => {
      if (value) {
        document.getElementById('httpProxyInput').value = value
      }
      POD.api.configuration.proxyUrlPattern = value
    })
    .catch((error) => LOGGER.error(error))

  // Init quota and filesystem
  if (POD.api.storage.chromeFileSystem !== undefined &&
      POD.api.storage.StorageProvider.fileStorageProvider() instanceof POD.api.storage.chromeFileSystem.ChromeFileSystemFileProvider) {
    document.getElementById('FileSystemAPI').classList.remove('nonedisplay')
    window.podcatcher.configuration.settings.get('quota')
      .then((quota) => {
        if (!quota) {
          quota = 1024 * 1024 * 200
        }
        POD.api.storage.StorageProvider.fileStorageProvider().requestFileSystemQuota(quota, function (usage, quota) {
          window.podcatcher.configuration.settings.set('quota', quota)
            .catch((error) => LOGGER.error(error))
          var quotaConfigurationMarkup
          quotaConfigurationMarkup = document.getElementById('memorySizeInput')
          if (quotaConfigurationMarkup) {
            quotaConfigurationMarkup.value = (quota / 1024 / 1024)
            quotaConfigurationMarkup.setAttribute('min', Math.ceil(usage / 1024 / 1024))
            // TODO replace inline style
            quotaConfigurationMarkup.style.background = 'linear-gradient( 90deg, rgba(0,100,0,0.45) ' + Math.ceil((usage / quota) * 100) + '%, transparent ' + Math.ceil((usage / quota) * 100) + '%, transparent )'
          }
        })
      })
      .catch((error) => LOGGER.error(error))
  } else {
    document.getElementById('FileSystemAPI').classList.add('nonedisplay')
  }

  // Init settings for logging
  window.podcatcher.configuration.settings.get('logLevel')
    .then((logLevel) => {
      if (logLevel) {
        document.getElementById('logLevelSelect').value = logLevel
      }
    })
    .catch((error) => LOGGER.error(error))

  // Init settings for syncronisation
  Promise.all([
    window.podcatcher.configuration.settings.get('syncronisationEndpoint', ''),
    window.podcatcher.configuration.settings.get('syncronisationKey', '')
  ])
    .then(([endpoint, key]) => {
      document.getElementById('syncEndpoint').value = endpoint
      document.getElementById('syncKey').value = key
    })
    .catch((error) => LOGGER.error(error))

  // Init configuration for sortint of playlist
  window.podcatcher.configuration.settings.get('playlistSort')
    .then((order) => {
      if (order) {
        document.getElementById('episodeSortSelect').value = order
      }
    })
    .catch((error) => LOGGER.error(error))

  // Init settings for playback
  window.podcatcher.configuration.settings.get('playbackRate', 1)
    .then((rate) => {
      document.getElementById('playbackRateSelect').value = rate
      document.getElementById('playbackRateValue').textContent = rate * 100 + '%'
    })
    .catch((error) => LOGGER.error(error))

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
      window.podcatcher.configuration.settings.set('proxyUrl', document.getElementById('httpProxyInput').value)
        .catch((error) => LOGGER.error(error))
    } else {
      UI.logHandler('Please insert a URL!', 'error')
    }
  })
  $('#saveSortConfigurationButton').on('click', function (event) {
    event.preventDefault()
    event.stopPropagation()
    window.podcatcher.configuration.settings.set('playlistSort', document.getElementById('episodeSortSelect').value)
      .catch((error) => LOGGER.error(error))
  })

  // Save Playback Settings
  document.getElementById('savePlaybackSettingsButton').addEventListener('click', function (event) {
    event.preventDefault()
    event.stopPropagation()
    window.podcatcher.configuration.settings.set('playbackRate', document.getElementById('playbackRateSelect').value)
      .catch((error) => LOGGER.error(error))
  }, false)

  document.getElementById('playbackRateSelect').addEventListener('change', function (event) {
    event.preventDefault()
    event.stopPropagation()
    document.getElementById('playbackRateValue').textContent = document.getElementById('playbackRateSelect').value * 100 + '%'
  }, false)

  // Transfer a JSON-Object with the whole configuration to a HTTP endpoint
  $('#SyncronisationForm').on('submit', (event) => {
    event.preventDefault()
    event.stopPropagation()

    var form = event.currentTarget
    var syncEndpoint, syncKey
    syncEndpoint = document.getElementById('syncEndpoint').value
    syncKey = document.getElementById('syncKey').value

    if (form.checkValidity()) {
      Promise.all([
        window.podcatcher.configuration.settings.set('syncronisationEndpoint', syncEndpoint),
        window.podcatcher.configuration.settings.set('syncronisationKey', syncKey)
      ])
        .then(() => {
          POD.api.configuration.readConfiguration(function (config) {
            POD.api.web.createXMLHttpRequest(function (xhr) {
              xhr.open('POST', syncEndpoint, true)
              xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
              xhr.onload = function () {
                LOGGER.note('Sended syncronisation value successfully.')
              }
              xhr.addEventListener('error', function (xhrError) {
                LOGGER.error('Can\'t upload configuration to syncronisation endpoint (' + xhrError.error + ')')
              })
              xhr.ontimeout = function () {
                LOGGER.error('Timeout after ' + (xhr.timeout / 60000) + ' minutes.')
              }
              xhr.send(JSON.stringify({ key: syncKey, value: config }))
            })
          })
        })
        .catch((error) => LOGGER.error(error))
    } else {
      LOGGER.error('Please insert a URL and a name!')
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
          window.podcatcher.configuration.settings.get('proxyUrl')
            .then((value) => {
              POD.api.configuration.proxyUrlPattern = value
              // update Sources width 0 as max new episodes
              POD.web.downloadAllSources(0, function (status) {
                LOGGER.note('Merged syncronisation value into local configuration successfully.')
              }, function (total, progress) {
                UI.logHandler(`Updated ${progress} of ${total} sources`, 'info', 'Import')
              })
            })
            .catch((error) => LOGGER.error(error))
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
    window.podcatcher.configuration.settings.set('logLevel', document.getElementById('logLevelSelect').value)
      .then(() => LOGGER.debug('Save loging configuration.'))
      .catch((error) => LOGGER.error(error))
  })

  initSpeechSynthesisSettings()
}, false)

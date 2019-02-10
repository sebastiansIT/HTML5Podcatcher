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
/* global window, navigator, document, console, confirm */
/* global Worker, MessageChannel, Notification */
/* global $ */
/* global HTML5Podcatcher, POD */
var GlobalUserInterfaceHelper = {
  formatTimeCode: function (timecode) {
    'use strict'
    // Validate Parameter to be a number
    if (isNaN(+timecode)) {
      throw new TypeError('Timecode needs to be a positiv integer')
    }
    // Validate Parameter to be a positiv number
    if (timecode < 0) {
      throw new RangeError('Timecode needs to be a positiv integer')
    }
    var hours, minutes, seconds
    hours = Math.floor(timecode / 3600)
    minutes = Math.floor((timecode % 3600) / 60)
    seconds = timecode % 60
    hours = (hours < 10) ? '0' + hours : hours
    minutes = (minutes < 10) ? '0' + minutes : minutes
    seconds = (seconds < 10) ? '0' + seconds : seconds
    return hours + ':' + minutes + ':' + seconds
  },
  escapeHtml: function (text) {
    'use strict'
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  },
  logHandler: function (message, logLevelName, tag) {
    'use strict'
    var logLevel = 0
    var allowedLevel, messageNode, logEntryNode, notification
    if (logLevelName && logLevelName.indexOf(':') >= 0) {
      logLevelName = logLevelName.substring(0, logLevelName.indexOf(':'))
      tag = logLevelName.substring(logLevelName.indexOf(':') + 1)
    }
    tag = tag || ''

    // Print message to console
    switch (logLevelName) {
      case 'debug':
        logLevel = 1
        console.debug(message)
        break
      case 'info':
        logLevel = 2
        console.info(message)
        break
      case 'note':
        logLevel = 2.5
        console.info(message)
        break
      case 'warn':
        logLevel = 3
        console.warn(message)
        break
      case 'error':
        logLevel = 4
        console.error(message)
        break
      case 'fatal':
        logLevel = 5
        console.error(message)
        $('#logView').addClass('fullscreen')
        break
      default:
        console.log(logLevel + ': ' + message)
    }

    // Show message as Web Notification
    if (logLevel === 2.5 && window.Notification) {
      if (Notification.permission === 'granted') { // If it's okay let's create a notification
        notification = new Notification(message, { icon: 'images/logo32.png', tag: 'HTML5Podcatcher' + tag })
      } else if (Notification.permission !== 'denied') { // Otherwise, we need to ask the user for permission
        Notification.requestPermission(function (permission) {
          // If the user accepts, let's create a notification
          if (permission === 'granted') {
            notification = new Notification(message, { icon: 'images/logo32.png', tag: 'HTML5Podcatcher' + tag })
          }
        })
      }
    }

    // Show message in the user interface
    logEntryNode = document.createElement('p')
    allowedLevel = GlobalUserInterfaceHelper.settings.get('logLevel') || 0
    if (logLevel >= allowedLevel) {
      logEntryNode.className = logLevelName
      logEntryNode.appendChild(document.createTextNode(message))
      if (document.getElementById('log')) {
        document.getElementById('log').insertBefore(logEntryNode, document.getElementById('log').firstChild)
      }
      if (document.getElementById('activeMessage') && logLevel > 2) {
        messageNode = document.getElementById('activeMessage')
        while (messageNode.hasChildNodes()) {
          messageNode.removeChild(messageNode.lastChild)
        }
        messageNode.appendChild(logEntryNode.cloneNode(true))
      }
    }
  },
  errorHandler: function (event) {
    'use strict'
    var eventstring = event.toString() + ' {'
    $.each(event, function (i, n) {
      eventstring += i + ': "' + n + '"; '
    })
    eventstring += '}'
    this.logHandler(this.escapeHtml(eventstring), 'error')
  },
  successHandler: function (event) {
    'use strict'
    this.logHandler(event, 'info')
  },

  progressHandler: function (progressEvent, episode) {
    'use strict'
    var percentComplete, episodeUI

    episodeUI = GlobalUserInterfaceHelper.findEpisodeUI(episode)
    if (progressEvent.lengthComputable) {
      // Downloaded Bytes / (total Bytes + 3% for saving to local storage)
      percentComplete = progressEvent.loaded / (progressEvent.total + (progressEvent.total / 33))
      episodeUI.style.background = 'linear-gradient(to right, rgba(0, 100, 0, 0.2) 0%,rgba(0, 100, 0, 0.2) ' + (percentComplete * 100).toFixed(2) + '%, #ffffff ' + (percentComplete * 100).toFixed(2) + '%)'
    }
  },

  preConditionCheck: function (actionCallback) {
    'use strict'
    var appInfoRequest, proxyNeededCheck, feedExistingCheck
    feedExistingCheck = function () {
      // Checks if some feeds exists in storage
      HTML5Podcatcher.storage.readSources(function (sources) {
        if (sources.length < 1) {
          actionCallback('missing sources')
        } else {
          actionCallback('OK')
        }
      })
    }
    proxyNeededCheck = function () {
      // Checks if Proxy is needed (Permission for System XHR is not set and proxy url is not set in configuration)
      if (window.navigator.mozApps) { // is an Open Web App runtime
        appInfoRequest = window.navigator.mozApps.getSelf()
        appInfoRequest.onsuccess = function () {
          if (appInfoRequest.result) { // checks for installed app
            HTML5Podcatcher.logger(appInfoRequest.result.manifest.name + ' is a ' + appInfoRequest.result.manifest.type + ' app.', 'debug')
            if (appInfoRequest.result.manifest.type === 'privileged' || appInfoRequest.result.manifest.type === 'certified') {
              HTML5Podcatcher.logger('App is allowed to post System XHR requests.', 'debug')
              feedExistingCheck()
            } else {
              if (!GlobalUserInterfaceHelper.settings.get('proxyUrl') || GlobalUserInterfaceHelper.settings.get('proxyUrl').length < 11) {
                actionCallback('missing proxy')
              } else {
                feedExistingCheck()
              }
            }
          } else { // checks for app opend in browser
            HTML5Podcatcher.logger('This Webapp isn\'t installed as an Mozilla Open Web App but you can install it from Firefox Marketplace.', 'debug')
            if (!GlobalUserInterfaceHelper.settings.get('proxyUrl') || GlobalUserInterfaceHelper.settings.get('proxyUrl').length < 11) {
              actionCallback('missing proxy')
            } else {
              feedExistingCheck()
            }
          }
        }
      } else { // is a runtime without support for Open Web Apps
        HTML5Podcatcher.logger('This Webapp isn\'t installed as an Open Web App.', 'debug')
        if (!GlobalUserInterfaceHelper.settings.get('proxyUrl') || GlobalUserInterfaceHelper.settings.get('proxyUrl').length < 11) {
          actionCallback('missing proxy')
        } else {
          feedExistingCheck()
        }
      }
    }
    proxyNeededCheck()
  },
  settings: HTML5Podcatcher.api.configuration.settings,

  /** Handle Events from Web-Manifest-API */
  initWebManifest: () => {
    /* TODO motivate the user to click "install" in the browsers promt */
    // window.addEventListener('beforeinstallprompt', async (event) => {
    //   event.preventDefault()
    //   GlobalUserInterfaceHelper.logHandler('You will ask to install this app on your local device. Trust me, say YES!', 'note', 'WebManifest');
    //   try {
    //     await event.prompt()
    //     const { outcome } = await event.userChoice
    //     if (outcome === 'dismissed') { // alternativ "installed"
    //       GlobalUserInterfaceHelper.logHandler('Why not installing it localy?', 'info', 'WebManifest')
    //     } else {
    //       GlobalUserInterfaceHelper.logHandler('Welcome to my app - enjoy your podcasts.', 'note', 'WebManifest')
    //     }
    //   } catch(exception) {
    //     GlobalUserInterfaceHelper.logHandler('Somthing whent wrong installing the PWA', 'error', 'WebManifest')
    //   }
    // })

    window.addEventListener('appinstalled', (event) => {
      GlobalUserInterfaceHelper.logHandler('Thank you for installing H5P on your device', 'note', 'WebManifest')
    })
  },
  /** Register ServiceWorker and handle the update prozess
    * @returns undefined
  */
  initServiceWorker: function () {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('serviceworker.js')
        .then(registration => {
          const CONFIRM_MESSAGE = 'An update of HTML5 Podcatcher is available. Do you want to reload now?'

          GlobalUserInterfaceHelper.logHandler('ServiceWorker registration successful with scope: ' + registration.scope, 'debug', 'ServiceWorker')

          if (registration.active) { // Allway a ServiceWorker is active
            if (registration.installing) {
              GlobalUserInterfaceHelper.logHandler('ServiceWorker is active but a update is installing.', 'debug', 'ServiceWorker')
            } else if (registration.waiting) {
              GlobalUserInterfaceHelper.logHandler('ServiceWorker  is active but a update is waiting to become active.', 'debug', 'ServiceWorker')
              if (confirm(CONFIRM_MESSAGE)) {
                var messageChannel = new MessageChannel()
                // addEventListener('message') doesn't work in Chrome
                messageChannel.port1.onmessage = function (event) {
                  if (event.data.command && event.data.command === 'confirm') {
                    POD.logger('ServiceWorker skips waiting phase, reload page now', 'info')
                    window.location.reload()
                  } else if (event.data.command && event.data.command === 'messageLog') {
                    POD.logger(...event.data.message)
                  }
                }
                registration.waiting.postMessage({
                  command: 'skipWaiting',
                  message: 'Activate waiting update now'
                },
                [messageChannel.port2])
              }
            } else {
              GlobalUserInterfaceHelper.logHandler('ServiceWorker inital state is "active."', 'debug', 'ServiceWorker')
            }
          } else { // The ServiceWorker is installed the first time
            if (registration.installing) {
              GlobalUserInterfaceHelper.logHandler('ServiceWorker inital state is "installing."', 'debug', 'ServiceWorker')
            } else if (registration.waiting) {
              GlobalUserInterfaceHelper.logHandler('ServiceWorker inital state is "waiting".', 'debug', 'ServiceWorker')
            }
          }

          registration.addEventListener('updatefound', () => {
            const NEW_WORKER = registration.installing
            NEW_WORKER.addEventListener('statechange', statechangeevent => {
              const STATE = statechangeevent.target.state
              GlobalUserInterfaceHelper.logHandler('ServiceWorker state changed to ' + STATE, 'debug')

              if (registration.active &&
                  STATE === 'installed' &&
                  confirm(CONFIRM_MESSAGE)) {
                var messageChannel = new MessageChannel()
                messageChannel.port1.onmessage = function (event) {
                  if (event.data.command && event.data.command === 'confirm') {
                    POD.logger('ServiceWorker skips waiting phase, reload page now', 'info')
                    window.location.reload()
                  } else if (event.data.command && event.data.command === 'messageLog') {
                    POD.logger(...event.data.message)
                  }
                }
                registration.waiting.postMessage(
                  {
                    command: 'skipWaiting',
                    message: 'Activate update now'
                  },
                  [messageChannel.port2])
              }
            })
          })
        })
        .catch(error => {
          GlobalUserInterfaceHelper.logHandler('ServiceWorker registration failed: ' + error, 'error', 'ServiceWorker')
        })

      // Handler for messages coming from the service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.command && event.data.command === 'messageLog') {
          GlobalUserInterfaceHelper.logHandler(...event.data.message)
        } else {
          console.log('Received message from ServiceWorker: ', event.data)
        }
      })
    } else {
      GlobalUserInterfaceHelper.logHandler('ServiceWorker isn\'t supportet on this platform', 'debug', 'ServiceWorker')
      GlobalUserInterfaceHelper.logHandler('This app can\'t used offline!', 'warn', 'ServiceWorker')
    }
  },
  initConnectionStateEvents: function () {
    'use strict'
    window.addEventListener('online', function () {
      GlobalUserInterfaceHelper.logHandler('Online now', 'info')
      $('.onlineOnly').removeAttr('disabled')
      $('.onlineOnly, a.external').removeAttr('aria-disabled')
    }, false)
    window.addEventListener('offline', function () {
      GlobalUserInterfaceHelper.logHandler('Offline now', 'info')
      $('.onlineOnly').attr('disabled', 'disabled')
      $('.onlineOnly, a.external').attr('aria-disabled', 'true')
    }, false)
  },
  initGeneralUIEvents: function () {
    'use strict'
    var i, openLogViewClickListener, logViewOpenCloseButtons, appCloseButton
    logViewOpenCloseButtons = document.querySelectorAll('#showLogView, #logView .closeDialog')
    openLogViewClickListener = function (event) {
      event.preventDefault()
      event.stopPropagation()
      let logView = document.getElementById('logView')
      logView.classList.toggle('fullscreen')
      if (logView.hasAttribute('open')) {
        logView.removeAttribute('open')
      } else {
        logView.setAttribute('open', 'open')
      }
    }
    for (i = 0; i < logViewOpenCloseButtons.length; i += 1) {
      logViewOpenCloseButtons[i].addEventListener('click', openLogViewClickListener, false)
    }
    appCloseButton = document.getElementById('appClose')
    if (appCloseButton) {
      appCloseButton.addEventListener('click', function (event) {
        event.preventDefault()
        event.stopPropagation()
        window.open('', '_parent', '')
        window.close()
      }, false)
    }
    $('.external').attr('target', '_blank')
  },

  /** Renders the html markup for a single episode.
    * @param {Episode} episode - The Episode to render.
    * @return {Node} HTML-Element with the visualisation of an Episode.
    */
  renderEpisode: function (episode) {
    'use strict'
    /* let jumppointUI */
    let fragment = document.importNode(document.getElementById('episodeTemplate').content, true)
    let entryUI = fragment.firstElementChild
    if (episode.language) {
      entryUI.setAttribute('lang', episode.language)
    }
    entryUI.dataset.episodeUri = episode.uri
    entryUI = $(entryUI)
    entryUI.find('a.link').attr('href', episode.uri)
    entryUI.find('.title').text(episode.title)
    if (episode.subTitle) {
      entryUI.find('.subtitle').text(episode.subTitle)
    } else {
      entryUI.find('.subtitle').remove()
    }
    entryUI.find('.source').text(episode.source)
    if (episode.playback.played) {
      entryUI.find('.updated').attr('datetime', episode.updated.toISOString()).text(episode.updated.toLocaleDateString() + ' ' + episode.updated.toLocaleTimeString())
    } else {
      entryUI.find('.updated').attr('datetime', episode.updated.toISOString()).text('New')
    }
    entryUI.find('a.origin').attr('href', episode.uri)
    if (POD.storage.isFileStorageAvailable() && episode.mediaUrl) {
      if (episode.isFileSavedOffline) {
        entryUI.find('.downloadFile').replaceWith('<button class="delete" href="' + episode.mediaUrl + '" data-icon="delete">Delete</button>')
      } else if (episode.mediaUrl) {
        entryUI.addClass('onlineOnly')
        entryUI.find('.downloadFile').attr('href', episode.mediaUrl).attr('download', episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf('/') + 1))
      }
    } else {
      entryUI.addClass('news')
      entryUI.find('.downloadFile').remove()
    }
    // if (episode.jumppoints) {
    //   entryUI.find('.jumppoints').empty();
    //   episode.jumppoints.forEach(function (jumppoint) {
    //     jumppointUI = $('<li>');
    //     jumppointUI.text(jumppoint.title);
    //     jumppointUI.data('timecode', jumppoint.time);
    //     entryUI.find('.jumppoints').append(jumppointUI);
    //   });
    // } else {
    //   entryUI.remove('.jumppoints');
    // }
    // deactivate online-only-functions when offline
    if (!navigator.onLine) {
      if (entryUI.hasClass('onlineOnly')) {
        entryUI.attr('aria-disabled', 'true')
      }
      entryUI.find('.onlineOnly, a.external').attr('aria-disabled', 'true')
    }
    entryUI.find('.external').attr('target', '_blank')
    return fragment
  },

  renderEpisodeList: function (episodes, order) {
    'use strict'
    var listUI, entryUI, i
    listUI = $('#playlist .entries, #episodes .entries')
    listUI.empty()
    if (episodes && episodes.length > 0) {
      for (i = 0; i < episodes.length; i += 1) {
        entryUI = GlobalUserInterfaceHelper.renderEpisode(episodes[i])
        if (!order || order === 'asc') {
          listUI.append(entryUI)
        } else {
          listUI.prepend(entryUI)
        }
      }
    } else {
      entryUI = $('<li class="emptyPlaceholder">no entries</li>')
      listUI.append(entryUI)
    }
    $('.loader').remove()
  },
  renderSource: function (source) {
    'use strict'
    let fragment = document.importNode(document.getElementById('sourceTemplate').content, true)
    let entryUI = fragment.firstElementChild
    if (source.language) {
      entryUI.setAttribute('lang', source.language)
    }
    if (entryUI.querySelector('a.details')) {
      entryUI.querySelector('a.details').setAttribute('href', 'source.html?uri=' + source.uri)
      entryUI.querySelector('a.details').setAttribute('title', 'Details for ' + source.title)
    }
    entryUI = $(entryUI)
    entryUI.data('sourceUri', source.uri)
    entryUI.find('.title').text(source.title)
    entryUI.find('a.uri').attr('href', source.uri)
    entryUI.find('span.uri').text(source.uri)
    entryUI.find('.link').attr('href', source.link)
    entryUI.find('.description').text(source.description)
    entryUI.find('.update').attr('href', source.uri)
    if (source.img && source.img.uri) {
      entryUI.find('.image').attr('src', source.img.uri)
    } else {
      entryUI.find('.image').remove()
    }
    if (source.license) {
      entryUI.find('.license').text(source.license)
    } else {
      entryUI.find('.license').text('All rights reserved or no information')
    }
    // deactivate online-only-functions when offline
    if (!navigator.onLine) {
      entryUI.find('.onlineOnly, a.external').attr('aria-disabled', 'true')
    }
    entryUI.find('.external').attr('target', '_blank')
    entryUI.find('[nodeid]').each(function () {
      this.setAttribute('id', this.getAttribute('nodeid'))
      this.removeAttribute('nodeid')
    })
    return fragment
  },
  renderSourceList: function (sourcelist) {
    'use strict'
    var sourcelistUI, entryUI, i
    sourcelistUI = $('#sourceslist .entries')
    sourcelistUI.empty()
    if (sourcelist && sourcelist.length > 0) {
      for (i = 0; i < sourcelist.length; i += 1) {
        entryUI = this.renderSource(sourcelist[i])
        sourcelistUI.append(entryUI)
      }
    } else {
      entryUI = $('<li class="emptyPlaceholder">no entries</li>')
      sourcelistUI.append(entryUI)
    }
    $('.loader').remove()
  },
  findEpisodeUI: function (episode) {
    'use strict'
    var i, entries

    entries = document.querySelectorAll('#playlist .entries li, #episodes .entries li')
    for (i = 0; i < entries.length; i++) {
      if ($(entries[i]).data('episodeUri') === episode.uri) {
        return entries[i]
      }
    }
  },
  eventHandler: {
    downloadEpisodeFile: function (event) {
      'use strict'
      var episodeUI = $(event.target).closest('li')

      event.preventDefault()
      event.stopPropagation()
      if (event.target.getAttribute('aria-disabled') !== 'true') {
        event.target.setAttribute('aria-disabled', 'true')
        // TODO replace Download-Link with cancel-Button while download isn't finished

        // load data of episode from storage...
        POD.storage.readEpisode(episodeUI.data('episodeUri'), function (episode) {
          UI.logHandler('Downloading file "' + episode.mediaUrl + '" starts now.', 'info')
          // ... then download file to storage...
          POD.web.downloadFile(episode, function (episode) {
            // ... and update UI
            episodeUI.replaceWith(UI.renderEpisode(episode))
          }, UI.progressHandler)
        })
      } else {
        UI.logHandler('Download is allways in progress', 'debug')
      }
    },

    refreshAllSources: function (event) {
      'use strict'
      var button = event.target
      let onProgressCallback = function (total, progress) {
        // actualise the progress in the button
        let percentCompleted = (100 / total * (total - progress)).toFixed(2) + '%'
        button.style.background = 'linear-gradient(to right, rgba(0, 100, 0, 0.2) 0%, rgba(0, 100, 0, 0.2) ' + percentCompleted + ', #ffffff ' + percentCompleted + ')'
      }
      let onFinishedCallback = function () {
        button.removeAttribute('disabled')
        button.classList.remove('spinner')
        button.style.removeProperty('background')
      }

      event.preventDefault()
      event.stopPropagation()

      button.setAttribute('disabled', 'disabled')
      button.classList.add('spinner')

      POD.web.downloadAllSources(null, onFinishedCallback, onProgressCallback)
    },

    refreshAllSources_widthWorker: function (event) {
      'use strict'
      event.preventDefault()
      event.stopPropagation()

      var button
      button = this

      $(button).attr('disabled', 'disabled')
      $(button).addClass('spinner')

      POD.logger('Playlist will be refreshed', 'debug')

      POD.storage.readSources(function (sources) {
        var worker = new Worker('scripts/worker/actualisePlaylist.js')
        worker.addEventListener('message', function (event) {
          if (event.data.cmd === 'log') {
            POD.logger(event.data.parameter.message, event.data.parameter.level)
          } else if (event.data.cmd === 'exit') {
            POD.logger(event.data.parameter.message, 'info')
          } else {
            console.log('Worker said: ', event.data)
          }
        }, false)
        worker.addEventListener('error', function (event) {
          POD.logger(event.message + '[' + event.filename + ':' + event.lineno + ']', 'error')
        }, false)

        worker.postMessage({ // Start Worker.
          cmd: 'start',
          parameter: {
            sources: sources,
            settings: {
              proxyUrl: HTML5Podcatcher.api.configuration.proxyUrlPattern
            }
          }
        })
      })
    }
  }
}
var UI = GlobalUserInterfaceHelper
POD.api.configuration.logger = UI.logHandler
POD.storage = POD.api.storage.StorageProvider

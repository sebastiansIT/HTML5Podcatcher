/*  Copyright 2014, 2015 Sebastian Spautz

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
/*global window, navigator, document */
/*global console */
/*global confirm */
/*global applicationCache */
/*global localStorage */
/*global $ */
/*global HTML5Podcatcher, POD */
var GlobalUserInterfaceHelper = {
    formatTimeCode: function (timecode) {
        "use strict";
        //Validate Parameter to be a number
        if (isNaN(+timecode)) {
            throw new TypeError("Timecode needs to be a positiv integer");
        }
        //Validate Parameter to be a positiv number
        if (timecode < 0) {
            throw new RangeError("Timecode needs to be a positiv integer");
        }
        var hours, minutes, seconds;
        hours = Math.floor(timecode / 3600);
        minutes = Math.floor((timecode % 3600) / 60);
        seconds = timecode % 60;
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
        return hours + ':' + minutes + ':' + seconds;
    },
    escapeHtml: function (text) {
        "use strict";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    logHandler: function (message, logLevelName) {
        "use strict";
        var allowedLevel, messageNode, logEntryNode, logLevel = 0;
        if (logLevelName && logLevelName.indexOf(":") >= 0) {
            logLevelName = logLevelName.substring(0, logLevelName.indexOf(":"));
        }
        switch (logLevelName) {
        case "debug":
            logLevel = 1;
            console.debug(message);
            break;
        case "info":
            logLevel = 2;
            console.info(message);
            break;
        case "warn":
            logLevel = 3;
            console.warn(message);
            break;
        case "error":
            logLevel = 4;
            console.error(message);
            break;
        case "fatal":
            logLevel = 5;
            console.error(message);
            $('#logView').addClass("fullscreen");
            break;
        default:
            console.log(logLevel + ': ' + message);
        }
        logEntryNode = document.createElement("p");
        allowedLevel = GlobalUserInterfaceHelper.settings.get("logLevel") || 0;
        if (logLevel >= allowedLevel) {
            logEntryNode.className = logLevelName;
            logEntryNode.appendChild(document.createTextNode(message));
            if (document.getElementById('log')) {
                document.getElementById('log').insertBefore(logEntryNode, document.getElementById('log').firstChild);
            }
            if (document.getElementById('activeMessage') && logLevel >= 3) {
                messageNode = document.getElementById('activeMessage');
                while (messageNode.hasChildNodes()) {
                    messageNode.removeChild(messageNode.lastChild);
                }
                messageNode.appendChild(logEntryNode.cloneNode(true));
            }
        }
    },
    errorHandler: function (event) {
        "use strict";
        var eventstring = event.toString() + ' {';
        $.each(event, function (i, n) {
            eventstring += i + ': "' + n + '"; ';
        });
        eventstring += '}';
        this.logHandler(this.escapeHtml(eventstring), 'error');
    },
    successHandler: function (event) {
        "use strict";
        this.logHandler(event, 'info');
    },
    progressHandler: function (progressEvent, prefix, episode) {
        "use strict";
        var percentComplete, episodeUI; //progressbar, 
        episodeUI = GlobalUserInterfaceHelper.findEpisodeUI(episode);
        $(episodeUI).find('.downloadFile').attr('disabled', 'disabled');
        if (progressEvent.lengthComputable) {
            //Downloaded Bytes / (total Bytes + 10% for saving on local system)
            percentComplete = progressEvent.loaded / (progressEvent.total + (progressEvent.total / 10));
            console.log(prefix + ': ' + (percentComplete * 100).toFixed(2) + '%');
            $(episodeUI).data('progress', percentComplete);
            $(episodeUI).attr('style', 'background: linear-gradient(to right, rgba(0, 100, 0, 0.2) 0%,rgba(0, 100, 0, 0.2) ' + (percentComplete * 100).toFixed(2) + '%, #ffffff ' + (percentComplete * 100).toFixed(2) + '%);');
        } else {
            console.log(prefix + '...');
        }
    },
    preConditionCheck: function (actionCallback) {
        "use strict";
        var appInfoRequest, proxyNeededCheck, feedExistingCheck;
        feedExistingCheck = function () {
            //Checks if some feeds exists in storage
            HTML5Podcatcher.storage.readSources(function (sources) {
                if (sources.length < 1) {
                    actionCallback('missing sources');
                } else {
                    actionCallback('OK');
                }
            });
        };
        proxyNeededCheck = function () {
            //Checks if Proxy is needed (Permission for System XHR is not set and proxy url is not set in configuration)
            if (window.navigator.mozApps) { //is an Open Web App runtime 
                appInfoRequest = window.navigator.mozApps.getSelf();
                appInfoRequest.onsuccess = function () {
                    if (appInfoRequest.result) { //checks for installed app
                        HTML5Podcatcher.logger(appInfoRequest.result.manifest.name + " is a " + appInfoRequest.result.manifest.type + " app.", 'debug');
                        if (appInfoRequest.result.manifest.type === 'privileged' || appInfoRequest.result.manifest.type === 'certified') {
                            HTML5Podcatcher.logger('App is allowed to post System XHR requests.', 'debug');
                            feedExistingCheck();
                        } else {
                            if (!GlobalUserInterfaceHelper.settings.get("proxyUrl") || GlobalUserInterfaceHelper.settings.get("proxyUrl").length < 11) {
                                actionCallback('missing proxy');
                            } else {
                                feedExistingCheck();
                            }
                        }
                    } else { //checks for app opend in browser 
                        HTML5Podcatcher.logger("This Webapp isn't installed as an Mozilla Open Web App but you can install it from Firefox Marketplace.", 'debug');
                        if (!GlobalUserInterfaceHelper.settings.get("proxyUrl") || GlobalUserInterfaceHelper.settings.get("proxyUrl").length < 11) {
                            actionCallback('missing proxy');
                        } else {
                            feedExistingCheck();
                        }
                    }
                };
            } else { //is a runtime without support for Open Web Apps
                HTML5Podcatcher.logger("This Webapp isn't installed as an Open Web App.", 'debug');
                if (!GlobalUserInterfaceHelper.settings.get("proxyUrl") || GlobalUserInterfaceHelper.settings.get("proxyUrl").length < 11) {
                    actionCallback("missing proxy");
                } else {
                    feedExistingCheck();
                }
            }
        };
        proxyNeededCheck();
    },
    settings: {
        set: function (key, value) {
            "use strict";
            localStorage.setItem('settings.' + key, value);
        },
        get: function (key) {
            "use strict";
            try {
                return localStorage.getItem('settings.' + key);
            } catch (exception) {
                if (exception.code === 18) {
                    GlobalUserInterfaceHelper.logHandler("Please activate Cookies in your Browser settings! [" + exception.name + ': ' + exception.message + ']', 'fatal');
                } else {
                    GlobalUserInterfaceHelper.logHandler(exception, 'error');
                }
            }
        }
    },
    initApplicationCacheEvents: function () {
        "use strict";
        function statusName(statusNumber) {
            var appCache = window.applicationCache;
            switch (statusNumber) {
            case appCache.UNCACHED: // UNCACHED == 0
                return 'UNCACHED';
            case appCache.IDLE: // IDLE == 1
                return 'IDLE';
            case appCache.CHECKING: // CHECKING == 2
                return 'CHECKING';
            case appCache.DOWNLOADING: // DOWNLOADING == 3
                return 'DOWNLOADING';
            case appCache.UPDATEREADY:  // UPDATEREADY == 4
                return 'UPDATEREADY';
            case appCache.OBSOLETE: // OBSOLETE == 5
                return 'OBSOLETE';
            default:
                return 'UKNOWN CACHE STATUS';
            }
        }
        $(applicationCache).on('checking', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache checks for updates (Cache status: " + statusName(applicationCache.status) + ")", 'debug:AppCache');
        });
        $(applicationCache).on('noupdate', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache founds no update (Cache status: " + statusName(applicationCache.status) + ")", 'debug:AppCache');
        });
        $(applicationCache).on('downloading', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache download updated files (Cache status: " + statusName(applicationCache.status) + ")", 'debug:AppCache');
        });
        $(applicationCache).on('progress', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache downloading files (Cache status: " + statusName(applicationCache.status) + ")", 'debug:AppCache');
        });
        $(applicationCache).on('cached', function () {
            GlobalUserInterfaceHelper.logHandler("Application cached (Cache status: " + statusName(applicationCache.status) + ")", 'debug:AppCache');
        });
        $(applicationCache).on('updateready', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache is updated (Cache status: " + statusName(applicationCache.status) + ")", 'info');
            applicationCache.swapCache();
            if (confirm("An update of HTML5 Podcatcher is available. Do you want to reload now?")) {
                window.location.reload();
            }
        });
        $(applicationCache).on('obsolete', function () {
            GlobalUserInterfaceHelper.logHandler("Application cache is corrupted and will be deletet (Cache status: " + statusName(applicationCache.status) + ")", 'error');
        });
        $(applicationCache).on('error', function () {
            if (applicationCache.status !== 1) {
                GlobalUserInterfaceHelper.logHandler("Error downloading manifest or resources (Cache status: " + statusName(applicationCache.status) + ")", 'error');
            } else {
                GlobalUserInterfaceHelper.logHandler("Can't download manifest or resources because app is offline (Cache status: " + statusName(applicationCache.status) + ")", 'debug:AppCache');
            }
        });
    },
    initConnectionStateEvents: function () {
        "use strict";
        window.addEventListener('online',  function () {
            GlobalUserInterfaceHelper.logHandler("Online now", 'info');
            $('.onlineOnly').removeAttr('disabled');
            $('.onlineOnly, a.external').removeAttr('aria-disabled');
        }, false);
        window.addEventListener('offline', function () {
            GlobalUserInterfaceHelper.logHandler("Offline now", 'info');
            $('.onlineOnly').attr('disabled', 'disabled');
            $('.onlineOnly, a.external').attr('aria-disabled', 'true');
        }, false);
    },
    initGeneralUIEvents: function () {
        "use strict";
        $('#showLogView, #logView .closeDialog').on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            $('#logView').toggleClass('fullscreen');
        });
        $('#appClose').on('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            window.open('', '_parent', '');
            window.close();
        });
    },
    renderEpisode: function (episode) {
        "use strict";
        var entryUI;
        entryUI = $($('#episodeTemplate li')[0].cloneNode(true));
        entryUI.data('episodeUri', episode.uri);
        entryUI.find('a.link').attr('href', episode.uri);
        entryUI.find('.title').text(episode.title);
        entryUI.find('.source').text(episode.source);
        if (episode.playback.played) {
            entryUI.find('.updated').attr('datetime', episode.updated.toISOString()).text(episode.updated.toLocaleDateString() + " " + episode.updated.toLocaleTimeString());
        } else {
            entryUI.find('.updated').attr('datetime', episode.updated.toISOString()).text("New");
        }
        entryUI.find('a.origin').attr('href', episode.uri);
        if (POD.storage.isFileStorageAvailable() && episode.mediaUrl) {
            if (episode.isFileSavedOffline) {
                entryUI.find('.downloadFile').replaceWith('<button class="delete" href="' + episode.mediaUrl + '" data-icon="delete">Delete</button>');
            } else if (episode.mediaUrl) {
                entryUI.addClass('onlineOnly');
                entryUI.find('.downloadFile').attr('href', episode.mediaUrl).attr('download', episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf('/') + 1));
            }
        } else {
            entryUI.addClass('news');
            entryUI.find('.downloadFile').remove();
        }
        //deactivate online-only-functions when offline
        if (!navigator.onLine) {
            entryUI.attr('aria-disabled', 'true');
            entryUI.find('.onlineOnly, a.external').attr('aria-disabled', 'true');
        }
        return entryUI;
    },
    renderEpisodeList: function (episodes) {
        "use strict";
        var listUI, entryUI, i;
        listUI = $('#playlist .entries, #episodes .entries');
        listUI.empty();
        if (episodes && episodes.length > 0) {
            for (i = 0; i < episodes.length; i++) {
                entryUI = GlobalUserInterfaceHelper.renderEpisode(episodes[i]);
                listUI.append(entryUI);
            }
        } else {
            entryUI = $('<li class="emptyPlaceholder">no entries</li>');
            listUI.append(entryUI);
        }
    },
    renderSource: function (source) {
        "use strict";
        var entryUI;
        entryUI = $($('#sourceTemplate > *')[0].cloneNode(true));
        entryUI.find('a.details').attr('href', 'source.html?uri=' + source.uri);
        entryUI.find('a.details').attr('title', 'Details for ' + source.title);
        entryUI.data('sourceUri', source.uri);
        entryUI.find('.title').text(source.title);
        entryUI.find('a.uri').attr('href', source.uri);
        entryUI.find('span.uri').text(source.uri);
        entryUI.find('.link').attr('href', source.link);
        entryUI.find('.description').text(source.description);
        entryUI.find('.update').attr('href', source.uri);
        if (source.img && source.img.uri) {
            entryUI.find('.image').attr('src', source.img.uri);
        } else {
            entryUI.find('.image').remove();
        }
        if (source.license) {
            entryUI.find('.license').text(source.license);
        } else {
            entryUI.find('.license').text("All rights reserved or no information");
        }
        //deactivate online-only-functions when offline
        if (!navigator.onLine) {
            entryUI.find('.onlineOnly, a.external').attr('aria-disabled', 'true');
        }
        return entryUI;
    },
    renderSourceList: function (sourcelist) {
        "use strict";
        var sourcelistUI, entryUI, i;
        sourcelistUI = $('#sourceslist .entries');
        sourcelistUI.empty();
        if (sourcelist && sourcelist.length > 0) {
            for (i = 0; i < sourcelist.length; i++) {
                entryUI = this.renderSource(sourcelist[i]);
                sourcelistUI.append(entryUI);
            }
        } else {
            entryUI = $('<li class="emptyPlaceholder">no entries</li>');
            sourcelistUI.append(entryUI);
        }
    },
    findEpisodeUI: function (episode) {
        "use strict";
        var episodeUI;
        $('#playlist .entries li, #episodes .entries li').each(function () {
            if ($(this).data('episodeUri') === episode.uri) {
                episodeUI = this;
                return false;
            }
        });
        return episodeUI;
    },
    eventHandler: {
        refreshAllSources: function (event) {
            "use strict";
            event.preventDefault();
            event.stopPropagation();
            var i, button;
            button = this;
            $(this).attr('disabled', 'disabled');
            $(this).addClass('spinner');
            POD.settings.uiLogger("Playlist will be refreshed", "debug");
            POD.storage.readSources(function (sources) {
                var amount, progressListener;
                amount = sources.length;
                progressListener = function (event) {
                    event.stopPropagation();
                    amount--;
                    if (amount === 0) {
                        POD.settings.uiLogger("All Feeds have been refreshed", "info");
                        $(button).removeAttr('disabled');
                        $(button).removeClass('spinner');
                        document.removeEventListener('writeSource', progressListener, false);
                    }
                };
                document.addEventListener('writeSource', progressListener, false);
                for (i = 0; i < sources.length; i++) {
                    POD.web.downloadSource(sources[i]);
                }
            });
        }
    }
};
var UI = GlobalUserInterfaceHelper;
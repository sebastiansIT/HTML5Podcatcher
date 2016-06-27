/*  Copyright 2013-2015 Sebastian Spautz

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

/*global navigator */
/*global window */
/*global document */
/*global console */
/*global CustomEvent */
/*global XMLHttpRequest */
/*global Blob */
/*global localStorage */

var HTML5Podcatcher = {
    version: "Alpha {{ VERSION }}",
    api: {},
    web: {
        settings: {
            downloadTimeout: 600000,
            proxyUrlPattern: undefined
        },

        /** Updates a source from its feed.
          * @param {Source} source  Source to update.
          * @param {number} [limitOfNewEpisodes=5] Maximal amount of episodes imported as 'new'.
          * @param {function} [onFinishedCallback] Function called when download of Source is completed.
          */
        downloadSource: function (source, limitOfNewEpisodes, onFinishedCallback) {
            "use strict";
            
            limitOfNewEpisodes = limitOfNewEpisodes || 5;
            
            // start update of the source
            HTML5Podcatcher.api.web.downloadXML(
                source.uri, 
                function (xmlDocument) {
                    var parserResult, 
                        mergeNewEpisodeDataWithOldPlaybackStatus;

                    mergeNewEpisodeDataWithOldPlaybackStatus = function (mergeEpisode, forcePlayed) {
                        HTML5Podcatcher.api.storage.StorageProvider.readEpisode(mergeEpisode.uri, function (existingEpisode) {
                            existingEpisode.link = mergeEpisode.link;
                            existingEpisode.title = mergeEpisode.title;
                            existingEpisode.updated = mergeEpisode.updated;
                            existingEpisode.mediaUrl = mergeEpisode.mediaUrl;
                            existingEpisode.mediaType = mergeEpisode.mediaType;
                            existingEpisode.source = mergeEpisode.source;
                            existingEpisode.jumppoints = mergeEpisode.jumppoints;
                            //ATTENTION! never change playback information if episode updated from internet
                            //Only Exception: If the forcedPlayed parameter is set - then the actual playback state is overriden
                            if (forcePlayed && existingEpisode.playback.played === undefined) {
                                existingEpisode.playback.played = true;
                            }
                            HTML5Podcatcher.api.storage.StorageProvider.writeEpisode(existingEpisode);
                        });
                    };

                    HTML5Podcatcher.logger('Downloaded source feed from ' + source.uri, 'debug');
                    try {
                        parserResult = HTML5Podcatcher.api.parser.SourceParser.parse(source, xmlDocument);
                        HTML5Podcatcher.logger('Parsed source feed from ' + source.uri, 'debug');
                        
                        // compute parser result:
                        // merge existing data with actual one and save episodes with actualised data
                        parserResult.episodes.forEach(function (episode, index, episodes) {
                            mergeNewEpisodeDataWithOldPlaybackStatus(episode, index < episodes.length - limitOfNewEpisodes);
                        });
                        // Save Source
                        HTML5Podcatcher.api.storage.StorageProvider.writeSource(parserResult.source, function () {
                            if (onFinishedCallback && typeof onFinishedCallback === 'function') {
                                onFinishedCallback({status: 'success'});
                            }
                        });
                    } catch (exception) {
                        HTML5Podcatcher.logger('An excpeption ocurred while parsing source ' + source.uri, 'fatal')
                        console.error(exception);
                        if (onFinishedCallback && typeof onFinishedCallback === 'function') {
                            onFinishedCallback({status: 'failure'});
                        }
                    }
                },
                function () {
                    onFinishedCallback({status: 'failure'});
                }
            );
        },

        downloadFile: function (episode, mimeType, onDownloadCallback, onProgressCallback) {
            "use strict";

            //Download File
            HTML5Podcatcher.api.web.downloadArrayBuffer(
                episode.mediaUrl,
                function (arrayBuffer) {
                    HTML5Podcatcher.storage.saveFile(episode, arrayBuffer, mimeType, onDownloadCallback, onProgressCallback);
                },
                function (event/*, url*/) {
                    if (onProgressCallback && typeof onProgressCallback === 'function') {
                        onProgressCallback(event, episode);
                    }
                }
            );
        }
    },

    system: {
        isOpenWebAppContainer: function (onCompletedCallback) {
            "use strict";
            var appInfoRequest;
            //Detection of installed open web apps
            //see https://developer.mozilla.org/en-US/Apps/Build/App_development_FAQ#How_can_I_detect_whether_an_app_is_privileged_or_certified.3F
            if (window.navigator.mozApps) {
                appInfoRequest = window.navigator.mozApps.getSelf();
                appInfoRequest.onsuccess = function () {
                    if (appInfoRequest.result) {
                        HTML5Podcatcher.logger(appInfoRequest.result.manifest.name + " is a " + appInfoRequest.result.manifest.type + " app.", 'debug:system');
                        onCompletedCallback(true, appInfoRequest.result.manifest.type);
                    } else {
                        HTML5Podcatcher.logger("This Webapp is run in a Bozilla Browser but isn't installed as open web app.", 'debug:system');
                        onCompletedCallback(false);
                    }
                };
            } else {
                HTML5Podcatcher.logger("This Webapp isn't run in a Open-Web-App-Container.", 'debug:system');
                onCompletedCallback(false);
            }
        }
    },
    toggleEpisodeStatus: function (episode) {
        "use strict";
        episode.playback.played = !episode.playback.played;
        episode.playback.currentTime = 0;
        HTML5Podcatcher.storage.deleteFile(episode);
        HTML5Podcatcher.storage.writeEpisode(episode);
    },
    sortEpisodes: function (firstEpisode, secondEpisode) {
        "use strict";
        if (firstEpisode.updated < secondEpisode.updated) {
            return -1;
        }
        if (firstEpisode.updated > secondEpisode.updated) {
            return 1;
        }
        return 0;
    },
    logger: function (message, level) {
        "use strict";
        if (HTML5Podcatcher.api.configuration.logger && typeof HTML5Podcatcher.api.configuration.logger === 'function') {
            HTML5Podcatcher.api.configuration.logger(message, level);
        } else {
            switch (level) {
            case "debug":
                console.debug(message);
                break;
            case "info":
                console.info(message);
                break;
            case "note":
                console.info(message);
                break;
            case "warn":
                console.warn(message);
                break;
            case "error":
                console.error(message);
                break;
            default:
                console.log(level + ': ' + message);
            }
        }
    },
    errorLogger: function (message) {
        "use strict";
        HTML5Podcatcher.logger(message, 'error');
    }
};
var POD = HTML5Podcatcher;
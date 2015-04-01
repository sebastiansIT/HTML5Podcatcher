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
    settings: {
        uiLogger: undefined
    },
    storage: {
        //Public Storage Interface
        cleanStorage: function (onDeleteCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().cleanStorage(onDeleteCallback);
            }
        },
        //Source Storage
        readSource: function (sourceUri, onReadCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().readSource(sourceUri, onReadCallback);
            }
        },
        readSources: function (onReadCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().readSources(onReadCallback);
            }
        },
        writeSource: function (source, onWriteCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().writeSource(source, function (source) {
                    if (onWriteCallback && typeof onWriteCallback === 'function') {
                        onWriteCallback(source);
                    }
                    document.dispatchEvent(new CustomEvent('writeSource', {"detail": {'source': source}}));
                });
            }
        },
        writeSources: function (sources, onWriteCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().writeSources(sources, function (sources) {
                    if (onWriteCallback && typeof onWriteCallback === 'function') {
                        onWriteCallback(sources);
                    }
                    document.dispatchEvent(new CustomEvent('writeSources', {"detail": {'sources': sources}}));
                });
            }
        },
        deleteSource: function (source, onDeleteCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().deleteSource(source, onDeleteCallback);
            }
        },
        //Episode Storage
        readEpisode: function (episodeUri, onReadCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().readEpisode(episodeUri, onReadCallback);
            }
        },
        readPlaylist: function (showAll, onReadCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().readPlaylist(showAll, onReadCallback);
            }
        },
        readEpisodesBySource: function (source, onReadCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().readEpisodesBySource(source, onReadCallback);
            }
        },
        writeEpisode: function (episode, onWriteCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().writeEpisode(episode, function (episode) {
                    if (onWriteCallback && typeof onWriteCallback === 'function') {
                        onWriteCallback(episode);
                    }
                    document.dispatchEvent(new CustomEvent('writeEpisode', {"detail": {'episode': episode}}));
                });
            }
        },
        writeEpisodes: function (episodes, onWriteCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().writeEpisodes(episodes, function (episodes) {
                    if (onWriteCallback && typeof onWriteCallback === 'function') {
                        onWriteCallback(episodes);
                    }
                    document.dispatchEvent(new CustomEvent('writeEpisodes', {"detail": {'episodes': episodes}}));
                });
            }
        },
        //File Storage
        openFile: function (episode, onReadCallback) {
            "use strict";
            if (episode.isFileSavedOffline) {
                if (this.fileStorageEngine()) {
                    this.fileStorageEngine().openFile(episode, onReadCallback);
                }
            } else {
                if (onReadCallback && typeof onReadCallback === 'function') {
                    onReadCallback(episode);
                }
            }
        },
        saveFile: function (episode, arraybuffer, mimeType, onWriteCallback, onProgressCallback) {
            "use strict";
            if (this.fileStorageEngine()) {
                this.fileStorageEngine().saveFile(episode, arraybuffer, mimeType, onWriteCallback, onProgressCallback);
            }
        },
        deleteFile: function (episode, onDeleteCallback) {
            "use strict";
            if (this.fileStorageEngine()) {
                this.fileStorageEngine().deleteFile(episode, onDeleteCallback);
            }
        },
        //Storage Engine Selection
        dataStorageEngine: function () {
            "use strict";
            var engine;
            if (window.indexedDB) {
                engine = this.indexedDbStorage;
            } else if (window.localStorage) {
                engine = this.webStorage;
            } else {
                HTML5Podcatcher.logger("Missing persistent data storage", "error");
            }
            return engine;
        },
        fileStorageEngine: function () {
            "use strict";
            var engine;
            if (window.requestFileSystem) {
                engine = this.fileSystemStorage;
            } else if (window.indexedDB) {
                engine = this.indexedDbStorage;
            } else {
                HTML5Podcatcher.logger("Missing persistent file storage", "error");
            }
            return engine;
        },
        isFileStorageAvailable: function () {
            "use strict";
            var returnvalue = false;
            if (this.fileStorageEngine()) {
                returnvalue = true;
            }
            return returnvalue;
        },
        //Migration betwean storage engines
        migradeData: function (oldStorageEngine, newStorageEngine) {
            "use strict";
            oldStorageEngine.readSources(function (sourcesList) {
                var i;
                for (i = 0; i < sourcesList.length; i++) {
                    newStorageEngine.writeSource(sourcesList[i], HTML5Podcatcher.web.downloadSource);
                    oldStorageEngine.deleteSource(sourcesList[i]);
                }
            });
            newStorageEngine.readPlaylist(false, function (episodeList) {
                var i;
                for (i = 0; i < episodeList.length; i++) {
                    episodeList[i].playback.played = true;
                    newStorageEngine.writeEpisode(episodeList[i]);
                }
            });
            oldStorageEngine.readPlaylist(false, function (episodeList) {
                var i;
                for (i = 0; i < episodeList.length; i++) {
                    newStorageEngine.writeEpisode(episodeList[i]);
                }
            });
        }
    },
    web: {
        settings: {
            downloadTimeout: 600000,
            proxyUrlPattern: undefined
        },
        createXMLHttpRequest: function (completed) {
            "use strict";
            var ajaxRequest, appInfoRequest;
            //Detection of installed open web apps 
            //see https://developer.mozilla.org/en-US/Apps/Build/App_development_FAQ#How_can_I_detect_whether_an_app_is_privileged_or_certified.3F
            if (window.navigator.mozApps) {
                appInfoRequest = window.navigator.mozApps.getSelf();
                appInfoRequest.onsuccess = function () {
                    if (appInfoRequest.result) {
                        HTML5Podcatcher.logger(appInfoRequest.result.manifest.name + " is a " + appInfoRequest.result.manifest.type + " app.", 'debug');
                        if (appInfoRequest.result.manifest.type === 'privileged' || appInfoRequest.result.manifest.type === 'certified') {
                            ajaxRequest = new XMLHttpRequest({ mozSystem: true });
                        } else {
                            ajaxRequest = new XMLHttpRequest();
                        }
                    } else {
                        HTML5Podcatcher.logger("This Webapp isn't installed", 'debug');
                        ajaxRequest = new XMLHttpRequest();
                    }
                    completed(ajaxRequest);
                };
            } else {
                HTML5Podcatcher.logger("This Webapp isn't run in a Open-Web-App-Container.", 'debug');
                ajaxRequest = new XMLHttpRequest();
                completed(ajaxRequest);
            }
        },
        downloadSource: function (source, limitOfNewEpisodes) {
            "use strict";
            var successfunction, errorfunction, parserresult;
            if (!limitOfNewEpisodes) {
                limitOfNewEpisodes = 5;
            }
            parserresult = {'source': source, 'episodes': []};
            successfunction = function () {
                var data, /*newestEpisodes,*/ mergeFunction, i;
                HTML5Podcatcher.logger('Download of source "' + source.uri + '" is finished', 'debug');
                data = this.responseXML;
                mergeFunction = function (mergeEpisode, forcePlayed) {
                    HTML5Podcatcher.storage.readEpisode(mergeEpisode.uri, function (existingEpisode) {
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
                        HTML5Podcatcher.storage.writeEpisode(existingEpisode);
                    });
                };
                //Call XML-Parser
                if (!data) {
                    HTML5Podcatcher.logger('No XML Document found instead found [' + this.response + "]", 'error');
                } else {
                    parserresult = HTML5Podcatcher.parser.parseSource(data, source);
                    //compute parser result
                    // 1. merge existing data with actual one
                    // TODO writing a multi episode write method
                    // 2. filter top 5 episodes and check if unread
                    //newestEpisodes = parserresult.episodes.slice(parserresult.episodes.length - 5, parserresult.episodes.length);
                    // 3. save top 5 episodes with actualised data
                    for (i = 0; i < parserresult.episodes.length; i++) {
                        if (i < parserresult.episodes.length - limitOfNewEpisodes) {
                            mergeFunction(parserresult.episodes[i], true);
                        } else {
                            mergeFunction(parserresult.episodes[i], false);
                        }
                    }
                    // 4. Save Source
                    HTML5Podcatcher.storage.writeSource(source);
                }
            };
            errorfunction = function (xhrError) {
                if (HTML5Podcatcher.web.settings.proxyUrlPattern) {
                    HTML5Podcatcher.logger('Direct download failed. Try proxy: ' + HTML5Podcatcher.web.settings.proxyUrlPattern.replace("$url$", source.uri), 'warning');
                    HTML5Podcatcher.web.createXMLHttpRequest(function (proxyXhr) {
                        proxyXhr.open('GET', HTML5Podcatcher.web.settings.proxyUrlPattern.replace("$url$", source.uri), true);
                        proxyXhr.addEventListener("error", function (xhrError) {
                            HTML5Podcatcher.logger("Can't download Source: " + xhrError.error);
                        });
                        proxyXhr.addEventListener("abort", HTML5Podcatcher.logger, false);
                        proxyXhr.onload = successfunction;
                        proxyXhr.ontimeout = function () {
                            HTML5Podcatcher.logger("Timeout after " + (proxyXhr.timeout / 60000) + " minutes.", "error");
                        };
                        proxyXhr.send();
                    });
                } else {
                    HTML5Podcatcher.logger("Can't download Source: " + xhrError.error);
                }
            };
            //Load Feed and Parse Entries
            try {
                HTML5Podcatcher.web.createXMLHttpRequest(function (xhr) {
                    xhr.open('GET', source.uri, true);
                    xhr.addEventListener("error", errorfunction);
                    xhr.addEventListener("abort", HTML5Podcatcher.logger, false);
                    xhr.onload = successfunction;
                    xhr.ontimeout = function () {
                        HTML5Podcatcher.logger("Timeout after " + (xhr.timeout / 60000) + " minutes.", "error");
                    };
                    xhr.send();
                });
            } catch (ex) {
                HTML5Podcatcher.logger(ex, 'error');
            }
        },
        downloadFile: function (episode, mimeType, onDownloadCallback, onProgressCallback) {
            "use strict";
            var successfunction, errorfunction, xhr;
            successfunction = function () {
                if (this.status === 200) {
                    HTML5Podcatcher.logger('Download of file "' + episode.mediaUrl + '" is finished', 'debug');
                    HTML5Podcatcher.storage.saveFile(episode, xhr.response, mimeType, onDownloadCallback, onProgressCallback);
                } else {
                    HTML5Podcatcher.logger('Error Downloading file "' + episode.mediaUrl + '": ' + this.statusText + ' (' + this.status + ')', 'error');
                }
            };
            errorfunction = function (xhrError) {
                if (HTML5Podcatcher.web.settings.proxyUrlPattern) {
                    HTML5Podcatcher.logger('Direct download failed. Try proxy: ' + HTML5Podcatcher.web.settings.proxyUrlPattern.replace("$url$", episode.mediaUrl), 'warning');
                    HTML5Podcatcher.web.createXMLHttpRequest(function (xhrProxy) {
                        xhrProxy.open('GET', HTML5Podcatcher.web.settings.proxyUrlPattern.replace("$url$", episode.mediaUrl), true);
                        xhrProxy.responseType = 'arraybuffer';
                        xhrProxy.timeout = HTML5Podcatcher.web.settings.downloadTimeout;
                        xhrProxy.addEventListener("progress", function (event) {
                            if (onProgressCallback && typeof onProgressCallback === 'function') {
                                onProgressCallback(event, 'Download', episode);
                            }
                        }, false);
                        xhrProxy.addEventListener("abort", HTML5Podcatcher.logger, false);
                        xhrProxy.addEventListener("error", HTML5Podcatcher.errorLogger, false);
                        xhrProxy.onload = function () {
                            if (this.status === 200) {
                                HTML5Podcatcher.logger('Download of file "' + episode.mediaUrl + '" via proxy is finished', 'debug');
                                HTML5Podcatcher.storage.saveFile(episode, xhrProxy.response, mimeType, onDownloadCallback);
                            } else {
                                HTML5Podcatcher.logger('Error Downloading file "' + episode.mediaUrl + '" via proxy: ' + this.statusText + ' (' + this.status + ')', 'error');
                            }
                        };
                        xhrProxy.ontimeout = function () {
                            HTML5Podcatcher.logger("Timeout after " + (xhrProxy.timeout / 60000) + " minutes.", "error");
                        };
                        xhrProxy.send(null);
                    });
                } else {
                    HTML5Podcatcher.logger("Can't download Source: " + xhrError.error);
                }
            };
            try {
                HTML5Podcatcher.web.createXMLHttpRequest(function (request) {
                    xhr = request;
                    xhr.open('GET', episode.mediaUrl, true);
                    xhr.responseType = 'arraybuffer';
                    //xhr.responseType = 'blob';
                    xhr.timeout = HTML5Podcatcher.web.settings.downloadTimeout;
                    xhr.addEventListener("progress", function (event) {
                        if (onProgressCallback && typeof onProgressCallback === 'function') {
                            onProgressCallback(event, 'Download', episode);
                        }
                    }, false);
                    xhr.addEventListener("abort", HTML5Podcatcher.logger, false);
                    xhr.addEventListener("error", errorfunction, false);
                    xhr.onload = successfunction;
                    xhr.ontimeout = function () {
                        HTML5Podcatcher.logger("Timeout after " + (xhr.timeout / 60000) + " minutes.", "error");
                    };
                    xhr.send(null);
                });
            } catch (ex) {
                HTML5Podcatcher.logger(ex, 'error');
            }
        }
    },
    parser: {
        parseSource: function (xml, source) {
            "use strict";
            var rootElement, currentElementList, currentElement, contentElement, itemArray, i, item, episode, episodes = [];
            HTML5Podcatcher.logger('Parsing source file "' + source.uri + '" starts now', 'debug');
            //RSS-Feed
            rootElement = xml.querySelector('rss[version="2.0"]');
            if (rootElement) {
                //RSS-Channel
                // * Actualise URI from atom link element with relation of "self"
                currentElementList = rootElement.querySelectorAll('channel > link'); //find all Link-Elements in the feed
                for (i = 0; i < currentElementList.length; i++) {
                    currentElement = currentElementList[i];
                    if (currentElement.namespaceURI === 'http://www.w3.org/2005/Atom' && currentElement.attributes.rel === 'self') {
                        source.uri = currentElement.href;
                        break;
                    }
                }
                // * Link to Website (<link> or <atom:link rel="self">)
                //   uses same list of elements (currentElementList) as the previous section
                for (i = 0; i < currentElementList.length; i++) {
                    currentElement = currentElementList[i];
                    if (!currentElement.namespaceURI) { //undefined Namespace is mostly the rss 'namespace' ;) 
                        source.link = currentElement.childNodes[0].nodeValue;
                        break;
                    }
                }
                //   set default: Website is equals to Feed-URI
                if (!source.link) {
                    source.link = source.uri;
                }
                // * Title (<title>)
                currentElement = rootElement.querySelector('channel > title');
                if (currentElement) {
                    source.title = currentElement.childNodes[0].nodeValue;
                } else {
                    source.title = source.link;
                }
                // * Description (<description>)
                currentElement = rootElement.querySelector('channel > description');
                if (currentElement && currentElement.childNodes.length > 0) {
                    source.description = currentElement.childNodes[0].nodeValue;
                } else {
                    source.description = '';
                }
                // * License (<copyright>)
                currentElement = rootElement.querySelector('channel > copyright');
                if (currentElement && currentElement.childNodes.length > 0) {
                    source.license = currentElement.childNodes[0].nodeValue;
                } else {
                    source.license = undefined;
                }
                //RSS-Entries
                itemArray = rootElement.querySelectorAll('channel > item');
                for (i = 0; i < itemArray.length; i++) {
                    item = itemArray[i];
                    episode = {};
                    episode.uri = item.querySelector('link, guid').childNodes[0].nodeValue;
                    episode.title = item.querySelector('title').childNodes[0].nodeValue;
                    if (/^\d/.test(item.querySelector('pubDate').childNodes[0].nodeValue)) {
                        episode.updated = new Date("Sun " + item.querySelector('pubDate').childNodes[0].nodeValue);
                    } else {
                        episode.updated = new Date(item.querySelector('pubDate').childNodes[0].nodeValue);
                    }
                    episode.source = source.title;
                    // use files linked with enclosure elements or ...
                    if (item.querySelector('enclosure') && (item.querySelector('enclosure').attributes.type.value.indexOf("audio") >= 0)) {
                        episode.mediaUrl = item.querySelector('enclosure').attributes.url.value;
                        episode.mediaType = item.querySelector('enclosure').attributes.type.value;
                    // ... or use anker tags in the full content markup of the item
                    } else if (item.querySelector('encoded') && item.querySelector('encoded').childNodes[0].nodeValue) {
                        contentElement = document.createElement("encoded");
                        contentElement.innerHTML = item.querySelector('encoded').childNodes[0].nodeValue;
                        if (contentElement.querySelector('a[href$=".mp3"]')) {
                            episode.mediaUrl = contentElement.querySelector('a[href$=".mp3"]').attributes.href.value;
                            episode.mediaType = 'audio/mpeg';
                        }
                    }
                    //Parse Podlove Simple Chapters Format
                    episode.jumppoints = HTML5Podcatcher.parser.parsePodloveSimpleChapters(item.getElementsByTagNameNS('http://podlove.org/simple-chapters', 'chapters'), episode);
                    episodes.push(episode);
                }
                episodes.sort(HTML5Podcatcher.sortEpisodes);
            } else {
                HTML5Podcatcher.logger('No root element (&lt;rss&gt;) found in parsed RSS response: ' + xml, 'error');
                return undefined;
            }
            HTML5Podcatcher.logger('Parsing source file "' + source.uri + '" finished (found ' + episodes.length + ' episodes for "' + source.title + '")', 'info');
            return {'source': source, 'episodes': episodes};
        },
        //See http://podlove.org/simple-chapters/
        parsePodloveSimpleChapters: function (node) {
            "use strict";
            var chapters, jumppoints = [], i;
            if (node && node.length > 0) {
                HTML5Podcatcher.logger('Found "Podlove Simple Chapters" in feed: ' + node, 'debug');
                chapters = node[0].getElementsByTagNameNS('http://podlove.org/simple-chapters', 'chapter');
                for (i = 0; i < chapters.length; i++) {
                    jumppoints.push({
                        type: 'chapter',
                        time: HTML5Podcatcher.parser.parseNormalPlayTime(chapters[i].attributes.start.value) / 1000,
                        title: chapters[i].attributes.title.value,
                        uri: chapters[i].attributes.href ? chapters[i].attributes.href.value : undefined,
                        image: chapters[i].attributes.image ? chapters[i].attributes.image.value : undefined
                    });
                }
            }
            return jumppoints;
            //321 < x < 5649
        },
        //See https://www.ietf.org/rfc/rfc2326.txt Chapter 3.6
        parseNormalPlayTime: function (normalPlayTime) {
            "use strict";
            var parts, milliseconds;
            parts = normalPlayTime.split(".");
            if (parts[1]) {
                milliseconds = parseFloat('0.' + parts[1]) * 1000;
            } else {
                milliseconds = 0;
            }
            parts = parts[0].split(":");
            if (parts.length === 3) {
                milliseconds = milliseconds + parseInt(parts[2], 10) * 1000;
                milliseconds = milliseconds + parseInt(parts[1], 10) * 60 * 1000;
                milliseconds = milliseconds + parseInt(parts[0], 10) * 60 * 60 * 1000;
            } else if (parts.length === 2) {
                milliseconds = milliseconds + parseInt(parts[1], 10) * 1000;
                milliseconds = milliseconds + parseInt(parts[0], 10) * 60 * 1000;
            } else if (parts.length === 1) {
                milliseconds = milliseconds + parseInt(parts[0], 10) * 1000;
            }
            return milliseconds;
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
        if (HTML5Podcatcher.settings.uiLogger && typeof HTML5Podcatcher.settings.uiLogger === 'function') {
            HTML5Podcatcher.settings.uiLogger(message, level);
        } else {
            switch (level) {
            case "debug":
                console.debug(message);
                break;
            case "info":
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
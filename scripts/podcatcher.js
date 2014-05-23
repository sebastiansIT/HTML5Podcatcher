/*  Copyright 2013, 2014 Sebastian Spautz

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
/*global alert */
/*global Blob */
/*global XMLHttpRequest */
/*global localStorage */
/*global applicationCache */
/*global $ */

// Take care of vendor prefixes.
window.URL = window.URL || window.webkitURL;
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
navigator.persistentStorage = navigator.persistentStorage || navigator.webkitPersistentStorage;

/** Global Variables/Objects */
var downloadTimeout = 600000;
var fileSystemSize = 1024 * 1024 * 500; /*500 MB */
var fileSystemStatus = window.PERSISTENT; //window.TEMPORARY;

/** User interface functions */
var findEpisodeUI = function(episode) {
    "use strict";
    var episodeUI;
    $('#playlist .entries li').each(function() {
        if ($(this).data('episodeUri') === episode.uri) {
            episodeUI = this;
            return false;
        }
    });
    return episodeUI;
};
var actualiseEpisodeUI = function(episode) {
    "use strict";
    var episodeUI;
    episodeUI = findEpisodeUI(episode);
    // Status
    if (episode.playback.played) {
        $(episodeUI).find('.status').text("Status: played");
    } else {
        $(episodeUI).find('.status').text("Status: new");
    }
    // Download/Delete link
    if (episode.offlineMediaUrl) {
        $(episodeUI).find('.download').replaceWith('<a class="delete" href="' + episode.offlineMediaUrl + '">Delete</a>');
    } else {
        $(episodeUI).find('.delete').replaceWith('<a class="download" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf()) + '">Download</a>');
    }
    $(episodeUI).find('progress').remove();
    return false;
};

/** Helper Functions */
var escapeHtml = function(text) {
    "use strict";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
var logHandler = function(message, loglevel) {
    "use strict";
    console.log(loglevel + ': ' + message);
    $('#statusbar').prepend('<span class=' + loglevel + '>' + message + '</span></br>');
};
var errorHandler = function(event) {
    "use strict";
    var eventstring = event.toString() + ' {';
    $.each(event, function(i, n) {
        eventstring += i + ': "' + n + '"; ';
    });
    eventstring += '}';
    logHandler(escapeHtml(eventstring), 'error');
};
var successHandler = function(event) {
    "use strict";
    logHandler(event, 'info');
};
var progressHandler = function(progressEvent, prefix, episode) {
    "use strict"; //xmlHttpRequestProgressEvent
    var progressbar, percentComplete, episodeUI;
    episodeUI = findEpisodeUI(episode);
    if ($(episodeUI).find('progress').length) {
        progressbar = $(episodeUI).find('progress');
    } else {
        progressbar = $('<progress min="0" max="1">&helip;</progress>');
        $(episodeUI).find('.download').hide().after(progressbar);
    }
    if (progressEvent.lengthComputable) {
        percentComplete = progressEvent.loaded / progressEvent.total;
        console.log(prefix + ': ' + (percentComplete * 100).toFixed(2) + '%');
        $(episodeUI).find('progress').attr('value', percentComplete).text((percentComplete * 100).toFixed(2) + '%');
    } else {
        console.log(prefix + '...');
        $(episodeUI).find('progress').removeAttr('value').text('&helip;');
    }
};
var requestFileSystemQuota = function(quota) {
    "use strict";
    if (navigator.persistentStorage) {
        navigator.persistentStorage.requestQuota(quota, function(grantedBytes) {
            logHandler('You gain access to ' + grantedBytes / 1024 / 1024 + ' MiB of memory', 'debug');
            navigator.persistentStorage.queryUsageAndQuota(function (usage, quota) {
                localStorage.setItem("configuration.quota", quota);
                var availableSpace = quota - usage;
                $('#memorySizeInput').val(quota / 1024 / 1024).attr('min', Math.ceil(usage / 1024 / 1024)).css('background', 'linear-gradient( 90deg, rgba(0,100,0,0.45) ' + Math.ceil((usage / quota) * 100) + '%, transparent ' + Math.ceil((usage / quota) * 100) + '%, transparent )');
                if (availableSpace <= (1024 * 1024 * 50)) {
                    logHandler('You are out of space! Please allow more then ' + Math.ceil(quota / 1024 / 1024) + ' MiB of space', 'warning');
                } else {
                    logHandler('There is ' + Math.floor(availableSpace / 1024 / 1024) + ' MiB of ' + Math.floor(quota / 1024 / 1024) + ' MiB memory available', 'info');
                }
            }, errorHandler);
        }, errorHandler);
    }
};

/** Functions for episodes */
var readEpisode = function(episodeUri) {
    "use strict";
    var episode;
    if (episodeUri) {
        //Read Episode from local DOM-Storage
        episode = JSON.parse(localStorage.getItem('episode.' + episodeUri));
        if (!episode) {
            episode = { 'uri': episodeUri };
        }
        //Convert "updated" to date object 
        episode.updated = new Date(episode.updated);
        //Generate "playback" object if not exists
        if (!episode.playback) {
            episode.playback = {'played': false, 'currentTime': 0};
        }
    }
    return episode;
};
var writeEpisode = function(episode) {
    "use strict";
    //logHandler('Saving Episode with timecode ' + episode.playback.currentTime, 'debug');
    localStorage.setItem('episode.' + episode.uri, JSON.stringify(episode));
    actualiseEpisodeUI(episode);
};
var sortEpisodes = function(firstEpisode, secondEpisode) {
    "use strict";
    if (firstEpisode.updated < secondEpisode.updated) {
        return -1;
    }
    if (firstEpisode.updated > secondEpisode.updated) {
        return 1;
    }
    return 0;
    //return secondEpisode.updated < firstEpisode.updated;
};
var toggleEpisodeStatus = function(episode) {
    "use strict";
    episode.playback.played = !episode.playback.played;
    episode.playback.currentTime = 0;
    POD.storage.deleteFile(episode);
    writeEpisode(episode);
};
var activeEpisode = function() {
    "use strict";
    var activeEpisode = $('#playlist').find('.activeEpisode');
    return readEpisode(activeEpisode.data('episodeUri'));
};
var previousEpisode = function() {
    "use strict";
    var activeEpisode = $('#playlist').find('.activeEpisode');
    return readEpisode(activeEpisode.prev().data('episodeUri'));
};
var nextEpisode = function() {
    "use strict";
    var activeEpisode = $('#playlist').find('.activeEpisode');
    return readEpisode(activeEpisode.next().data('episodeUri'));
};

/** Functions for Sources/Feeds */
var readSource = function(sourceUri) {
    "use strict";
    var source;
    source = JSON.parse(localStorage.getItem('source.' + sourceUri));
    if (!source) {
        source = { 'uri': sourceUri };
    }
    return source;
};
var writeSource = function(source) {
    "use strict";
    localStorage.setItem('source.' + source.uri, JSON.stringify(source));
};
var deleteSource = function(source) {
    "use strict";
    localStorage.removeItem('source.' + source.uri);
};
var parseSource = function(xml, source) {
    "use strict";
    var episode, tracks = [];
    logHandler('Parsing source file "' + source.uri + '" starts now', 'debug');
    //RSS-Feed
    if ($(xml).has('rss[version="2.0"]')) {
        //RSS-Channel
        source.link = $(xml).find('channel > link').text();
        source.title = $(xml).find('channel > title').text();
        source.description = $(xml).find('channel > description').text();
        //RSS-Entries
        // $(xml).find('item').has('enclosure').slice(0, 5).each(function() {
            // episode = readEpisode($(this).find('link:first').text());
            // episode.title = $(this).find('title:first').text();
            // episode.mediaUrl = $(this).find('enclosure:first').attr('url');
            // episode.updated = new Date($(this).find('pubDate:first').text());
            // episode.source = source.title;
            // tracks.push(episode);
        // });
        //Im gegensatzt zu obigen auskomentierten Lösung berücksichtigt diese HTML-Links auf mp3-Dateien in der Description
        $(xml).find('item').each(function() {
            episode = readEpisode($(this).find('link:first').text());
            episode.title = $(this).find('title:first').text();
            if (/^\d/.test($(this).find('pubDate:first').text())) {
                episode.updated = new Date("Sun " + $(this).find('pubDate:first').text());
            } else {
                episode.updated = new Date($(this).find('pubDate:first').text());
            }
            episode.source = source.title;
            if ($(this).find('enclosure').length > 0) {
                episode.mediaUrl = $(this).find('enclosure:first').attr('url');
                tracks.push(episode);
            } else if ($($(this).find('encoded').text()).find('a[href$=".mp3"]').length > 0) {
                episode.mediaUrl = $($(this).find('encoded').text()).find('a[href$=".mp3"]').first().attr('href');
                tracks.push(episode);
            }
        });
        tracks.sort(sortEpisodes);
        tracks = tracks.slice(tracks.length - 5, tracks.length);
    }
    logHandler('Parsing source file "' + source.uri + '" finished', 'info');
    return {'source': source, 'episodes': tracks};
};
var downloadSource = function(source) {
    "use strict";
    var successfunction, errorfunction, parserresult;
    parserresult = {'source': source, 'episodes': []};
    successfunction = function(data) {
        logHandler('Download of source "' + source.uri + '" is finished', 'debug');
        parserresult = parseSource(data, source);
    };
    errorfunction = function() {
        if (localStorage.getItem("configuration.proxyUrl")) {
            logHandler('Direct download failed. Try proxy: ' + localStorage.getItem("configuration.proxyUrl").replace("$url$", source.uri), 'warning');
            $.ajax({
                'url': localStorage.getItem("configuration.proxyUrl").replace("$url$", source.uri),
                'async': false,
                'dataType': 'xml',
                'success': successfunction,
                'error': errorHandler
            });
        }
    };
    //Load Feed and Parse Entries
    try {
        $.ajax({
            'url': source.uri,
            'async': false,
            'dataType': 'xml',
            'beforeSend': function(jqXHR, settings) { jqXHR.requestURL = settings.url; },
            'success': successfunction,
            'error': errorfunction
        });
    } catch (ignore) {}
    return parserresult;
};
var readSourceList = function() {
    "use strict";
    var i, sourcelist = [];
    for (i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).slice(0, 7) === 'source.') {
            sourcelist.push(readSource(localStorage.key(i).substring(7)));
        }
    }
    return sourcelist;
};
var renderSource = function(source) {
    "use strict";
    var entryUI, entryFunctionsUI;
    entryUI = $('<li>');
    entryUI.data('sourceuri', source.uri);
    entryUI.append('<h3 class="title">' + source.title + '<h3>');
    entryUI.append('<p class="description">' + source.description + '</p>');
    entryUI.append('<p class="uri"><a href="' + source.uri + '">' + source.uri + '</a></p>');
    entryFunctionsUI = $('<span class="functions">');
    entryFunctionsUI.append('<a class="link" href="' + source.link + '">Internet</a> ');
    entryFunctionsUI.append('<a class="updateSource" href="' + source.uri + '">Update</a> ');
    entryFunctionsUI.append('<a class="deleteSource" href="' + source.uri + '">Delete</a>');
    entryUI.append(entryFunctionsUI);
    return entryUI;
};
var renderSourceList = function(sourcelist) {
    "use strict";
    var sourcelistUI, entryUI, i;
    sourcelistUI = $('#sources .entries');
    sourcelistUI.empty();
    if (sourcelist && sourcelist.length > 0) {
        for (i = 0; i < sourcelist.length; i++) {
            entryUI = renderSource(sourcelist[i]);
            sourcelistUI.append(entryUI);
        }
    } else {
        entryUI = $('<li>no entries</li>');
        sourcelistUI.append(entryUI);
    }
};

/** Load and Render Playlist*/
var readPlaylist = function(showAll) {
    "use strict";
    if (!showAll) {
        showAll = false;
    }
    var i, episode, playlist = [];
    for (i = 0; i < localStorage.length; i++) {
        if (localStorage.key(i).slice(0, 8) === 'episode.') {
            episode = readEpisode(localStorage.key(i).substring(8));
            if (episode.playback.played === false || showAll === true) {
                playlist.push(episode);
            }
        }
    }
    playlist.sort(sortEpisodes);
    return playlist;
};

/** Functions for configuration */
var renderConfiguration = function() {
    "use strict";
    if (localStorage.getItem("configuration.proxyUrl")) {
        $('#httpProxyInput').val(localStorage.getItem("configuration.proxyUrl"));
    }
};
var getLastPlayedEpisode = function() {
    "use strict";
    var lastPlayedEpisode, playlist, i;
    lastPlayedEpisode = $('#playlist li:first-child').data('episodeUri');
    playlist = readPlaylist();
    if (playlist && playlist.length > 0) {
        for (i = 0; i < playlist.length; i++) {
            if (playlist[i].uri === localStorage.getItem('configuration.lastPlayed')) {
                lastPlayedEpisode = playlist[i].uri;
                break;
            }
        }
    }
    return readEpisode(lastPlayedEpisode);
};

/** Functions for playback */
var activateEpisode = function(episode, onActivatedCallback) {
    "use strict";
    var mediaUrl, audioTag, mp3SourceTag;
    $('#player audio').off('timeupdate');
    logHandler("Timeupdate off", 'debug');
    if (episode) {
        POD.storage.openFile(episode, function(episode) {
            if (episode.offlineMediaUrl) {
                mediaUrl =  episode.offlineMediaUrl;
            } else {
                mediaUrl = episode.mediaUrl;
            }
            if ($('#player audio').length > 0) {
                audioTag = $('#player audio')[0];
                $(audioTag).find('source[type="audio/mpeg"]').attr('src', mediaUrl);
                $(audioTag).attr('title', episode.title);
            } else {
                $('#mediacontrol > p').remove();
                audioTag = $('<audio controls="controls" preload="metadata">');
                mp3SourceTag = $('<source type="audio/mpeg" />');
                mp3SourceTag.attr('src', mediaUrl);
                audioTag.append(mp3SourceTag);
                audioTag.attr('title', episode.title);
                $('#mediacontrol').prepend(audioTag);
                //Attach player events
                $('#player audio').on('loadstart', function() {
                    logHandler("==============================================", 'debug');
                    logHandler("Start loading " + activeEpisode().title, 'debug');
                });
                $('#player audio').on('loadedmetadata', function() {
                    logHandler("Load metadata of " + activeEpisode().title, 'debug');
                });
                $('#player audio').on('canplay', function() {
                    logHandler(activeEpisode().title + " is ready to play", 'debug');
                });
                $('#player audio').on('canplaythrough', function() {
                    logHandler(activeEpisode().title + " is realy ready to play (\"canplaythrough\")", 'debug');
                });
                $('#player audio').on('playing', function() {
                    logHandler(activeEpisode().title + " is playing", 'info');
                    this.autoplay = true;
                });
                $('#player audio').on('ended', function() {
                    logHandler(activeEpisode().title + " is ended", 'debug');
                    var episode = activeEpisode();
                    toggleEpisodeStatus(episode);
                    //Plays next Episode in Playlist
                    playEpisode(nextEpisode());
                });
                $('#player audio, #player audio source').on('error', function(e) {
                    var errormessage, readystate;
                    errormessage = e.toString();
                    readystate = $(this).parent()[0].readyState;
                    if (readystate === 0) {
                        errormessage = "Can't load file";
                    } else if ($(this).parent()[0].error) {
                        switch (e.target.error.code) {
                        case e.target.error.MEDIA_ERR_ABORTED:
                            errormessage = 'You aborted the video playback.';
                            break;
                        case e.target.error.MEDIA_ERR_NETWORK:
                            errormessage = 'A network error caused the audio download to fail.';
                            break;
                        case e.target.error.MEDIA_ERR_DECODE:
                            errormessage = 'The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.';
                            break;
                        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            errormessage = 'The video audio not be loaded, either because the server or network failed or because the format is not supported.';
                            break;
                        default:
                            errormessage = 'An unknown error occurred.';
                            break;
                        }
                    }
                    logHandler(errormessage, 'error');
                    playEpisode(nextEpisode());
                });
                $('#player audio').on('durationchange', function(event) {
                    logHandler("Duration of " + activeEpisode().title + " is changed to " + event.currentTarget.duration + ".", 'debug');
                    var episode = activeEpisode();
                    if (episode && this.duration > episode.playback.currentTime && this.currentTime <= episode.playback.currentTime) {
                        logHandler("CurrentTime will set to " + episode.playback.currentTime + " seconds", 'debug');
                        this.currentTime = episode.playback.currentTime;
                        $(this).on('timeupdate', function(event) {
                            //logHandler("Timeupdate reached", 'debug');
                            var episode = activeEpisode();
                            if (episode && (event.target.currentTime > (episode.playback.currentTime + 10) || event.target.currentTime < (episode.playback.currentTime - 10))) {
                                episode.playback.currentTime = Math.floor(event.target.currentTime / 10) * 10;
                                writeEpisode(episode);
                                logHandler('Current timecode is ' + episode.playback.currentTime + '.', 'debug');
                            }
                        });
                        logHandler("Timeupdate on", 'debug');
                    }
                });
            }
            //Styling
            $('#playlist').find('.activeEpisode').removeClass('activeEpisode');
            $('#playlist li').filter(function() { return $(this).data('episodeUri') === episode.uri; }).addClass('activeEpisode');
            if (onActivatedCallback && typeof onActivatedCallback === 'function') {
                onActivatedCallback(episode);
            }
        });
    }
};
var playEpisode = function(episode, onPlaybackStartedCallback) {
    "use strict";
    if (episode) {
        activateEpisode(episode, function(episode) {
            localStorage.setItem('configuration.lastPlayed', episode.uri);
            $('#player audio')[0].load();
            if (onPlaybackStartedCallback && typeof onPlaybackStartedCallback === 'function') {
                onPlaybackStartedCallback(episode);
            }
        });
    }
};

var POD = {
    version: "Alpha 0.14.10",
    storage: {
        indexedDbStorage: {
            settings: {
                name: 'HTML5Podcatcher',
                version: 4.0,
                sourcesStore: 'sources',
                episodesStore: 'episodes',
                filesStore: 'files'
            },
            updateIndexedDB: function(event) {
                "use strict";
                logHandler("Database Update from Version " + event.oldVersion + " to Version " + event.newVersion, 'info');
                var db, episodeStore;
                db = this.result;
                if (!db.objectStoreNames.contains(POD.storage.indexedDbStorage.settings.sourcesStore)) {
                    db.createObjectStore(POD.storage.indexedDbStorage.settings.sourcesStore, { keyPath: 'uri' });
                }
                if (!db.objectStoreNames.contains(POD.storage.indexedDbStorage.settings.episodesStore)) {
                    episodeStore = db.createObjectStore(POD.storage.indexedDbStorage.settings.episodesStore, { keyPath: 'uri' });
                    episodeStore.createIndex('source', 'source', {unique: false});
                }
                if (!db.objectStoreNames.contains(POD.storage.indexedDbStorage.settings.filesStore)) {
                    db.createObjectStore(POD.storage.indexedDbStorage.settings.filesStore, {});
                }
            },
            saveFile: function(episode, arraybuffer, mimeType, onWriteCallback) {
                "use strict";
                logHandler('Saving file "' + episode.mediaUrl + '" to IndexedDB starts now', 'debug');
                var blob, request;
                blob = new Blob([arraybuffer], {type: mimeType});
                request = window.indexedDB.open(this.settings.name, this.settings.version);
                request.onupgradeneeded = this.updateIndexedDB;
                request.onblocked = function() {
                    logHandler("Database blocked", 'debug');
                };
                request.onsuccess = function () {
                    logHandler("Success creating/accessing IndexedDB database", 'debug');
                    var db, transaction, store, request;
                    db = this.result;
                    transaction = db.transaction([POD.storage.indexedDbStorage.settings.filesStore], 'readwrite');
                    store = transaction.objectStore(POD.storage.indexedDbStorage.settings.filesStore);
                    request = store.put(blob, episode.mediaUrl);
                    // Erfolgs-Event
                    request.onsuccess = function() {
                        episode.isFileSavedOffline = true;
                        writeEpisode(episode);
                        logHandler('Saving file "' + episode.mediaUrl + '" to IndexedDB finished', 'info');
                        if (onWriteCallback && typeof onWriteCallback === 'function') {
                            onWriteCallback(episode);
                        }
                    };
                    request.onerror = function (event) {
                        logHandler('Error saving file "' + episode.mediaUrl + '" to IndexedDB (' + event + ')', 'error');
                    };
                };
                request.onerror = function () {
                    logHandler("Error creating/accessing IndexedDB database", 'error');
                };
            },
            deleteFile: function(episode, onDeleteCallback) {
                "use strict";
                var request;
                window.URL.revokeObjectURL(episode.offlineMediaUrl);
                request = window.indexedDB.open(this.settings.name, this.settings.version);
                request.onupgradeneeded = this.updateIndexedDB;
                request.onblocked = function() {
                    logHandler("Database blocked", 'debug');
                };
                request.onsuccess = function () {
                    logHandler("Success creating/accessing IndexedDB database", 'debug');
                    var db, transaction, store, request;
                    db = this.result;
                    transaction = db.transaction([POD.storage.indexedDbStorage.settings.filesStore], 'readwrite');
                    store = transaction.objectStore(POD.storage.indexedDbStorage.settings.filesStore);
                    request = store.delete(episode.mediaUrl);
                    // Erfolgs-Event
                    request.onsuccess = function() {
                        episode.isFileSavedOffline = false;
                        episode.offlineMediaUrl = undefined;
                        writeEpisode(episode);
                        logHandler('Deleting file "' + episode.mediaUrl + '" from IndexedDB finished', 'info');
                        if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                            onDeleteCallback(episode);
                        }
                    };
                    request.onerror = function (event) {
                        logHandler('Error deleting file "' + episode.mediaUrl + '" from IndexedDB (' + event + ')', 'error');
                    };
                };
                request.onerror = function () {
                    logHandler("Error creating/accessing IndexedDB database", 'error');
                };
            },
            openFile: function(episode, onReadCallback) {
                "use strict";
                if (episode.isFileSavedOffline) {
                    logHandler('Opening file "' + episode.mediaUrl + '" from IndexedDB starts now', 'debug');
                    var request;
                    request = window.indexedDB.open(this.settings.name, this.settings.version);
                    request.onupgradeneeded = this.updateIndexedDB;
                    request.onblocked = function() {
                        logHandler("Database blocked", 'debug');
                    };
                    request.onsuccess = function () {
                        logHandler("Success creating/accessing IndexedDB database", 'debug');
                        var db, transaction, store, request;
                        db = this.result;
                        transaction = db.transaction([POD.storage.indexedDbStorage.settings.filesStore], 'readonly');
                        store = transaction.objectStore(POD.storage.indexedDbStorage.settings.filesStore);
                        request = store.get(episode.mediaUrl);
                        // Erfolgs-Event
                        request.onsuccess = function(event) {
                            var objectUrl, blob;
                            blob = event.target.result;
                            objectUrl = window.URL.createObjectURL(blob);
                            episode.offlineMediaUrl = objectUrl;
                            if (onReadCallback && typeof onReadCallback === 'function') {
                                onReadCallback(episode);
                            }
                        };
                        request.onerror = function (event) {
                            logHandler('Error opening file "' + episode.mediaUrl + '" from IndexedDB (' + event + ')', 'error');
                        };
                    };
                    request.onerror = function () {
                        logHandler("Error creating/accessing IndexedDB database", 'error');
                    };
                }
            }
        },//end IndexedDbStorage
        fileSystemStorage: {
            saveFile: function(episode, arraybuffer, mimeType, onWriteCallback) {
                "use strict";
                logHandler('Saving file "' + episode.mediaUrl + '" to local file system starts now', 'debug');
                var blob, parts, fileName;
                blob = new Blob([arraybuffer], {type: mimeType});
                parts = episode.mediaUrl.split('/');
                fileName = parts[parts.length - 1];
                // Write file to the root directory.
                window.requestFileSystem(fileSystemStatus, fileSystemSize, function(filesystem) {
                    filesystem.root.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
                        fileEntry.createWriter(function(writer) {
                            writer.onwrite = function(event) {
                                progressHandler(event, 'Write', episode);
                            };
                            writer.onwriteend = function() { //success
                                episode.isFileSavedOffline = true;
								episode.offlineMediaUrl = fileEntry.toURL();
                                writeEpisode(episode);
                                logHandler('Saving file "' + episode.mediaUrl + '" to local file system finished', 'info');
                                if (onWriteCallback && typeof onWriteCallback === 'function') {
                                    onWriteCallback(episode);
                                }
                            };
                            writer.onerror = function(event) {
                                logHandler('Error on saving file "' + episode.mediaUrl + '" to local file system (' + event + ')', 'error');
                            };
                            writer.write(blob);
                        }, errorHandler);
                    }, errorHandler);
                }, errorHandler);
            },
            deleteFile: function(episode, onDeleteCallback) {
                "use strict";
                window.resolveLocalFileSystemURL(episode.offlineMediaUrl, function(fileEntry) { //success
                    fileEntry.remove(function() { //success
                        var url;
                        url = episode.offlineMediaUrl;
						episode.isFileSavedOffline = false;
                        episode.offlineMediaUrl = undefined;
                        writeEpisode(episode);
                        logHandler('Deleting file "' + url + '" finished', 'info');
                        if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                            onDeleteCallback(episode);
                        }
                    }, errorHandler);
                }, function(event) { //error
                    if (event.code === event.NOT_FOUND_ERR) {
                        var url;
                        url = episode.offlineMediaUrl;
                        episode.offlineMediaUrl = undefined;
                        writeEpisode(episode);
                        logHandler('File "' + url + '"not found. But that\'s OK', 'info');
                    } else {
                        errorHandler(event);
                    }
                });
            },
            openFile: function(episode, onReadCallback) {
                "use strict";
                if (onReadCallback && typeof onReadCallback === 'function') {
                    onReadCallback(episode);
                }
            }
        },//end FileSystemStorage
        isFileStorageAvailable: function() {
            "use strict";
            return window.requestFileSystem || window.indexedDB;
        },
        saveFile: function(episode, arraybuffer, mimeType, onWriteCallback) {
            "use strict";
            if (window.requestFileSystem) {
                this.fileSystemStorage.saveFile(episode, arraybuffer, mimeType, onWriteCallback);
            } else {
                this.indexedDbStorage.saveFile(episode, arraybuffer, mimeType, onWriteCallback);
            }
        },
        deleteFile: function(episode, onDeleteCallback) {
            "use strict";
            if (window.requestFileSystem) {
                this.fileSystemStorage.deleteFile(episode, onDeleteCallback);
            } else {
                this.indexedDbStorage.deleteFile(episode, onDeleteCallback);
            }
        },
        openFile: function(episode, onReadCallback) {
            "use strict";
            if (window.requestFileSystem) {
                this.fileSystemStorage.openFile(episode, onReadCallback);
            } else {
                this.indexedDbStorage.openFile(episode, onReadCallback);
            }
        }
    },
    web: {
        downloadFile: function(episode, mimeType, onDownloadCallback) {
            "use strict";
            var xhr = new XMLHttpRequest();
            xhr.open('GET', episode.mediaUrl, true);
            xhr.responseType = 'arraybuffer';
            xhr.timeout = downloadTimeout;
            xhr.addEventListener("progress", function(event) {
                progressHandler(event, 'Download', episode);
            }, false);
            xhr.addEventListener("abort", logHandler, false);
            xhr.addEventListener("error", function() {
                logHandler('Direct download failed. Try proxy: ' + localStorage.getItem("configuration.proxyUrl").replace("$url$", episode.mediaUrl), 'warning');
                var xhrProxy = new XMLHttpRequest();
                xhrProxy.open('GET', localStorage.getItem("configuration.proxyUrl").replace("$url$", episode.mediaUrl), true);
                xhrProxy.responseType = 'arraybuffer';
                xhrProxy.timeout = downloadTimeout;
                xhrProxy.addEventListener("progress", function(event) {
                    progressHandler(event, 'Download', episode);
                }, false);
                xhrProxy.addEventListener("abort", logHandler, false);
                xhrProxy.addEventListener("error", errorHandler, false);
                xhrProxy.onload = function() {
                    if (this.status === 200) {
                        logHandler('Download of file "' + episode.mediaUrl + '" via proxy is finished', 'debug');
                        POD.storage.saveFile(episode, xhrProxy.response, mimeType, onDownloadCallback);
                    } else {
                        logHandler('Error Downloading file "' + episode.mediaUrl + '" via proxy: ' + this.statusText + ' (' + this.status + ')', 'error');
                    }
                };
                xhrProxy.ontimeout = function() {
                    logHandler("Timeout after " + (xhrProxy.timeout / 60000) + " minutes.", "error");
                };
                xhrProxy.send(null);
            }, false);
            xhr.onload = function() {
                if (this.status === 200) {
                    logHandler('Download of file "' + episode.mediaUrl + '" is finished', 'debug');
                    POD.storage.saveFile(episode, xhr.response, mimeType, onDownloadCallback);
                } else {
                    logHandler('Error Downloading file "' + episode.mediaUrl + '": ' + this.statusText + ' (' + this.status + ')', 'error');
                }
            };
            xhr.ontimeout = function() {
                logHandler("Timeout after " + (xhr.timeout / 60000) + " minutes.", "error");
            };
            xhr.send(null);
        }
    }
};

var UI =  {
    renderEpisode: function(episode) {
        "use strict";
        var entryUI, entryFunctionsUI;
        entryUI = $('<li>');
        entryUI.data('episodeUri', episode.uri);
        entryUI.append('<h3 class="title"><a href="' + episode.uri + '">' + episode.title + '</a></h3>');
        entryUI.append('<span class="source">' + episode.source + '</span>');
        entryUI.append('<time datetime="' + episode.updated.toISOString() + '" class="updated">' + episode.updated.toLocaleDateString() + " " + episode.updated.toLocaleTimeString() + '</span>');
        entryFunctionsUI = $('<span class="functions">');
        if (episode.playback.played) {
            entryFunctionsUI.append('<a class="status" href="#">Status: played</a>');
        } else {
            entryFunctionsUI.append('<a class="status" href="#">Status: new</a>');
        }
        entryFunctionsUI.append('<a class="origin" href="' + episode.uri + '">Internet</a>');
        if (POD.storage.isFileStorageAvailable()) {
            if (episode.isFileSavedOffline) {
                entryFunctionsUI.append('<a class="delete" href="' + episode.mediaUrl + '">Delete</a>');
            } else if (episode.mediaUrl) {
                entryFunctionsUI.append('<a class="download" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf()) + '">Download</a>');
            }
        }
        entryUI.append(entryFunctionsUI);
        return entryUI;
    },
    renderPlaylist: function(playlist) {
        "use strict";
        var playlistUI, entryUI, i;
        playlistUI = $('#playlist .entries');
        playlistUI.empty();
        if (playlist && playlist.length > 0) {
            for (i = 0; i < playlist.length; i++) {
                entryUI = this.renderEpisode(playlist[i]);
                playlistUI.append(entryUI);
            }
        } else {
            entryUI = $('<li>no entries</li>');
            playlistUI.append(entryUI);
        }
    }
};

/** Central 'ready' event handler */
$(document).ready(function() {
    "use strict";
    //Update local storage to actual version of key-names (changed "track" to "episode")
    var k, quota;
    for (k = 0; k < localStorage.length; k++) {
        if (localStorage.key(k).slice(0, 6) === 'track.') {
            localStorage.setItem(localStorage.key(k).replace('track.', 'episode.'), localStorage.getItem(localStorage.key(k)));
            localStorage.removeItem(localStorage.key(k));
        }
    }
    //Application Cache Events
    $(applicationCache).on('checking', function() {
        logHandler("Application cache checks for updates (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache check for updates" + '</span></br>');
    });
    $(applicationCache).on('noupdate', function() {
        logHandler("Application cache founds no update (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache founds no update" + '</span></br>');
    });
    $(applicationCache).on('downloading', function() {
        logHandler("Application cache download updated files (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache download updated files" + '</span></br>');
    });
    $(applicationCache).on('progress', function() {
        logHandler("Application cache downloading files (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache downloading files" + '</span></br>');
    });
    $(applicationCache).on('cached', function() {
        logHandler("Application cached (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cached" + '</span></br>');
    });
    $(applicationCache).on('updateready', function() {
        logHandler("Application cache is updated (Cache status: " + applicationCache.status + ")", 'info');
        $('#applicationCacheLog').prepend('<span>' + "Application cache is updated" + '</span></br>');
        applicationCache.swapCache();
        alert("An update of HTML5 Podcatcher is available. Please reload to activate the new Version.");
    });
    $(applicationCache).on('obsolete', function() {
        logHandler("Application cache is corrupted and will be deletet (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache is corrupted and will be deletet" + '</span></br>');
    });
    $(applicationCache).on('error', function() {
        logHandler("Error downloading manifest or resources (Cache status: " + applicationCache.status + ")", 'error');
        $('#applicationCacheLog').prepend('<span>' + "Error downloading manifest or resources" + '</span></br>');
    });
    //Player UI Events
    $('#player #playPreviousEpisode').on('click', function() {
        playEpisode(previousEpisode());
    });
    $('#player #playNextEpisode').on('click', function() {
        playEpisode(nextEpisode());
    });
    $('#player #jumpBackwards').on('click', function() {
        var audioTag = $('#player audio')[0];
        audioTag.currentTime = Math.max(0, audioTag.currentTime - 10);
    });
    $('#player #jumpForwards').on('click', function() {
        var audioTag = $('#player audio')[0];
        audioTag.currentTime = Math.min(audioTag.duration, audioTag.currentTime + 10);
    });
	//Playlist UI Events
    $('#playlist').on('click', 'li', function(event) {
        event.preventDefault();
        event.stopPropagation();
        //Play episode
        $('#player audio')[0].autoplay = true;
        playEpisode(readEpisode($(this).data('episodeUri')));
    });
    $('#playlist').on('click', '.download', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var episode, episodeUI;
        episodeUI = $(this).closest('li');
        episode = readEpisode(episodeUI.data('episodeUri'));
        logHandler('Downloading file "' + episode.mediaUrl + '" starts now.', 'info');
        POD.web.downloadFile(episode, 'audio/mpeg', function(episode) {
            episodeUI.replaceWith(UI.renderEpisode(episode));
        });
    });
    $('#playlist').on('click', '.delete', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var episode;
        episode = readEpisode($(this).closest('li').data('episodeUri'));
        logHandler('Deleting file "' + episode.offlineMediaUrl + '" starts now', 'info');
        POD.storage.deleteFile(episode);
    });
    $('#playlist').on('click', '.status', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var episode;
        episode = readEpisode($(this).closest('li').data('episodeUri'));
        toggleEpisodeStatus(episode);
        if (episode.playback.played) {
            $(this).text("Status: played");
        } else {
            $(this).text("Status: new");
        }
    });
    $('#playlist').on('click', '.origin', function(event) {
        event.stopPropagation();
        event.preventDefault();
        window.open($(this).attr('href'), '_blank');
    });
    $('#playlist #updatePlaylist').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var i, j, sources, parserresult;
        sources = readSourceList();
        for (i = 0; i < sources.length; i++) {
            parserresult = downloadSource(sources[i]);
            //Update source in storage
            writeSource(parserresult.source);
            //Save Episodes to local storage
            for (j = 0; j < parserresult.episodes.length; j++) {
                //Save all Episodes in the parser result
                writeEpisode(parserresult.episodes[j]);
            }
        }
        UI.renderPlaylist(readPlaylist());
    });
    $('#playlist #showFullPlaylist').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        UI.renderPlaylist(readPlaylist(true));
    });
    //Sources UI Events
    $('#sources').on('click', '.updateSource', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var i, parserresult;
        parserresult = downloadSource(readSource($(this).attr("href")));
        //Update source in storage
        writeSource(parserresult.source);
        //Save Episodes to local storage
        for (i = 0; i < parserresult.episodes.length; i++) {
            //Save all Episodes in the parser result
            writeEpisode(parserresult.episodes[i]);
        }
        UI.renderPlaylist(readPlaylist());
    });
    $('#sources').on('click', '.deleteSource', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var source, i;
        source = readSource($(this).closest('li').data('sourceuri'));
        deleteSource(source);
        for (i = 0; i < $('#sources .entries li').length; i++) {
            if ($($('#sources .entries li')[i]).data('sourceuri') === source.uri) {
                $($('#sources .entries li')[i]).slideUp(400, function() { $(this).remove(); });
                break;
            }
        }
    });
    $('#sources').on('click', '.link', function(event) {
        event.preventDefault();
        event.stopPropagation();
        window.open($(this).attr('href'), '_blank');
    });
    $('#sources #addSourceForm').on('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();
        var parserresult, entryUI, i;
        if ($('#addSourceUrlInput')[0].checkValidity()) {
            parserresult = downloadSource(readSource($('#addSourceUrlInput').val()));
            if (parserresult) {
                writeSource(parserresult.source);
                entryUI = renderSource(parserresult.source);
                for (i = 0; i < $('#sources .entries li').length; i++) {
                    if ($($('#sources .entries li')[i]).data('sourceuri') === parserresult.source.uri) {
                        $($('#sources .entries li')[i]).slideUp().html(entryUI.html()).slideDown();
                        i = -1;
                        break;
                    }
                }
                if (i !== -1) {
                    entryUI.hide();
                    $('#sources .entries').append(entryUI);
                    entryUI.fadeIn();
                }
                for (i = 0; i < parserresult.episodes.length; i++) {
                    //Save all Episodes in the parser result
                    writeEpisode(parserresult.episodes[i]);
                }
                UI.renderPlaylist(readPlaylist());
                logHandler('Added new source "' + parserresult.source.uri + '" sucessfully', 'info');
            } else {
                logHandler('Adding new source "' + $('#addSourceUrlInput').val() + '" throws an error', 'info');
            }
        } else {
            logHandler('Please insert a URL of a RSS/Atom feed', 'error');
        }
    });
    //Configuration UI Events
    $('#configuration #memorySizeForm').on('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#memorySizeInput')[0].checkValidity()) {
            requestFileSystemQuota($('#memorySizeInput').val() * 1024 * 1024);
        } else {
            logHandler('Please insert a number', 'error');
        }
    });
    $('#configuration #proxyForm').on('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#httpProxyInput')[0].checkValidity()) {
            localStorage.setItem("configuration.proxyUrl", $('#httpProxyInput').val());
        } else {
            logHandler('Please insert a URL', 'error');
        }
    });
    $('#configuration #exportConfiguration').on('click', function() {
        var i, key, config;
        config = {'Episodes': {}, 'Sources': {}, 'Settings': {}};
        for (i = 0; i < localStorage.length; i++) {
            key = localStorage.key(i);
            if (key.slice(0, 7) === 'source.') {
                config.Sources[key] = localStorage.getItem(key);
            } else if (localStorage.key(i).slice(0, 8) === 'episode.') {
                config.Episodes[key] = localStorage.getItem(key);
            } else {
                config.Settings[key] = localStorage.getItem(key);
            }
        }
        $(this).parent().find('#SerialisedConfigurationInput').val(JSON.stringify(config));
        $(this).parent().find('#SerialisedConfigurationInput')[0].select();
    });
    $('#configuration #importConfiguration').on('click', function() {
        var config, property;
        localStorage.clear();
        config = JSON.parse($(this).parent().find('#SerialisedConfigurationInput').val());
        for (property in config.Episodes) {
            if (config.Episodes.hasOwnProperty(property)) {
                localStorage.setItem(property, config.Episodes[property]);
            }
        }
        for (property in config.Sources) {
            if (config.Sources.hasOwnProperty(property)) {
                localStorage.setItem(property, config.Sources[property]);
            }
        }
        for (property in config.Settings) {
            if (config.Settings.hasOwnProperty(property)) {
                localStorage.setItem(property, config.Settings[property]);
            }
        }
    });
    $('#statusbar').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).parent().toggleClass('fullscreen');
    });
    //Quota and Filesystem initialisation
    quota = localStorage.getItem("configuration.quota");
    if (!quota) { quota = 1024 * 1024 * 200; }
    requestFileSystemQuota(quota);
    //Render lists and settings
    renderConfiguration();
    renderSourceList(readSourceList());
    UI.renderPlaylist(readPlaylist());
    //Initialise player
    playEpisode(getLastPlayedEpisode());
    //set up player to last played state
    //playEpisode(readEpisode(localStorage.getItem('configuration.lastPlayed')));
});
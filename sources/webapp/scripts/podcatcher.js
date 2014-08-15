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
/*global CustomEvent */
/*global POD */
var UI =  {
    escapeHtml: function (text) {
        "use strict";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },
    logHandler: function (message, loglevel) {
        "use strict";
        console.log(loglevel + ': ' + message);
        $('#statusbar').prepend('<span class=' + loglevel + '>' + message + '</span></br>');
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
    findEpisodeUI: function (episode) {
        "use strict";
        var episodeUI;
        $('#playlist .entries li').each(function () {
            if ($(this).data('episodeUri') === episode.uri) {
                episodeUI = this;
                return false;
            }
        });
        return episodeUI;
    },
    actualiseEpisodeUI: function (episode) {
        "use strict";
        var episodeUI;
        episodeUI = UI.findEpisodeUI(episode);
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
    },
    renderConfiguration: function () {
        "use strict";
        if (localStorage.getItem("configuration.proxyUrl")) {
            $('#httpProxyInput').val(localStorage.getItem("configuration.proxyUrl"));
        }
    },
    renderEpisode: function (episode) {
        "use strict";
        var entryUI, entryFunctionsUI;
        entryUI = $('<li>');
        entryUI.data('episodeUri', episode.uri);
        entryUI.append('<h3 class="title"><a href="' + episode.uri + '">' + episode.title + '</a></h3>');
        entryUI.append('<span class="source">' + episode.source + '</span>');
        entryUI.append('<time datetime="' + episode.updated.toISOString() + '" class="updated">' + episode.updated.toLocaleDateString() + " " + episode.updated.toLocaleTimeString() + '</span>');
        entryFunctionsUI = $('<span class="functions">');
        if (episode.playback.played) {
            entryFunctionsUI.append('<button type="button" class="status">Status: played</button>');
        } else {
            entryFunctionsUI.append('<button type="button" class="status">Status: new</button>');
        }
        entryFunctionsUI.append('<a class="origin button" href="' + episode.uri + '">Internet</a>');
        if (POD.storage.isFileStorageAvailable()) {
            if (episode.isFileSavedOffline) {
                entryFunctionsUI.append('<button type="button" class="delete" href="' + episode.mediaUrl + '">Delete</button>');
            } else if (episode.mediaUrl) {
                entryFunctionsUI.append('<a class="button downloadFile" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf()) + '">Download</a>');
            }
        }
        entryUI.append(entryFunctionsUI);
        return entryUI;
    },
    renderPlaylist: function (playlist) {
        "use strict";
        var playlistUI, entryUI, i;
        playlistUI = $('#playlist .entries');
        playlistUI.empty();
        if (playlist && playlist.length > 0) {
            for (i = 0; i < playlist.length; i++) {
                entryUI = UI.renderEpisode(playlist[i]);
                playlistUI.append(entryUI);
            }
        } else {
            entryUI = $('<li>no entries</li>');
            playlistUI.append(entryUI);
        }
    },
    renderSource: function (source) {
        "use strict";
        var entryUI, entryFunctionsUI;
        entryUI = $('<li>');
        entryUI.data('sourceUri', source.uri);
        entryUI.append('<h3 class="title">' + source.title + '<h3>');
        entryUI.append('<p class="description">' + source.description + '</p>');
        entryUI.append('<p class="uri"><a href="' + source.uri + '">' + source.uri + '</a></p>');
        entryFunctionsUI = $('<span class="functions">');
        entryFunctionsUI.append('<a class="link button" href="' + source.link + '">Internet</a> ');
        entryFunctionsUI.append('<button type="button" class="updateSource" href="' + source.uri + '">Update</button> ');
        entryFunctionsUI.append('<button type="button" class="deleteSource" href="' + source.uri + '">Delete</button>');
        entryUI.append(entryFunctionsUI);
        return entryUI;
    },
    renderSourceList: function (sourcelist) {
        "use strict";
        var sourcelistUI, entryUI, i;
        sourcelistUI = $('#sources .entries');
        sourcelistUI.empty();
        if (sourcelist && sourcelist.length > 0) {
            for (i = 0; i < sourcelist.length; i++) {
                entryUI = this.renderSource(sourcelist[i]);
                sourcelistUI.append(entryUI);
            }
        } else {
            entryUI = $('<li>no entries</li>');
            sourcelistUI.append(entryUI);
        }
    },
    activeEpisode: function (onReadCallback) {
        "use strict";
        var activeEpisode = $('#playlist').find('.activeEpisode');
        POD.storage.readEpisode(activeEpisode.data('episodeUri'), onReadCallback);
    },
    previousEpisode: function (onReadCallback) {
        "use strict";
        var activeEpisode = $('#playlist').find('.activeEpisode');
        POD.storage.readEpisode(activeEpisode.prev().data('episodeUri'), onReadCallback);
    },
    nextEpisode: function (onReadCallback) {
        "use strict";
        var activeEpisode = $('#playlist').find('.activeEpisode');
        POD.storage.readEpisode(activeEpisode.next().data('episodeUri'), onReadCallback);
    },
    getLastPlayedEpisode: function (onReadCallback) {
        "use strict";
        var lastPlayedEpisode, i;
        lastPlayedEpisode = $('#playlist li:first-child').data('episodeUri');
        POD.storage.readPlaylist(false, function (playlist) {
            if (playlist && playlist.length > 0) {
                for (i = 0; i < playlist.length; i++) {
                    if (playlist[i].uri === localStorage.getItem('configuration.lastPlayed')) {
                        lastPlayedEpisode = playlist[i].uri;
                        break;
                    }
                }
            }
            POD.storage.readEpisode(lastPlayedEpisode, onReadCallback);
        });
    },
    progressHandler: function (progressEvent, prefix, episode) {
        "use strict"; //xmlHttpRequestProgressEvent
        var progressbar, percentComplete, episodeUI;
        episodeUI = UI.findEpisodeUI(episode);
        if ($(episodeUI).find('progress').length) {
            progressbar = $(episodeUI).find('progress');
        } else {
            progressbar = $('<progress min="0" max="1">&helip;</progress>');
            $(episodeUI).find('.downloadFile').hide().after(progressbar);
        }
        if (progressEvent.lengthComputable) {
            percentComplete = progressEvent.loaded / progressEvent.total;
            console.log(prefix + ': ' + (percentComplete * 100).toFixed(2) + '%');
            $(episodeUI).find('progress').attr('value', percentComplete).text((percentComplete * 100).toFixed(2) + '%');
        } else {
            console.log(prefix + '...');
            $(episodeUI).find('progress').removeAttr('value').text('&helip;');
        }
    }
};

/** Functions for playback */
var activateEpisode = function (episode, onActivatedCallback) {
    "use strict";
    var mediaUrl, audioTag, mp3SourceTag;
    $('#player audio').off('timeupdate');
    UI.logHandler("Timeupdate off", 'debug');
    if (episode) {
        POD.storage.openFile(episode, function (episode) {
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
                $('#player audio').on('loadstart', function () {
                    UI.logHandler("==============================================", 'debug');
                    UI.activeEpisode(function (episode) { UI.logHandler("Start loading " + episode.title, 'debug'); });
                });
                $('#player audio').on('loadedmetadata', function () {
                    UI.activeEpisode(function (episode) { UI.logHandler("Load metadata of " + episode.title, 'debug'); });
                });
                $('#player audio').on('canplay', function () {
                    UI.activeEpisode(function (episode) { UI.logHandler(episode.title + " is ready to play", 'debug'); });
                });
                $('#player audio').on('canplaythrough', function () {
                    UI.activeEpisode(function (episode) { UI.logHandler(episode.title + " is realy ready to play (\"canplaythrough\")", 'debug'); });
                });
                $('#player audio').on('playing', function (event) {
                    var audioElement = event.target;
                    UI.activeEpisode(function (episode) {
                        UI.logHandler(episode.title + " is playing", 'info');
                        audioElement.autoplay = true;
                    });
                });
                $('#player audio').on('ended', function () {
                    UI.activeEpisode(function (episode) {
                        UI.logHandler(episode.title + " is ended", 'debug');
                        POD.toggleEpisodeStatus(episode);
                        //Plays next Episode in Playlist
                        UI.nextEpisode(playEpisode);
                    });
                });
                $('#player audio, #player audio source').on('error', function (e) {
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
                    UI.logHandler(errormessage, 'error');
                    UI.nextEpisode(playEpisode);
                });
                $('#player audio').on('durationchange', function (event) {
                    var audioElement = event.target;
                    UI.activeEpisode(function (episode) {
                        UI.logHandler("Duration of " + episode.title + " is changed to " + event.currentTarget.duration + ".", 'debug');
                        if (episode && audioElement.duration > episode.playback.currentTime && audioElement.currentTime <= episode.playback.currentTime) {
                            UI.logHandler("CurrentTime will set to " + episode.playback.currentTime + " seconds", 'debug');
                            audioElement.currentTime = episode.playback.currentTime;
                            $(audioElement).on('timeupdate', function (event) {
                                if (episode && (event.target.currentTime > (episode.playback.currentTime + 10) || event.target.currentTime < (episode.playback.currentTime - 10))) {
                                    episode.playback.currentTime = Math.floor(event.target.currentTime / 10) * 10;
                                    POD.storage.writeEpisode(episode);
                                    UI.logHandler('Current timecode is ' + episode.playback.currentTime + '.', 'debug');
                                }
                            });
                            UI.logHandler("Timeupdate on", 'debug');
                        }
                    });
                });
            }
            //Styling
            $('#playlist').find('.activeEpisode').removeClass('activeEpisode');
            $('#playlist li').filter(function () { return $(this).data('episodeUri') === episode.uri; }).addClass('activeEpisode');
            if (onActivatedCallback && typeof onActivatedCallback === 'function') {
                onActivatedCallback(episode);
            }
        });
    }
};
var playEpisode = function (episode, onPlaybackStartedCallback) {
    "use strict";
    if (episode) {
        activateEpisode(episode, function (episode) {
            localStorage.setItem('configuration.lastPlayed', episode.uri);
            $('#player audio')[0].load();
            if (onPlaybackStartedCallback && typeof onPlaybackStartedCallback === 'function') {
                onPlaybackStartedCallback(episode);
            }
        });
    }
};

/** Central 'ready' event handler */
$(document).ready(function () {
    "use strict";
    //Update local storage to actual version of key-names (changed "track" to "episode")
    var k, quota, multiMediaKeyDownTimestemp;
    POD.settings.uiLogger = UI.logHandler;
    for (k = 0; k < localStorage.length; k++) {
        if (localStorage.key(k).slice(0, 6) === 'track.') {
            localStorage.setItem(localStorage.key(k).replace('track.', 'episode.'), localStorage.getItem(localStorage.key(k)));
            localStorage.removeItem(localStorage.key(k));
        }
    }
    //Application Cache Events
    $(applicationCache).on('checking', function () {
        UI.logHandler("Application cache checks for updates (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache check for updates" + '</span></br>');
    });
    $(applicationCache).on('noupdate', function () {
        UI.logHandler("Application cache founds no update (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache founds no update" + '</span></br>');
    });
    $(applicationCache).on('downloading', function () {
        UI.logHandler("Application cache download updated files (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache download updated files" + '</span></br>');
    });
    $(applicationCache).on('progress', function () {
        UI.logHandler("Application cache downloading files (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache downloading files" + '</span></br>');
    });
    $(applicationCache).on('cached', function () {
        UI.logHandler("Application cached (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cached" + '</span></br>');
    });
    $(applicationCache).on('updateready', function () {
        UI.logHandler("Application cache is updated (Cache status: " + applicationCache.status + ")", 'info');
        $('#applicationCacheLog').prepend('<span>' + "Application cache is updated" + '</span></br>');
        applicationCache.swapCache();
		if (confirm("An update of HTML5 Podcatcher is available. Do you want to reload now?")) {
            window.location.reload();
        }
    });
    $(applicationCache).on('obsolete', function () {
        UI.logHandler("Application cache is corrupted and will be deletet (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache is corrupted and will be deletet" + '</span></br>');
    });
    $(applicationCache).on('error', function () {
        UI.logHandler("Error downloading manifest or resources (Cache status: " + applicationCache.status + ")", 'error');
        $('#applicationCacheLog').prepend('<span>' + "Error downloading manifest or resources" + '</span></br>');
    });
    //Player UI Events
    $('#player #playPreviousEpisode').on('click', function () {
        UI.previousEpisode(playEpisode);
    });
    $('#player #playNextEpisode').on('click', function () {
        UI.nextEpisode(playEpisode);
    });
    $('#player #jumpBackwards').on('click', function () {
        var audioTag = $('#player audio')[0];
        audioTag.currentTime = Math.max(0, audioTag.currentTime - 10);
    });
    $('#player #jumpForwards').on('click', function () {
        var audioTag = $('#player audio')[0];
        audioTag.currentTime = Math.min(audioTag.duration, audioTag.currentTime + 10);
    });
    $(document).on('keydown', function (event) {
        if (event.key === 'MediaNextTrack' || event.keyCode === 176) {
            var now = new Date();
            if (!multiMediaKeyDownTimestemp) {
                multiMediaKeyDownTimestemp = new Date();
            } else if (now - multiMediaKeyDownTimestemp >= 1000) {
                if ($('#player audio').length && $('#player audio')[0].playbackRate === 1) {
                    $('#player audio')[0].playbackRate = 2;
                }
            }
        }
    });
    $(document).on('keyup', function (event) {
        if (event.key === 'MediaNextTrack' || event.keyCode === 176) {
            var now = new Date();
            if (now - multiMediaKeyDownTimestemp < 1000) {
                UI.nextEpisode(playEpisode);
            } else {
                if ($('#player audio').length && $('#player audio')[0].playbackRate !== 1) {
                    $('#player audio')[0].playbackRate = 1;
                }
            }
        } else if (event.key === 'MediaPreviousTrack' || event.keyCode === 177) {
            if ($('#player audio').length && $('#player audio')[0].currentTime >= 10) {
                $('#player audio')[0].currentTime = 0;
            } else {
                UI.previousEpisode(playEpisode);
            }
        } else if (event.key === 'MediaPlayPause' || event.key === 'MediaPlay' || event.keyCode === 179) {
            if ($('#player audio').length) {
                if ($('#player audio')[0].paused) {
                    $('#player audio')[0].play();
                } else {
                    $('#player audio')[0].pause();
                }
            }
        } else if (event.key === 'MediaStop' || event.keyCode === 178) {
            if ($('#player audio').length) {
                $('#player audio')[0].pause();
            }
        }
        multiMediaKeyDownTimestemp = undefined;
    });
    //Playlist UI Events
    $('#playlist').on('click', 'li', function (event) {
        event.preventDefault();
        event.stopPropagation();
        //Play episode
        //$('#player audio')[0].autoplay = true;
        POD.storage.readEpisode($(this).data('episodeUri'), playEpisode);
    });
    $('#playlist').on('click', '.downloadFile', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var episodeUI;
        episodeUI = $(this).closest('li');
        POD.storage.readEpisode(episodeUI.data('episodeUri'), function (episode) {
            UI.logHandler('Downloading file "' + episode.mediaUrl + '" starts now.', 'info');
            POD.web.downloadFile(episode, 'audio/mpeg', function (episode) {
                episodeUI.replaceWith(UI.renderEpisode(episode));
            }, UI.progressHandler);
        });
    });
    $('#playlist').on('click', '.delete', function (event) {
        event.preventDefault();
        event.stopPropagation();
        POD.storage.readEpisode($(this).closest('li').data('episodeUri'), function (episode) {
            UI.logHandler('Deleting file "' + episode.offlineMediaUrl + '" starts now', 'info');
            POD.storage.deleteFile(episode);
        });
    });
    $('#playlist').on('click', '.status', function (event) {
        event.preventDefault();
        event.stopPropagation();
        POD.storage.readEpisode($(this).closest('li').data('episodeUri'), function (episode) {
            POD.toggleEpisodeStatus(episode);
        });
    });
    $('#playlist').on('click', '.origin', function (event) {
        event.stopPropagation();
        event.preventDefault();
        window.open($(this).attr('href'), '_blank');
    });
    $('#playlist #updatePlaylist').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var i;
        POD.storage.readSources(function (sources) {
            for (i = 0; i < sources.length; i++) {
                POD.web.downloadSource(sources[i]);
            }
        });
    });
    $('#playlist #showFullPlaylist').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        POD.storage.readPlaylist(true, UI.renderPlaylist);
    });
    document.addEventListener('writeEpisode', function (event) {
        var i, episode, episodeUI;
        episode = event.detail.episode;
        episodeUI = UI.renderEpisode(episode);
        //find episode in HTML markup
        for (i = 0; i < $('#playlist').find('.entries li').length; i++) {
            if ($($('#playlist').find('.entries li')[i]).data('episodeUri') === episode.uri) {
                //Actualise episodes markup
                $($('#playlist').find('.entries li')[i]).html(episodeUI.html());
                return;
            }
        }
        //show unlisend episode if not listed before
        if (!episode.playback.played) {
            episodeUI.hide();
            $('#playlist').find('.entries').append(episodeUI);
            episodeUI.fadeIn();
        }
    }, false);
    //Sources UI Events
    $('#sources').on('click', '.updateSource', function (event) {
        event.preventDefault();
        event.stopPropagation();
        POD.storage.readSource($(this).attr("href"), function (source) {
            POD.web.downloadSource(source);
        });
    });
    $('#sources').on('click', '.deleteSource', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var i, removeFunction;
        removeFunction = function (element) { $(element).remove(); };
        POD.storage.readSource($(this).closest('li').data('sourceUri'), function (source) {
            POD.storage.deleteSource(source, function (source) {
                for (i = 0; i < $('#sources .entries li').length; i++) {
                    if ($($('#sources .entries li')[i]).data('sourceUri') === source.uri) {
                        $($('#sources .entries li')[i]).slideUp(400, removeFunction(this));
                        break;
                    }
                }
            });
        });
    });
    $('#sources').on('click', '.link', function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.open($(this).attr('href'), '_blank');
    });
    $('#sources #addSourceForm').on('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#addSourceUrlInput')[0].checkValidity()) {
            POD.storage.readSource($('#addSourceUrlInput').val(), function (source) {
                POD.web.downloadSource(source);
            });
        }
    });
    document.addEventListener('writeSource', function (event) {
        var i, source, sourceUI;
        source = event.detail.source;
        sourceUI = UI.renderSource(source);
        for (i = 0; i < $('#sources').find('.entries li').length; i++) {
            if ($($('#sources').find('.entries li')[i]).data('sourceUri') === source.uri) {
                $($('#sources').find('.entries li')[i]).slideUp().html(sourceUI.html()).slideDown();
                return;
            }
        }
        //show source if not listed before
        sourceUI.hide();
        $('#sources').find('.entries').append(sourceUI);
        sourceUI.fadeIn();
    }, false);
    //Configuration UI Events
    $('#configuration #memorySizeForm').on('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#memorySizeInput')[0].checkValidity()) {
            POD.storage.fileSystemStorage.requestFileSystemQuota($('#memorySizeInput').val() * 1024 * 1024);
        } else {
            UI.logHandler('Please insert a number', 'error');
        }
    });
    $('#configuration #proxyForm').on('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#httpProxyInput')[0].checkValidity()) {
            localStorage.setItem("configuration.proxyUrl", $('#httpProxyInput').val());
        } else {
            UI.logHandler('Please insert a URL', 'error');
        }
    });
    $('#configuration #exportConfiguration').on('click', function () {
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
    $('#configuration #importConfiguration').on('click', function () {
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
    $('#statusbar').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).parent().toggleClass('fullscreen');
    });
    window.addEventListener('online',  function () {
        UI.logHandler("Online now", 'info');
        $('#updatePlaylist, .updateSource, .downloadFile').removeAttr('disabled');
    }, false);
    window.addEventListener('offline', function () {
        UI.logHandler("Offline now", 'info');
        $('#updatePlaylist, .updateSource, .downloadFile').attr('disabled', 'disabled');
    }, false);
    //Quota and Filesystem initialisation
    if (POD.storage.fileStorageEngine() === POD.storage.fileSystemStorage) {
        $('#memorySizeForm').show();
        quota = localStorage.getItem("configuration.quota");
        if (!quota) { quota = 1024 * 1024 * 200; }
        POD.storage.fileSystemStorage.requestFileSystemQuota(quota);
    } else {
        $('#memorySizeForm').hide();
    }
    //Render lists and settings
    UI.renderConfiguration();
    POD.storage.readSources(function (sources) {
        UI.renderSourceList(sources);
        POD.storage.readPlaylist(false, UI.renderPlaylist);
        if (!navigator.onLine) {
            $('#updatePlaylist, .updateSource, .downloadFile').attr('disabled', 'disabled');
        }
        //Initialise player
        UI.getLastPlayedEpisode(playEpisode);
    });
});
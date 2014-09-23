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
/*global localStorage */
/*global $ */
/*global POD */
/*global GlobalUserInterfaceHelper, UI */
GlobalUserInterfaceHelper.findEpisodeUI = function (episode) {
    "use strict";
    var episodeUI;
    $('#playlist .entries li').each(function () {
        if ($(this).data('episodeUri') === episode.uri) {
            episodeUI = this;
            return false;
        }
    });
    return episodeUI;
};
GlobalUserInterfaceHelper.actualiseEpisodeUI = function (episode) {
    "use strict";
    var episodeUI;
    episodeUI = GlobalUserInterfaceHelper.findEpisodeUI(episode);
    // Status
    if (episode.playback.played) {
        $(episodeUI).find('.status').text("Status: played");
    } else {
        $(episodeUI).find('.status').text("Status: new");
    }
    // Download/Delete link
    if (POD.storage.isFileStorageAvailable() && episode.mediaUrl) {
        if (episode.offlineMediaUrl) {
            $(episodeUI).find('.downloadFile').replaceWith('<button type="button" class="delete" href="' + episode.mediaUrl + '">Delete</button>');
        } else {
            $(episodeUI).find('.delete').replaceWith('<a class="download button" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf('/') + 1) + '">Download</a>');
        }
    } else {
        $(episodeUI).find('.functions .downloadFile').remove();
    }
    $(episodeUI).find('progress').remove();
    return false;
};
GlobalUserInterfaceHelper.renderEpisode = function (episode) {
    "use strict";
    var entryUI;
    entryUI = $($('#episodeTemplate li')[0].cloneNode(true));
    //entryUI = $('<li>');
    entryUI.data('episodeUri', episode.uri);
    entryUI.find('h3.title a').attr('href', episode.uri).text(episode.title);
    //entryUI.append('<h3 class="title"><a href="' + episode.uri + '">' + episode.title + '</a></h3>');
    entryUI.find('span.source').text(episode.source);
    //entryUI.append('<span class="source">' + episode.source + '</span>');
    entryUI.find('time.updated').attr('datetime', episode.updated.toISOString()).text(episode.updated.toLocaleDateString() + " " + episode.updated.toLocaleTimeString());
    //entryUI.append('<time datetime="' + episode.updated.toISOString() + '" class="updated">' + episode.updated.toLocaleDateString() + " " + episode.updated.toLocaleTimeString() + '</time>');
    //entryFunctionsUI = $('<span class="functions">');
    if (episode.playback.played) {
        entryUI.find('.functions button.status').text("Status: played");
        //entryFunctionsUI.append('<button type="button" class="status">Status: played</button>');
    } else {
        entryUI.find('.functions button.status').text("Status: new");
        //entryFunctionsUI.append('<button type="button" class="status">Status: new</button>');
    }
    entryUI.find('.functions a.origin').attr('href', episode.uri);
    //entryFunctionsUI.append('<a class="origin button" href="' + episode.uri + '">Internet</a>');
    if (POD.storage.isFileStorageAvailable() && episode.mediaUrl) {
        if (episode.isFileSavedOffline) {
            entryUI.find('.functions .downloadFile').replaceWith('<button type="button" class="delete" href="' + episode.mediaUrl + '">Delete</button>');
            //entryFunctionsUI.append('<button type="button" class="delete" href="' + episode.mediaUrl + '">Delete</button>');
        } else if (episode.mediaUrl) {
            entryUI.find('.functions .downloadFile').attr('href', episode.mediaUrl).attr('download', episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf('/') + 1));
            //entryFunctionsUI.append('<a class="button downloadFile" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf()) + '">Download</a>');
        }
    } else {
        entryUI.find('.functions .downloadFile').remove();
    }
    //entryUI.append(entryFunctionsUI);
    return entryUI;
};
GlobalUserInterfaceHelper.renderPlaylist = function (playlist) {
    "use strict";
    var playlistUI, entryUI, i;
    playlistUI = $('#playlist .entries');
    playlistUI.empty();
    if (playlist && playlist.length > 0) {
        for (i = 0; i < playlist.length; i++) {
            entryUI = GlobalUserInterfaceHelper.renderEpisode(playlist[i]);
            playlistUI.append(entryUI);
        }
    } else {
        entryUI = $('<li class="emptyPlaceholder">no entries</li>');
        playlistUI.append(entryUI);
    }
};
GlobalUserInterfaceHelper.renderSource = function (source) {
    "use strict";
    var entryUI;
    entryUI = $($('#sourceTemplate li')[0].cloneNode(true));
    //entryUI = $('<li>');
    entryUI.data('sourceUri', source.uri);
    entryUI.find('h3.title').text(source.title);
    //entryUI.append('<h3 class="title">' + source.title + '<h3>');
    entryUI.find('p.description').text(source.description);
    //entryUI.append('<p class="description">' + source.description + '</p>');
    entryUI.find('p.uri a').attr('href', source.uri).text(source.uri);
    //entryUI.append('<p class="uri"><a href="' + source.uri + '">' + source.uri + '</a></p>');
    //entryFunctionsUI = $('<span class="functions">');
    entryUI.find('.functions a.link').attr('href', source.link);
    //entryFunctionsUI.append('<a class="link button" href="' + source.link + '">Internet</a> ');
    entryUI.find('.functions button.updateSource').attr('href', source.uri);
    //entryFunctionsUI.append('<button type="button" class="updateSource" href="' + source.uri + '">Update</button> ');
    entryUI.find('.functions button.deleteSource').attr('href', 'source.uri');
    //entryFunctionsUI.append('<button type="button" class="deleteSource" href="' + source.uri + '">Delete</button>');
    //entryUI.append(entryFunctionsUI);
    return entryUI;
};
GlobalUserInterfaceHelper.renderSourceList = function (sourcelist) {
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
        entryUI = $('<li class="emptyPlaceholder">no entries</li>');
        sourcelistUI.append(entryUI);
    }
};
GlobalUserInterfaceHelper.activeEpisode = function (onReadCallback) {
    "use strict";
    var activeEpisode = $('#playlist').find('.activeEpisode');
    POD.storage.readEpisode(activeEpisode.data('episodeUri'), onReadCallback);
};
GlobalUserInterfaceHelper.previousEpisode = function (onReadCallback) {
    "use strict";
    var activeEpisode = $('#playlist').find('.activeEpisode');
    POD.storage.readEpisode(activeEpisode.prev().data('episodeUri'), onReadCallback);
};
GlobalUserInterfaceHelper.nextEpisode = function (onReadCallback) {
    "use strict";
    var activeEpisode = $('#playlist').find('.activeEpisode');
    POD.storage.readEpisode(activeEpisode.next().data('episodeUri'), onReadCallback);
};
GlobalUserInterfaceHelper.getLastPlayedEpisode = function (onReadCallback) {
    "use strict";
    var lastPlayedEpisode, i;
    lastPlayedEpisode = $('#playlist li:first-child').data('episodeUri');
    POD.storage.readPlaylist(false, function (playlist) {
        if (playlist && playlist.length > 0) {
            for (i = 0; i < playlist.length; i++) {
                if (playlist[i].uri === UI.settings.get('lastPlayed')) {
                    lastPlayedEpisode = playlist[i].uri;
                    break;
                }
            }
        }
        POD.storage.readEpisode(lastPlayedEpisode, onReadCallback);
    });
};
GlobalUserInterfaceHelper.progressHandler = function (progressEvent, prefix, episode) {
    "use strict"; //xmlHttpRequestProgressEvent
    var progressbar, percentComplete, episodeUI;
    episodeUI = GlobalUserInterfaceHelper.findEpisodeUI(episode);
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
};

/** Functions for playback */
GlobalUserInterfaceHelper.activateEpisode = function (episode, onActivatedCallback) {
    "use strict";
    var mediaUrl, audioTag, mp3SourceTag;
    $('#player audio').off('timeupdate');
    GlobalUserInterfaceHelper.logHandler("Timeupdate off", 'debug:playback');
    if (episode) {
        POD.storage.openFile(episode, function (episode) {
            if (episode.offlineMediaUrl) {
                mediaUrl =  episode.offlineMediaUrl;
            } else {
                mediaUrl = episode.mediaUrl;
            }
            if ($('#player audio').length > 0) {
                audioTag = $('#player audio')[0];
                $(audioTag).off();
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
            }
            //Bind or rebind event handler for the audio element
            $('#player audio').on('loadstart', function () {
                GlobalUserInterfaceHelper.logHandler("==============================================", 'debug');
                GlobalUserInterfaceHelper.activeEpisode(function (episode) { GlobalUserInterfaceHelper.logHandler("Start loading " + episode.title, 'debug:playback'); });
            });
            $('#player audio').on('loadedmetadata', function () {
                GlobalUserInterfaceHelper.activeEpisode(function (episode) { GlobalUserInterfaceHelper.logHandler("Load metadata of " + episode.title, 'debug:playback'); });
            });
            $('#player audio').on('canplay', function () {
                GlobalUserInterfaceHelper.activeEpisode(function (episode) { GlobalUserInterfaceHelper.logHandler(episode.title + " is ready to play", 'debug:playback'); });
            });
            $('#player audio').on('canplaythrough', function () {
                GlobalUserInterfaceHelper.activeEpisode(function (episode) { GlobalUserInterfaceHelper.logHandler(episode.title + " is realy ready to play (\"canplaythrough\")", 'debug:playback'); });
            });
            $('#player audio').on('playing', function (event) {
                var audioElement = event.target;
                GlobalUserInterfaceHelper.activeEpisode(function (episode) {
                    GlobalUserInterfaceHelper.logHandler(episode.title + " is playing", 'info:playback');
                    audioElement.autoplay = true;
                });
            });
            $('#player audio').on('ended', function () {
                GlobalUserInterfaceHelper.activeEpisode(function (episode) {
                    GlobalUserInterfaceHelper.logHandler(episode.title + " is ended", 'debug:playback');
                    POD.toggleEpisodeStatus(episode);
                    //Plays next Episode in Playlist
                    GlobalUserInterfaceHelper.nextEpisode(GlobalUserInterfaceHelper.playEpisode);
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
                GlobalUserInterfaceHelper.logHandler(errormessage, 'error:playback');
                GlobalUserInterfaceHelper.nextEpisode(GlobalUserInterfaceHelper.playEpisode);
            });
            $('#player audio').on('durationchange', function (event) {
                var audioElement = event.target;
                GlobalUserInterfaceHelper.activeEpisode(function (episode) {
                    GlobalUserInterfaceHelper.logHandler("Duration of " + episode.title + " is changed to " + UI.formatTimeCode(event.currentTarget.duration) + ".", 'debug:playback');
                    if (episode && audioElement.duration > episode.playback.currentTime) { //&& audioElement.currentTime <= episode.playback.currentTime) {
                        $(audioElement).off('durationchange');
                        GlobalUserInterfaceHelper.logHandler("CurrentTime will set to " + UI.formatTimeCode(episode.playback.currentTime) + " seconds", 'debug');
                        audioElement.currentTime = episode.playback.currentTime;
                        $(audioElement).on('timeupdate', function (event) {
                            if (episode && (event.target.currentTime > (episode.playback.currentTime + 10) || event.target.currentTime < (episode.playback.currentTime - 10))) {
                                episode.playback.currentTime = Math.floor(event.target.currentTime / 10) * 10;
                                POD.storage.writeEpisode(episode);
                                GlobalUserInterfaceHelper.logHandler('Current timecode is ' + UI.formatTimeCode(episode.playback.currentTime) + '.', 'debug');
                            }
                        });
                        GlobalUserInterfaceHelper.logHandler("Timeupdate on", 'debug');
                    }
                });
            });
            //Styling
            $('#playlist').find('.activeEpisode').removeClass('activeEpisode');
            $('#playlist li').filter(function () { return $(this).data('episodeUri') === episode.uri; }).addClass('activeEpisode');
            if (onActivatedCallback && typeof onActivatedCallback === 'function') {
                onActivatedCallback(episode);
            }
        });
    }
};
GlobalUserInterfaceHelper.playEpisode = function (episode, onPlaybackStartedCallback) {
    "use strict";
    if (episode) {
        GlobalUserInterfaceHelper.activateEpisode(episode, function (episode) {
            UI.settings.set('lastPlayed', episode.uri);
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
    var k, quota, multiMediaKeyDownTimestemp;
    POD.settings.uiLogger = UI.logHandler;
    POD.web.settings.proxyUrlPattern = UI.settings.get("proxyUrl");
    //Update local storage to actual version of key-names (changed "track" to "episode"; changed "configuration" to "settings")
    for (k = 0; k < localStorage.length; k++) {
        if (localStorage.key(k).slice(0, 6) === 'track.') {
            localStorage.setItem(localStorage.key(k).replace('track.', 'episode.'), localStorage.getItem(localStorage.key(k)));
            localStorage.removeItem(localStorage.key(k));
        } else if (localStorage.key(k).slice(0, 14) === 'configuration.') {
            localStorage.setItem(localStorage.key(k).replace('configuration.', 'settings.'), localStorage.getItem(localStorage.key(k)));
            localStorage.removeItem(localStorage.key(k));
        }
    }
    //Application Cache Events
    UI.initApplicationCacheEvents();
    //Player UI Events
    $('#player #playPreviousEpisode').on('click', function () {
        UI.previousEpisode(UI.playEpisode);
    });
    $('#player #playNextEpisode').on('click', function () {
        UI.nextEpisode(UI.playEpisode);
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
                UI.nextEpisode(UI.playEpisode);
            } else {
                if ($('#player audio').length && $('#player audio')[0].playbackRate !== 1) {
                    $('#player audio')[0].playbackRate = 1;
                }
            }
        } else if (event.key === 'MediaPreviousTrack' || event.keyCode === 177) {
            if ($('#player audio').length && $('#player audio')[0].currentTime >= 10) {
                $('#player audio')[0].currentTime = 0;
            } else {
                UI.previousEpisode(UI.playEpisode);
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
        POD.storage.readEpisode($(this).data('episodeUri'), UI.playEpisode);
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
    UI.initGeneralUIEvents();
    UI.initConnectionStateEvents();
    //Quota and Filesystem initialisation
    if (POD.storage.fileStorageEngine() === POD.storage.fileSystemStorage) {
        quota = UI.settings.get("quota");
        if (!quota) { quota = 1024 * 1024 * 200; }
        POD.storage.fileSystemStorage.requestFileSystemQuota(quota, function (usage, quota) {
            GlobalUserInterfaceHelper.logHandler("Usage: " + usage + " MiB of " + quota + 'MiB File Storage', 'info');
            UI.settings.set("quota", quota);
        });
    }
    //Render lists
    POD.storage.readSources(function (sources) {
        UI.renderSourceList(sources);
        POD.storage.readPlaylist(false, UI.renderPlaylist);
        if (!navigator.onLine) {
            $('#updatePlaylist, .updateSource, .downloadFile').attr('disabled', 'disabled');
        }
        //Initialise player
        UI.getLastPlayedEpisode(UI.playEpisode);
    });
});
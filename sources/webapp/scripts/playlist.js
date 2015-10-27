/*  Copyright 2013 - 2015 Sebastian Spautz

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
/*global navigator, window, document */
/*global console, localStorage, HTMLMediaElement, Notification */
/*global $ */
/*global POD, HTML5Podcatcher */
/*global GlobalUserInterfaceHelper, UI */
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
GlobalUserInterfaceHelper.activeEpisode = function (onReadCallback) {
    "use strict";
    var activeEpisode = $('#playlist').find('.active');
    POD.storage.readEpisode(activeEpisode.data('episodeUri'), onReadCallback);
};
GlobalUserInterfaceHelper.previousEpisode = function (onReadCallback) {
    "use strict";
    var activeEpisode = $('#playlist').find('.active');
    POD.storage.readEpisode(activeEpisode.prevAll(':not([aria-disabled="true"])').not('.news').first().data('episodeUri'), onReadCallback);
};
GlobalUserInterfaceHelper.nextEpisode = function (onReadCallback) {
    "use strict";
    var activeEpisode = $('#playlist').find('.active');
    POD.storage.readEpisode(activeEpisode.nextAll(':not([aria-disabled="true"])').not('.news').first().data('episodeUri'), onReadCallback);
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
/** Audio Element */
GlobalUserInterfaceHelper.GenerateAudioElement = function () {
    "use strict";
    POD.logger("Audio element will be created", 'debug');
    var mediaElement;
    mediaElement = document.createElement("audio");
    mediaElement.setAttribute('controls', 'controls');
    mediaElement.setAttribute('preload', 'metadata');
    mediaElement.appendChild(document.createElement("source"));
    if (window.navigator.mozApps) {
        //if app started in Firefox OS Runtime...    
        mediaElement.setAttribute('mozaudiochannel', 'content');
        POD.logger("Activate content audio channel", 'debug');
        //Handling interruptions by heigher audio channels
        mediaElement.addEventListener('mozinterruptbegin', function () {
            POD.logger("Playback is interrupted", 'info');
        });
        mediaElement.addEventListener('mozinterruptend', function () {
            POD.logger("Playback is resumed", 'info');
        });
        if (navigator.mozAudioChannelManager) {
            //Set Volumn Control of device to "content" audio channel
            navigator.mozAudioChannelManager.volumeControlChannel = 'content';
            //Handling connection/disconnection of headphones
            navigator.mozAudioChannelManager.onheadphoneschange = function () {
                if (navigator.mozAudioChannelManager.headphones === true) {
                    POD.logger('Headphones plugged in!', 'debug');
                    if (mediaElement.autoplay === true) {
                        mediaElement.play();
                    }
                } else {
                    POD.logger('Headphones unplugged!', 'debug');
                    mediaElement.pause();
                }
            };
        }
    }
    return mediaElement;
};
/** Functions for playback */
GlobalUserInterfaceHelper.activateEpisode = function (episode, onActivatedCallback) {
    "use strict";
    var mediaUrl, mediaType, audioTag;
    $('#player audio').off('timeupdate');
    HTML5Podcatcher.logger("Timeupdate off", 'debug', 'playback');
    if (episode) {
        POD.storage.openFile(episode, function (episode) {
            if (episode.offlineMediaUrl) {
                mediaUrl =  episode.offlineMediaUrl;
            } else {
                mediaUrl = episode.mediaUrl;
            }
            if (mediaUrl) {
                if (episode.mediaType) {
                    mediaType = episode.mediaType;
                } else {
                    //the most audio files in the internet I have ever seen are MP3-Files, so I expect the media type of 'audio/mpeg' when nothing else is set.
                    mediaType = "audio/mpeg";
                }
                //Add media fragment to playback URI
                mediaUrl = mediaUrl + "#t=" + episode.playback.currentTime;
                if ($('#player audio').length > 0) {
                    audioTag = $('#player audio')[0];
                    $(audioTag).off();
                    $(audioTag).find('source').off();
                    $(audioTag).find('source').attr('type', mediaType).attr('src', mediaUrl);
                    $(audioTag).attr('title', episode.title);
                } else {
                    $('#mediacontrol > p').remove();
                    audioTag = $(UI.GenerateAudioElement());
                    audioTag.find('source').attr('type', mediaType).attr('src', mediaUrl);
                    audioTag.attr('title', episode.title);
                    $('#mediacontrol').prepend(audioTag);
                }
                //Bind or rebind event handler for the audio element
                $('#player audio').on('loadstart', function () {
                    HTML5Podcatcher.logger("==============================================", 'debug');
                    GlobalUserInterfaceHelper.activeEpisode(function (episode) { HTML5Podcatcher.logger("Start loading " + episode.title, 'debug', 'playback'); });
                });
                $('#player audio').on('loadedmetadata', function () {
                    GlobalUserInterfaceHelper.activeEpisode(function (episode) { HTML5Podcatcher.logger("Load metadata of " + episode.title, 'debug', 'playback'); });
                });
                $('#player audio').on('canplay', function () {
                    GlobalUserInterfaceHelper.activeEpisode(function (episode) { HTML5Podcatcher.logger(episode.title + " is ready to play", 'debug', 'playback'); });
                });
                $('#player audio').on('canplaythrough', function () {
                    GlobalUserInterfaceHelper.activeEpisode(function (episode) { HTML5Podcatcher.logger(episode.title + " is realy ready to play (\"canplaythrough\")", 'debug', 'playback'); });
                });
                $('#player audio').on('playing', function (event) {
                    var audioElement = event.target;
                    $('#playPause').data('icon', 'pause');
                    $('#playPause').attr('data-icon', 'pause');
                    GlobalUserInterfaceHelper.activeEpisode(function (episode) {
                        HTML5Podcatcher.logger(episode.title + " is playing", 'note', 'playback');
                        audioElement.autoplay = true;
                    });
                });
                $('#player audio').on('pause', function () {
                    $('#playPause').data('icon', 'play');
                    $('#playPause').attr('data-icon', 'play');
                });
                $('#player audio').on('ended', function () {
                    GlobalUserInterfaceHelper.activeEpisode(function (episode) {
                        HTML5Podcatcher.logger(episode.title + " is ended", 'debug', 'playback');
                        POD.toggleEpisodeStatus(episode);
                        //Plays next Episode in Playlist
                        GlobalUserInterfaceHelper.nextEpisode(GlobalUserInterfaceHelper.playEpisode);
                    });
                });
                $('#player audio, #player audio source').on('error', function (event) {
                    var errormessage, readystate, networkstate;
                    if (!event || !event.target || !$(event.target).parent()[0] || !$(event.target).parent()[0].readyState) {
                        //no valid state - Firefox 41 throws this error after page navigation. Why?
                        return;
                    }
                    readystate = $(event.target).parent()[0].readyState;
                    networkstate = $(event.target).parent()[0].networkState;
                    errormessage = 'Error on playback of audio file. Networkstate: ' + networkstate + "; ReadyState: " + readystate;
                    if (networkstate === HTMLMediaElement.NETWORK_NO_SOURCE) {
                        errormessage = "There is no valid source for " + episode.title + ". See " + episode.mediaUrl + " of type " + episode.mediaType;
                    } else if (readystate === HTMLMediaElement.HAVE_NOTHING) {
                        errormessage = "Can't load file " + $(event.target).parent()[0].currentSrc;
                    } else if ($(this).parent()[0].error) {
                        switch (event.target.error.code) {
                        case event.target.error.MEDIA_ERR_ABORTED:
                            errormessage = 'You aborted the media playback.';
                            break;
                        case event.target.error.MEDIA_ERR_NETWORK:
                            errormessage = 'A network error caused the audio download to fail.';
                            break;
                        case event.target.error.MEDIA_ERR_DECODE:
                            errormessage = 'The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.';
                            break;
                        case event.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            errormessage = 'The video audio not be loaded, either because the server or network failed or because the format is not supported.';
                            break;
                        default:
                            errormessage = 'An unknown error occurred.';
                            break;
                        }
                    }
                    $('#playPause').data('icon', 'play');
                    $('#playPause').attr('data-icon', 'play');
                    HTML5Podcatcher.logger(errormessage, 'error', 'playback');
                    GlobalUserInterfaceHelper.nextEpisode(GlobalUserInterfaceHelper.playEpisode);
                });
                $('#player audio').on('durationchange', function (event) {
                    var percentPlayed, episodeUI, audioElement = event.target;
                    GlobalUserInterfaceHelper.activeEpisode(function (episode) {
                        HTML5Podcatcher.logger("Duration of " + episode.title + " is changed to " + UI.formatTimeCode(event.currentTarget.duration) + ".", 'debug', 'playback');
                        if (episode && audioElement.duration > episode.playback.currentTime) {
                            $(audioElement).off('durationchange');
                            if (audioElement.currentTime <= episode.playback.currentTime) {
                                HTML5Podcatcher.logger("CurrentTime will set to " + UI.formatTimeCode(episode.playback.currentTime) + " seconds", 'debug');
                                audioElement.currentTime = episode.playback.currentTime;
                            }
                            $(audioElement).on('timeupdate', function (event) {
                                if (episode && (event.target.currentTime > (episode.playback.currentTime + 10) || event.target.currentTime < (episode.playback.currentTime - 10))) {
                                    episode.playback.currentTime = Math.floor(event.target.currentTime / 10) * 10;
                                    POD.storage.writeEpisode(episode);
                                    HTML5Podcatcher.logger('Current timecode is ' + UI.formatTimeCode(episode.playback.currentTime) + '.', 'debug');
                                }
                                if (episode && (event.target.currentTime > (episode.playback.currentTime + 2) || event.target.currentTime < (episode.playback.currentTime - 2))) {
                                    //Show Progress as background Gradient of Episode-UI
                                    episodeUI = GlobalUserInterfaceHelper.findEpisodeUI(episode);
                                    percentPlayed = event.target.currentTime / audioElement.duration;
                                    $(episodeUI).attr('style', 'background: linear-gradient(to right, rgba(0, 100, 0, 0.2) 0%,rgba(0, 100, 0, 0.2) ' + (percentPlayed * 100).toFixed(2) + '%, #ffffff ' + (percentPlayed * 100).toFixed(2) + '%);');
                                }
                            });
                            HTML5Podcatcher.logger("Timeupdate on", 'debug');
                        }
                    });
                });
                //Styling
                $('#playlist').find('.active').removeClass('active');
                $('#playlist li').filter(function () { return $(this).data('episodeUri') === episode.uri; }).addClass('active');
                if (onActivatedCallback && typeof onActivatedCallback === 'function') {
                    onActivatedCallback(episode);
                }
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
GlobalUserInterfaceHelper.playPrevious = function () {
    "use strict";
    var audioTag = $('#player audio')[0];
    audioTag.pause();
    UI.activeEpisode(function (episode) {
        var i, currentTime, jumppoint = {};
        currentTime = audioTag.currentTime;
        jumppoint.time = 0;
        if (episode.jumppoints) {
            for (i = 0; i < episode.jumppoints.length; i++) {
                if (episode.jumppoints[i].time < currentTime && episode.jumppoints[i].time > jumppoint.time) {
                    jumppoint = episode.jumppoints[i];
                }
            }
        }
        if (jumppoint.time > 1) {
            audioTag.currentTime = jumppoint.time - 1;
            audioTag.play();
        } else if (currentTime > 10) {
            audioTag.currentTime = 0;
            audioTag.play();
        } else {
            UI.previousEpisode(UI.playEpisode);
        }
    });
};
GlobalUserInterfaceHelper.playNext = function () {
    "use strict";
    var audioTag = $('#player audio')[0];
    audioTag.pause();
    UI.activeEpisode(function (episode) {
        var i, currentTime, jumppoint = {};
        currentTime = audioTag.currentTime;
        jumppoint.time = audioTag.duration;
        if (episode.jumppoints) {
            for (i = 0; i < episode.jumppoints.length; i++) {
                if (episode.jumppoints[i].time > currentTime && episode.jumppoints[i].time < jumppoint.time) {
                    jumppoint = episode.jumppoints[i];
                }
            }
        }
        if (jumppoint.time < audioTag.duration) {
            audioTag.currentTime = jumppoint.time;
            audioTag.play();
        } else {
            UI.nextEpisode(UI.playEpisode);
        }
    });
};
GlobalUserInterfaceHelper.togglePauseStatus = function () {
    "use strict";
    var audioTag = $('#player audio')[0];
    if (audioTag) {
        if (audioTag.paused) {
            audioTag.play();
            $('#playPause').data('icon', 'pause');
            $('#playPause').attr('data-icon', 'pause');
        } else {
            audioTag.pause();
            $('#playPause').data('icon', 'play');
            $('#playPause').attr('data-icon', 'play');
        }
    }
};

/** Central 'ready' event handler */
$(document).ready(function () {
    "use strict";
    var k, multiMediaKeyDownTimestemp, stoppedPressMouse;
    //Application Cache Events
    UI.initApplicationCacheEvents();
    //Configurate POD
    POD.logger("Open Playlist", "debug");
    POD.web.settings.proxyUrlPattern = UI.settings.get("proxyUrl");
    // --------------------- //
    // -- Database Update -- //
    // --------------------- //
    // -- Update local storage to actual version of key-names (changed "track" to "episode"; changed "configuration" to "settings")
    for (k = 0; k < localStorage.length; k++) {
        if (localStorage.key(k).slice(0, 6) === 'track.') {
            localStorage.setItem(localStorage.key(k).replace('track.', 'episode.'), localStorage.getItem(localStorage.key(k)));
            localStorage.removeItem(localStorage.key(k));
        } else if (localStorage.key(k).slice(0, 14) === 'configuration.') {
            localStorage.setItem(localStorage.key(k).replace('configuration.', 'settings.'), localStorage.getItem(localStorage.key(k)));
            localStorage.removeItem(localStorage.key(k));
        }
    }
    // -------------------------- //
    // -- Check Pre Conditions -- //
    // -------------------------- //
    UI.preConditionCheck(function (preConditionCheckResult) {
        if (preConditionCheckResult === 'missing proxy') {
            window.location.href = 'settings.html';
        } else if (preConditionCheckResult === 'missing sources') {
            window.location.href = 'sources.html';
        }
    });
    // ------------------- //
    // -- Initialise UI -- //
    // ------------------- //
    //Quota and Filesystem initialisation
    HTML5Podcatcher.api.storage.StorageProvider.init({quota: UI.settings.get("quota")});
    // if (POD.storage.fileStorageEngine() === POD.storage.fileSystemStorage) {
      // quota = UI.settings.get("quota");
      // if (!quota) { quota = 1024 * 1024 * 200; }
      // POD.storage.fileSystemStorage.requestFileSystemQuota(quota, function (usage, quota) {
            // HTML5Podcatcher.logger("Usage: " + usage + " MiB of " + quota + 'MiB File Storage', 'info');
            // UI.settings.set("quota", quota);
      // });
    // }
    //Render playlist
    POD.storage.readPlaylist(false, function (episodes) {
        UI.renderEpisodeList(episodes, UI.settings.get("playlistSort"));
    });
    //Initialise player
    UI.getLastPlayedEpisode(UI.playEpisode);
    // --------------------------- //
    // -- Register Eventhandler -- //
    // --------------------------- //
    //Player UI Events
    $('#playPause').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        GlobalUserInterfaceHelper.togglePauseStatus();
    });
    $('#playPrevious').on('click', function () {
        UI.playPrevious();
    });
    $('#playNext').on('click', function () {
        UI.playNext();
    });
    $('#jumpBackwards').on('click', function () {
        var audioTag = $('#player audio')[0];
        audioTag.currentTime = Math.max(0, audioTag.currentTime - 10);
    });
    document.getElementById('jumpForwards').addEventListener("mousedown", function () {
        stoppedPressMouse = false;
        window.setTimeout(function () {
            if (stoppedPressMouse === false) {
                $('#player audio')[0].playbackRate = 2;
            }
            POD.logger("Playback speed " + $('#player audio')[0].playbackRate, "debug");
        }, 500);
    }, false);
    document.getElementById('jumpForwards').addEventListener("mouseup", function () {
        var audioTag = $('#player audio')[0];
        if (audioTag.playbackRate === 1) { //skip 10 seconds
            audioTag.currentTime = Math.min(audioTag.duration, audioTag.currentTime + 10);
        } else { //come back from fast forward
            audioTag.playbackRate = 1;
        }
        stoppedPressMouse = true;
    }, false);
    $(document).on('keydown', function (event) {
        if (event.key === 'MediaNextTrack' || event.key === 'MediaTrackNext' || event.keyCode === 176) {
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
        if (event.key === 'MediaNextTrack' || event.key === 'MediaTrackNext' || event.keyCode === 176) {
            var now = new Date();
            if (now - multiMediaKeyDownTimestemp < 1000) { //Play next Track when key is pressed short (< 1000 miliseconds)
                UI.playNext();
            } else { //Stop fast forward when release the key
                if ($('#player audio').length && $('#player audio')[0].playbackRate !== 1) {
                    $('#player audio')[0].playbackRate = 1;
                }
            }
        } else if (event.key === 'MediaPreviousTrack' || event.key === 'MediaTrackPrevious' || event.keyCode === 177) {
            UI.playPrevious();
        } else if (event.key === 'MediaPlayPause' || event.key === 'MediaPlay' || event.keyCode === 179) {
            GlobalUserInterfaceHelper.togglePauseStatus();
        } else if (event.key === 'MediaStop' || event.keyCode === 178) {
            if ($('#player audio').length) {
                $('#player audio')[0].pause();
                $('#playPause').data('icon', 'play');
                $('#playPause').attr('data-icon', 'play');
            }
        }
        multiMediaKeyDownTimestemp = undefined;
    });

    //Playlist UI Events
    $('#playlist').on('click', 'li .link', function (event) {
        event.preventDefault();
        event.stopPropagation();
        //Read episode from storage an then start playback
        POD.storage.readEpisode($(this).parent('li').data('episodeUri'), UI.playEpisode);
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
    $('#refreshPlaylist').on('click', UI.eventHandler.refreshAllSources);
    document.addEventListener('writeEpisode', function (event) {
        var i, episode, episodeUI, order;
        episode = event.detail.episode;
        episodeUI = UI.renderEpisode(episode);
        order = UI.settings.get("playlistSort");
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
            if (order && order === 'asc') {
                $('#playlist').find('.entries').append(episodeUI);
            } else {
                $('#playlist').find('.entries').prepend(episodeUI);
            }
            episodeUI.fadeIn();
        }
    }, false);
    UI.initGeneralUIEvents();
    //Disable online functions when device is offline
    if (!navigator.onLine) {
        $('#refreshPlaylist, .update, #showAddSourceView, #updateSource, #openSourceWebsite, .origin, .downloadFile').attr('disabled', 'disabled');
    }
    UI.initConnectionStateEvents();
});
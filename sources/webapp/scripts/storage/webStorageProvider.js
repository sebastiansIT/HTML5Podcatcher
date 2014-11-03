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
/*global window, localStorage */
/*global HTML5Podcatcher */
HTML5Podcatcher.storage.webStorage = {
    cleanStorage: function (onDeleteCallback) {
        "use strict";
        localStorage.clear();
        if (onDeleteCallback && typeof onDeleteCallback === 'function') {
            onDeleteCallback();
        }
    },
    readSource: function (sourceUri, onReadCallback) {
        "use strict";
        var source;
        source = JSON.parse(localStorage.getItem('source.' + sourceUri));
        if (!source) {
            source = { 'uri': sourceUri };
        }
        if (onReadCallback && typeof onReadCallback === 'function') {
            onReadCallback(source);
        }
    },
    /* Get a Array with all Sources from the persistent storage */
    readSources: function (onReadCallback) {
        "use strict";
        var pushFunction, i, sourceArray = [];
        pushFunction = function (source) {
            sourceArray.push(source);
        };
        for (i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).slice(0, 7) === 'source.') {
                this.readSource(localStorage.key(i).substring(7), pushFunction);
            }
        }
        if (onReadCallback && typeof onReadCallback === 'function') {
            onReadCallback(sourceArray);
        }
    },
    writeSource: function (source, onWriteCallback) {
        "use strict";
        localStorage.setItem('source.' + source.uri, JSON.stringify(source));
        if (onWriteCallback && typeof onWriteCallback === 'function') {
            onWriteCallback(source);
        }
    },
    writeSources: function (sources, onWriteCallback) {
        "use strict";
        var i;
        for (i = 0; i < sources.length; i++) {
            this.writeSource(sources[i]);
        }
        if (onWriteCallback && typeof onWriteCallback === 'function') {
            onWriteCallback(sources);
        }
    },
    deleteSource: function (source, onDeleteCallback) {
        "use strict";
        localStorage.removeItem('source.' + source.uri);
        if (onDeleteCallback && typeof onDeleteCallback === 'function') {
            onDeleteCallback(source);
        }
    },
    readEpisode: function (episodeUri, onReadCallback) {
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
        if (onReadCallback && typeof onReadCallback === 'function') {
            onReadCallback(episode);
        }
    },
    readPlaylist: function (showAll, onReadCallback) {
        "use strict";
        if (!showAll) {
            showAll = false;
        }
        var i, filter, playlist = [];
        filter = function (episode) {
            if (episode.playback.played === false || showAll === true) {
                playlist.push(episode);
            }
        };
        for (i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i).slice(0, 8) === 'episode.') {
                this.readEpisode(localStorage.key(i).substring(8), filter);
            }
        }
        playlist.sort(HTML5Podcatcher.sortEpisodes);

        if (onReadCallback && typeof onReadCallback === 'function') {
            onReadCallback(playlist);
        }
    },
    writeEpisode: function (episode, onWriteCallback) {
        "use strict";
        localStorage.setItem('episode.' + episode.uri, JSON.stringify(episode));
        if (onWriteCallback && typeof onWriteCallback === 'function') {
            onWriteCallback(episode);
        }
    },
    writeEpisodes: function (episodes, onWriteCallback) {
        "use strict";
        var i;
        for (i = 0; i < episodes.length; i++) {
            this.writeEpisode(episodes[i]);
        }
        if (onWriteCallback && typeof onWriteCallback === 'function') {
            onWriteCallback(episodes);
        }
    }
};//end WebStorage
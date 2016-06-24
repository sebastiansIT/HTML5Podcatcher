/*  Copyright 2015 Sebastian Spautz

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
/*global HTML5Podcatcher, POD */
/*global GlobalUserInterfaceHelper, UI */

GlobalUserInterfaceHelper.renderSourceDetails = function (source) {
    "use strict";
    var markup = UI.renderSource(source);
    //insert markup in page
    $('#information').empty();
    $('#information').append(markup);
    //set current values in toolbar
    $('#openSourceWebsite').attr('href', source.link);
    //read list of episodes and render them
    POD.storage.readEpisodesBySource(source, function (episodes) {
        UI.renderEpisodeList(episodes, 'desc');
    });
};

/** Central 'ready' event handler */
$(document).ready(function () {
    "use strict";
    var sourceUri;
    //Get source URI from query string
    sourceUri = window.location.search.split('uri=')[1];
    //Get alternativly URI from Local Storage Setting 
    if (!sourceUri) {
        sourceUri = UI.settings.get('ShowDetailsForSource');
    }
    //if query string and Local Storage Settings doesn't contain source uri redirect to sources.html
    if (!sourceUri) {
        window.location.href = 'sources.html';
    }
    POD.logger("Open Source Details", "debug");
    HTML5Podcatcher.api.configuration.proxyUrlPattern = UI.settings.get("proxyUrl");
    // ------------------- //
    // -- Initialise UI -- //
    // ------------------- //
    //Quota and Filesystem initialisation
    HTML5Podcatcher.api.storage.StorageProvider.init({quota: UI.settings.get("quota")});
    //Render Feed Details
    //Load Source and render Markup
    POD.storage.readSource(sourceUri, function (source) {
        UI.renderSourceDetails(source);
    });
    if (!navigator.onLine) {
        $('#updateSource, #openSourceWeb').attr('disabled', 'disabled');
    }
    // --------------------------- //
    // -- Register Eventhandler -- //
    // --------------------------- //
    //Application Cache Events
    UI.initApplicationCacheEvents();
    //Data manipulation events
    // * New or changed source
    document.addEventListener('writeSource', function (event) {
        var source;
        source = event.detail.source;
        UI.renderSourceDetails(source);
    }, false);
    // * New or changes episode
    document.addEventListener('writeEpisode', function (event) {
        var i, episode, episodeUI;
        episode = event.detail.episode;
        episodeUI = UI.renderEpisode(episode);
        //find episode in HTML markup
        for (i = 0; i < $('#episodes').find('.entries li').length; i++) {
            if ($($('#episodes').find('.entries li')[i]).data('episodeUri') === episode.uri) {
                //Actualise episodes markup
                $($('#episodes').find('.entries li')[i]).html(episodeUI.html());
                return;
            }
        }
    }, false);

    //Events in list of episodes
    $('.content').on('click', '.status', function (event) {
        event.preventDefault();
        event.stopPropagation();
        POD.storage.readEpisode($(this).closest('li').data('episodeUri'), function (episode) {
            POD.toggleEpisodeStatus(episode);
        });
    });
    $('.content').on('click', '.downloadFile', UI.eventHandler.downloadEpisodeFile);
    $('.content').on('click', '.delete', function (event) {
        event.preventDefault();
        event.stopPropagation();
        POD.storage.readEpisode($(this).closest('li').data('episodeUri'), function (episode) {
            UI.logHandler('Deleting file "' + episode.offlineMediaUrl + '" starts now', 'info');
            POD.storage.deleteFile(episode);
        });
    });
    //Toolbar events
    $('#deleteSource').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var removeFunction;
        removeFunction = function () { window.location.href = 'sources.html'; };
        POD.storage.readSource(sourceUri, function (source) {
            POD.storage.deleteSource(source, removeFunction);
        });
    });

    $('#updateSource').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var limitOfNewEpisodes = 5, source, button = event.target, progressListener;
        source = {uri: sourceUri};

        button.setAttribute('disabled', 'disabled');
        $(button).addClass('spinner');

        // add Listener for the 'writeSource' event. This event signals the end of the update process.
        progressListener = function (event) {
            event.stopPropagation();
            button.removeAttribute('disabled');
            $(button).removeClass('spinner');
            document.removeEventListener('writeSource', progressListener, false);
        };
        document.addEventListener('writeSource', progressListener, false);

        // start update of the source
        HTML5Podcatcher.web.downloadSource(source, limitOfNewEpisodes)
    });

    UI.initGeneralUIEvents();
    UI.initConnectionStateEvents();
});
/*  Copyright 2014 Sebastian Spautz

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
/*global confirm */
/*global localStorage */
/*global applicationCache */
/*global $ */
/*global POD */
/*global UI */

/** Central 'ready' event handler */
$(document).ready(function () {
    "use strict";
    var quota;
    POD.settings.uiLogger = UI.logHandler;
    //General UI Events
    UI.initGeneralUIEvents();
    //Application Cache Events
    UI.initApplicationCacheEvents();
    //Connection State Events
    UI.initConnectionStateEvents();
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
        //TODO make new width Storage Provider architecture
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
        //TODO make new width Storage Provider architecture
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
    //Quota and Filesystem initialisation
    if (POD.storage.fileStorageEngine() === POD.storage.fileSystemStorage) {
        $('#FileSystemAPI').show();
        quota = localStorage.getItem("configuration.quota");
        if (!quota) { quota = 1024 * 1024 * 200; }
        POD.storage.fileSystemStorage.requestFileSystemQuota(quota);
    } else {
        $('#FileSystemAPI').hide();
    }
    //Render lists and settings
    if (localStorage.getItem("configuration.proxyUrl")) {
        $('#httpProxyInput').val(localStorage.getItem("configuration.proxyUrl"));
    }
});
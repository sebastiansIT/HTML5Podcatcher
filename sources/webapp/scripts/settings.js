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
/*global navigator, window, document */
/*global console, global, alert, confirm */
/*global localStorage, applicationCache */
/*global $ */
/*global POD, UI */
UI.export = function (onExportCallback) {
    "use strict";
    var config, i, key;
    config = {'Episodes': {}, 'Sources': {}, 'Settings': {}};
    for (i = 0; i < localStorage.length; i++) {
        key = localStorage.key(i);
        //Export Local Storage
        if (key.slice(0, 7) === 'source.') {
            config.Sources[key] = localStorage.getItem(key);
        } else if (localStorage.key(i).slice(0, 8) === 'episode.') {
            config.Episodes[key] = localStorage.getItem(key);
        } else if (localStorage.key(i).slice(0, 14) === 'configuration.') {
            config.Settings[localStorage.key(i).slice(14)] = localStorage.getItem(key);
        } else if (localStorage.key(i).slice(0, 9) === 'settings.') {
            config.Settings[localStorage.key(i).slice(9)] = localStorage.getItem(key);
        }
    }
    //Export active storage engine data
    POD.storage.readSources(function (sourceArray) {
        for (i = 0; i < sourceArray.length; i++) {
            config.Sources[sourceArray[i].uri] = sourceArray[i];
        }
        POD.storage.readPlaylist(true, function (episodeArray) {
            for (i = 0; i < episodeArray.length; i++) {
                config.Episodes[episodeArray[i].uri] = episodeArray[i];
            }
            if (onExportCallback && typeof onExportCallback === 'function') {
                onExportCallback(config);
            }
        });
    });
};
UI.import = function (config, onImportCallback) {
    "use strict";
    var property, episodes = [], sources = [];
    for (property in config.Settings) {
        if (config.Settings.hasOwnProperty(property)) {
            UI.settings.set(property, config.Settings[property]);
        }
    }
    for (property in config.Sources) {
        if (config.Sources.hasOwnProperty(property)) {
            sources.push(config.Sources[property]);
        }
    }
    for (property in config.Episodes) {
        if (config.Episodes.hasOwnProperty(property)) {
            episodes.push(config.Episodes[property]);
        }
    }
    POD.storage.writeSources(sources, function () {
        POD.storage.writeEpisodes(episodes, function () {
            if (onImportCallback && typeof onImportCallback === 'function') {
                onImportCallback(config);
            }
        });
    });
};
/** Central 'ready' event handler */
document.addEventListener('DOMContentLoaded', function () {
    "use strict";
    var quota, appInfoRequest;
    POD.settings.uiLogger = UI.logHandler;
    POD.settings.uiLogger("Opens Settings View", "debug");
    // -- Initialise UI -- //
    //Init Proxy-Settings
    if (window.navigator.mozApps) { //is an Open Web App runtime 
        appInfoRequest = window.navigator.mozApps.getSelf();
        appInfoRequest.onsuccess = function () {
            if (appInfoRequest.result) { //checks for installed app
                if (appInfoRequest.result.manifest.type === 'privileged' || appInfoRequest.result.manifest.type === 'certified') {
                    $('#proxy').hide();
                }
            }
        };
    }
    if (UI.settings.get("proxyUrl")) {
        $('#httpProxyInput').val(UI.settings.get("proxyUrl"));
    }
    //Init quota and filesystem
    if (POD.storage.fileStorageEngine() === POD.storage.fileSystemStorage) {
        $('#FileSystemAPI').show();
        quota = UI.settings.get("quota");
        if (!quota) { quota = 1024 * 1024 * 200; }
        POD.storage.fileSystemStorage.requestFileSystemQuota(quota, function (usage, quota) {
            UI.settings.set("quota", quota);
            var quotaConfigurationMarkup;
            quotaConfigurationMarkup = $('#memorySizeInput');
            if (quotaConfigurationMarkup) {
                quotaConfigurationMarkup.val(quota / 1024 / 1024).attr('min', Math.ceil(usage / 1024 / 1024)).css('background', 'linear-gradient( 90deg, rgba(0,100,0,0.45) ' + Math.ceil((usage / quota) * 100) + '%, transparent ' + Math.ceil((usage / quota) * 100) + '%, transparent )');
            }
        });
    } else {
        $('#FileSystemAPI').hide();
    }
    //Init settings for logging
    if (UI.settings.get("logLevel")) {
        $('#logLevelSelect').val(UI.settings.get("logLevel"));
    }
    //Init settings for syncronisation
    if (UI.settings.get("syncronisationEndpoint")) {
        $('#syncEndpoint').val(UI.settings.get("syncronisationEndpoint"));
    }
    if (UI.settings.get("syncronisationKey")) {
        $('#syncKey').val(UI.settings.get("syncronisationKey"));
    }
    //Init configuration for sortint of playlist
    if (UI.settings.get("playlistSort")) {
        $('#episodeSortSelect').val(UI.settings.get("playlistSort"));
    }
    // -------------------------- //
    // -- Check Pre Conditions -- //
    // -------------------------- //
    UI.preConditionCheck(function (preConditionCheckResult) {
        if (preConditionCheckResult === 'missing proxy') {
            UI.logHandler('Please insert the URL of a HTTP proxy (Example: "https://domain.net/proxy.py?url=$url$"). Use $url$ as a placeholder for the URL (feed or file) the proxy should load.', 'warn');
        }
    });
    // -- Register Eventhandler -- //
    //General UI Events
    UI.initGeneralUIEvents();
    //Application Cache Events
    UI.initApplicationCacheEvents();
    //Connection State Events
    UI.initConnectionStateEvents();
    //Configuration UI Events
    $('#memorySizeForm').on('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#memorySizeInput')[0].checkValidity()) {
            POD.storage.fileSystemStorage.requestFileSystemQuota($('#memorySizeInput').val() * 1024 * 1024);
        } else {
            UI.logHandler('Please insert a number', 'error');
        }
    });
    $('#saveProxyConfigurationButton').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#httpProxyInput')[0].checkValidity()) {
            UI.settings.set("proxyUrl", $('#httpProxyInput').val());
        } else {
            UI.logHandler('Please insert a URL!', 'error');
        }
    });
    $('#saveSortConfigurationButton').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        UI.settings.set("playlistSort", $('#episodeSortSelect').val());
    });
    $('#SyncronisationForm').on('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (this.checkValidity()) {
            var form = this;
            UI.settings.set("syncronisationEndpoint", $(this).find('#syncEndpoint').val());
            UI.settings.set("syncronisationKey", $(this).find('#syncKey').val());
            UI.export(function (config) {
                var syncEndpoint, syncKey, syncValue;
                syncEndpoint = $(form).find('#syncEndpoint').val();
                syncKey = $(form).find('#syncKey').val();
                syncValue = encodeURIComponent(JSON.stringify(config));
                POD.web.createXMLHttpRequest(function (xhr) {
                    var params;
                    params = "key=" + syncKey + "&value=" + syncValue;
                    xhr.open('POST', syncEndpoint, true);
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    xhr.setRequestHeader("Content-length", params.length);
                    xhr.onload = function () {
                        POD.logger("Sended syncronisation value succesfuly.", "info");
                    };
                    xhr.ontimeout = function () {
                        POD.logger("Timeout after " + (xhr.timeout / 60000) + " minutes.", "error");
                    };
                    xhr.send(params);
                });
            });
        } else {
            POD.logger('Please insert a URL and a name!', 'error');
        }
    });
    $('#receiveSyncData').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var syncEndpoint, syncKey, syncValue;
        syncEndpoint = $(document.getElementById('syncEndpoint')).val();
        syncKey = $(document.getElementById('syncKey')).val();
        POD.web.createXMLHttpRequest(function (xhr) {
            xhr.open('GET', syncEndpoint + '?key=' + syncKey, true);
            xhr.onload = function () {
                POD.logger("Loaded syncronisation value succesfuly.", "info");
                syncValue = JSON.parse(xhr.responseText);
                POD.logger("Receives " + syncValue.substring(0, 20), "info");
            };
            xhr.ontimeout = function () {
                POD.logger("Timeout after " + (xhr.timeout / 60000) + " minutes.", "error");
            };
            xhr.send();
        });
    });
    $('#exportConfiguration').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var button = this;
        $(button).attr('disabled', 'disabled');
        UI.export(function (config) {
            $(button).parent().find('#SerialisedConfigurationInput').val(JSON.stringify(config));
            //$(button).parent().find('#SerialisedConfigurationInput')[0].select();
            $(button).removeAttr('disabled');
        });
    });
    $('#importConfiguration').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var config, button;
        button = this;
        $(button).attr('disabled', 'disabled');
        config = JSON.parse($(this).parent().find('#SerialisedConfigurationInput').val());
        UI.import(config, function () {
            $(button).removeAttr('disabled');
        });
    });
    $('#saveLogingConfiguration').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        UI.settings.set("logLevel", $('#logLevelSelect').val());
        UI.logHandler('Save loging configuration.', 'debug');
    });
}, false);
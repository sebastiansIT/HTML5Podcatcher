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
UI.exportConfiguration = function (onExportCallback) {
   "use strict";
   POD.api.configuration.readConfiguration(onExportCallback);
};
UI.importConfiguration = function (config, onImportCallback) {
   "use strict";
   POD.api.configuration.overrideConfiguration(config, onImportCallback);
};
   /** Central 'ready' event handler */
document.addEventListener('DOMContentLoaded', function () {
   "use strict";
   var quota, appInfoRequest;
   POD.logger("Opens Settings View", "debug");
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
   if (POD.api.storage.fileSystemAPIStorage !== undefined && POD.api.storage.StorageProvider.fileStorageProvider() instanceof POD.api.storage.fileSystemAPIStorage.FileSystemAPIFileProvider) {
      $('#FileSystemAPI').show();
      quota = UI.settings.get("quota");
      if (!quota) { quota = 1024 * 1024 * 200; }
      POD.api.storage.StorageProvider.fileStorageProvider().requestFileSystemQuota(quota, function (usage, quota) {
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
         POD.api.storage.StorageProvider.fileStorageProvider().requestFileSystemQuota($('#memorySizeInput').val() * 1024 * 1024);
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
         POD.api.configuration.readConfiguration(function (config) {
            var syncEndpoint, syncKey;
            syncEndpoint = $(form).find('#syncEndpoint').val();
            syncKey = $(form).find('#syncKey').val();
            POD.web.createXMLHttpRequest(function (xhr) {
               xhr.open('POST', syncEndpoint, true);
               xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
               xhr.onload = function () {
                  POD.logger("Sended syncronisation value successfully.", "note");
               };
               xhr.addEventListener("error", function (xhrError) {
                  POD.logger("Can't upload configuration to syncronisation endpoint (" + xhrError.error + ")", "error");
               });
               xhr.ontimeout = function () {
                  POD.logger("Timeout after " + (xhr.timeout / 60000) + " minutes.", "error");
               };
               xhr.send(JSON.stringify({key: syncKey, value: config}));
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
            POD.logger("Loaded syncronisation value successfully.", "info");
            syncValue = JSON.parse(xhr.responseText);
            POD.api.configuration.mergeConfigurations(syncValue.entries[0].value, function () {
               POD.logger("Merged syncronisation value into local configuration successfully.", "note");
            });
         };
         xhr.addEventListener("error", function (xhrError) {
            POD.logger("Can't download configuration from syncronisation endpoint (" + xhrError.error + ")", "error");
         });
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
      UI.exportConfiguration(function (config) {
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
      UI.importConfiguration(config, function () {
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
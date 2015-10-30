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
/*global POD */
/*global GlobalUserInterfaceHelper, UI */

/** Central 'ready' event handler */
$(document).ready(function () {
   "use strict";
   POD.logger("Opens Source View", "debug");
   HTML5Podcatcher.api.configuration.proxyUrlPattern = UI.settings.get("proxyUrl");
   // -------------------------- //
   // -- Check Pre Conditions -- //
   // -------------------------- //
   UI.preConditionCheck(function (preConditionCheckResult) {
      if (preConditionCheckResult === 'missing proxy') {
         window.location.href = 'settings.html';
      } else if (preConditionCheckResult === 'missing sources') {
         $('#addSourceView').toggleClass('fullscreen');
      }
   });
   // ------------------- //
   // -- Initialise UI -- //
   // ------------------- //
   POD.storage.readSources(function (sources) {
      UI.renderSourceList(sources);
      if (!navigator.onLine) {
         $('#refreshPlaylist, #showAddSourceView').attr('disabled', 'disabled');
      }
   });
   // --------------------------- //
   // -- Register Eventhandler -- //
   // --------------------------- //
   //Application Cache Events
   UI.initApplicationCacheEvents();
   //Connection State Events
   UI.initConnectionStateEvents();
   $('#sourceslist').on('click', '.details', function (event) {
      event.preventDefault();
      event.stopPropagation();
      UI.settings.set('ShowDetailsForSource', $(this).closest('li').data('sourceUri'));
      window.location.href = 'source.html';
   });
   //Update one Source
   $('#sourceslist').on('click', '.update', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var button = this, progressListener;
      $(button).attr('disabled', 'disabled');
      $(button).addClass('spinner');
      progressListener = function (event) {
         event.stopPropagation();
         $(button).removeAttr('disabled');
         $(button).removeClass('spinner');
         document.removeEventListener('writeSource', progressListener, false);
      };
      document.addEventListener('writeSource', progressListener, false);
      POD.storage.readSource($(this).attr("href"), function (source) {
         POD.web.downloadSource(source);
      });
   });
   //Delete Source from Database
   $('#sourceslist').on('click', '.delete', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var i, removeFunction;
      removeFunction = function (element) { $(element).remove(); };
      POD.storage.readSource($(this).closest('li').data('sourceUri'), function (source) {
         POD.storage.deleteSource(source, function (source) {
            for (i = 0; i < $('#sourceslist .entries li').length; i++) {
               if ($($('#sourceslist .entries li')[i]).data('sourceUri') === source.uri) {
                  $($('#sourceslist .entries li')[i]).slideUp(400, removeFunction(this));
                  break;
               }
            }
         });
      });
   });
   //New or Changed Source
   document.addEventListener('writeSource', function (event) {
      var i, source, sourceUI;
      source = event.detail.source;
      sourceUI = UI.renderSource(source);
      for (i = 0; i < $('#sourceslist').find('.entries li').length; i++) {
         if ($($('#sourceslist').find('.entries li')[i]).data('sourceUri') === source.uri) {
            $($('#sourceslist').find('.entries li')[i]).slideUp().html(sourceUI.html()).slideDown();
            return;
         }
      }
      //show source if not listed before
      sourceUI.hide();
      $('#sourceslist').find('.entries').append(sourceUI);
      sourceUI.fadeIn();
   }, false);
   //Reload all Podcasts
   $('#refreshPlaylist').on('click', UI.eventHandler.refreshAllSources);
   //Open and close the dialog to insert new Feeds/Sources
   $('#showAddSourceView, #addSourceView .closeDialog').on('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      $('#addSourceView').toggleClass('fullscreen');
   });
   //Adds a new feed/source
   $('#loadSourceButton').on('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if ($('#addSourceUrlInput')[0].checkValidity()) {
         POD.storage.readSource($('#addSourceUrlInput').val(), function (source) {
            POD.web.downloadSource(source);
            $('#addSourceView').toggleClass('fullscreen');
            $('#addSourceUrlInput').val("");
         });
      }
   });
   UI.initGeneralUIEvents();
   UI.initConnectionStateEvents();
});
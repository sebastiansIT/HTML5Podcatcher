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

/*global navigator, window, localStorage */
/*global jasmine, describe, beforeEach, afterEach, it, expect, spyOn, done */
/*global HTML5Podcatcher, UI */

(function () {
   'use strict';
   describe("HTML5 Podcatcher Storage API Spec:", function () {

      var originalTimeout;
      beforeEach(function () {
         originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
         jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;
      });

      describe("Cleanup", function () {

         it("should delete all sources, all episodes and all files from storage", function (done) {
            HTML5Podcatcher.api.storage.StorageProvider.cleanStorage(function () {
               HTML5Podcatcher.api.storage.StorageProvider.readPlaylist(true, function (readedEpisodes) {
                  HTML5Podcatcher.api.storage.StorageProvider.readSources(function (readedSources) {
                     expect(readedEpisodes.length).toEqual(0);
                     expect(readedSources.length).toEqual(0);
                     done();
                  });
               });
            });
         });

      });

      describe("Storage provider Selection", function () {
         it("should return at least one storage provider for files (in Firefox, Chrome, Interet Explorer or Opera on Windows, Android or Firefox OS; Safarie on iOS don't support one of the implemented providers)", function () {
            expect(HTML5Podcatcher.api.storage.StorageProvider.isFileStorageAvailable()).toEqual(true);
         });
         it("should return the Indexed DB storage provider for data when called in Firefox, Chrome, Opera or Internet Explorer on Windows, Android or Firefox OS", function () {
            expect(HTML5Podcatcher.api.storage.StorageProvider.dataStorageProvider() instanceof HTML5Podcatcher.api.storage.indexedDatabase.IndexedDbDataProvider).toBeTruthy();
         });
         it("should return the Indexed DB storage provider for files when called in Firefox", function () {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
               expect(HTML5Podcatcher.api.storage.StorageProvider.fileStorageProvider()).toEqual(jasmine.any(HTML5Podcatcher.api.storage.indexedDatabase.IndexedDbFileProvider));
            }
         });
         it("should return the Chrome File System storage provider for files when called in Chrome or Opera on Windows or Android", function () {
            if (window.chrome) {
               expect(HTML5Podcatcher.api.storage.StorageProvider.fileStorageProvider()).toEqual(jasmine.any(HTML5Podcatcher.api.storage.chromeFileSystem.ChromeFileSystemFileProvider));
            }
         });
      });

      describe("Episode Storage", function () {
         var episodes = [
            {"uri": "https://podcast.web.site.new/episode1", "playback": {"played": false, "currentTime": 10}, "title": "Episode One Title", "updated": new Date("Fri, 05 Sep 2014 06:00:20 +0000"), "mediaUrl": "https://podcast.web.site.new/files/episode1.mp3", "source": "Podcast", "isFileSavedOffline": true},
            {"uri": "https://podcast.web.site.new/episode2", "playback": {"played": true, "currentTime": 70}, "title": "Episode Two Title", "updated": new Date("12 Sep 2014 17:20:50 +0000"), "mediaUrl": "https://podcast.web.site.new/files/episode2.mp3", "source": "Podcast", "isFileSavedOffline": false},
            {"uri": "https://podcast.web.site.new/episode3", "playback": {"played": true, "currentTime": 140}, "title": "Episode 3 Title", "updated": new Date("13 Sep 2014 17:20:50 +0000"), "mediaUrl": "https://podcast.web.site.new/files/episode3.mp3", "source": "Podcast", "isFileSavedOffline": false},
            {"uri": "https://another.web.site.new/episode1", "playback": {"played": false, "currentTime": 0}, "title": "Another Episode One Title", "updated": new Date("14 Sep 2014 7:20:50 +0000"), "mediaUrl": "https://another.web.site.new/files/episode1.mp3", "source": "Another.Podcast", "isFileSavedOffline": false}
         ];
         it("should save and read an array of episodes without any errors", function (done) {
            HTML5Podcatcher.api.storage.StorageProvider.writeEpisodes(episodes, function (writenEpisodes) {
               HTML5Podcatcher.api.storage.StorageProvider.readPlaylist(true, function (playlist) {
                  expect(writenEpisodes).toEqual(episodes);
                  expect(playlist).toEqual(episodes);
                  done();
               });
            });
         });
         it("should ignore an empty array of episodes when saving such an array", function (done) {
            var writeFunction = function () {
               HTML5Podcatcher.api.storage.StorageProvider.writeEpisodes([], function () {
                  HTML5Podcatcher.api.storage.StorageProvider.readPlaylist(true, function (playlist) {
                     expect(playlist).toEqual(episodes);
                     done();
                  });
               });
            };
            expect(writeFunction).not.toThrow();
         });
         it("should get all new episodes", function (done) {
            HTML5Podcatcher.api.storage.StorageProvider.readPlaylist(false, function (episodes) {
               expect(episodes.length).toEqual(2);
               done();
            });
         });
         it("should return all episodes from given source", function (done) {
            HTML5Podcatcher.api.storage.StorageProvider.readEpisodesBySource({"title": "Podcast"}, function (episodes) {
               expect(episodes.length).toEqual(3);
               done();
            });
         });
      });

      describe("Source Storage", function () {
         var sources = [
            {"uri": "https://podcast.web.site.new/", "link": "https://podcast.web.site.new/", "title": "Podcast", "description": "The never existing example podcast."},
            {"uri": "https://podcast2.web.site.new/", "link": "https://podcast2.web.site.new/", "title": "Podcast 2", "description": "The second never existing example podcast."}
         ];
         it("should save and read an array of sources without any errors", function (done) {
            HTML5Podcatcher.api.storage.StorageProvider.writeSources(sources, function (writenSources) {
               HTML5Podcatcher.api.storage.StorageProvider.readSources(function (readedSources) {
                  expect(writenSources.length).toEqual(2);
                  expect(writenSources).toEqual(sources);
                  expect(readedSources.length).toEqual(2);
                  expect(readedSources).toEqual(sources);
                  done();
               });
            });
         });
         it("should ignore a empty array of sources when saving such an array", function (done) {
            var writeFunction = function () {
               HTML5Podcatcher.api.storage.StorageProvider.writeSources([], function () {
                  HTML5Podcatcher.api.storage.StorageProvider.readSources(function (readedSources) {
                     expect(readedSources).toEqual(sources);
                     done();
                  });
               });
            };
            expect(writeFunction).not.toThrow();
         });
      });

      afterEach(function () {
         jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      });

   });
}());
/*  Copyright 2014,2015 Sebastian Spautz

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

/*global window, console, localStorage */
/*global jasmine, describe, beforeAll, beforeEach, afterEach, it, expect, spyOn, done */
/*global HTML5Podcatcher, UI */

(function () {
   'use strict';
   describe("HTML5 Podcatcher Configuration API Spec:", function () {
      var originalTimeout, fakeSourceStorage = {}, fakeEpisodeStorage = {}, testData;
      beforeAll(function () {
         testData = {
            settings: {
               settingA: 'A',
               settingB: 'B'
            },
            sources: [
               { uri: "https://podcast.web.site/feed/", link: "http://podcast.web.site/", title: "Podcast", description: "The not existing example podcast." }
            ],
            episodes: [
               { uri: "https://podcast.web.site.new/episode1", title: "Episode One Title", source: "https://podcast.web.site/feed/" },
               { uri: "https://podcast.web.site.new/episode2", title: "Episode Two Title", source: "https://podcast.web.site/feed/" },
               { uri: "https://podcast.web.site.new/news1", title: "News One Title", source: "https://podcast.web.site/feed/" }
            ]
         };
         localStorage.clear();
      });
      beforeEach(function () {
         fakeSourceStorage = {};
         fakeEpisodeStorage = {};
         originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
         jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
      });

      describe("Application settings", function () {

          // TODO rewrite with new async api
         /*it("should save a value under a key", function () {
            HTML5Podcatcher.api.configuration.settings.set('settingC', 'C');
            expect(localStorage.length).toEqual(1);
            expect(localStorage.getItem('settings.settingC')).toEqual('C');
         });*/

         it("should read a value for a key", function () {
            localStorage.setItem('settings.settingD', 'D');
            expect(localStorage.length).toEqual(1);
            expect(HTML5Podcatcher.api.configuration.settings.get('settingD')).toEqual('D');
         });

         it("should return undefined for a query to a unknown key", function () {
            expect(HTML5Podcatcher.api.configuration.settings.get('settingE')).toBe(undefined);
         });

      });

      describe("Override configuration", function () {
         beforeEach(function () {
            spyOn(HTML5Podcatcher.api.storage.StorageProvider, "writeSources").and.callFake(function (sources, callback) {
               var i;
               for (i = 0; i < sources.length; i++) {
                  fakeSourceStorage[sources[i].uri] = sources[i];
               }
               callback(sources);
            });
            spyOn(HTML5Podcatcher.api.storage.StorageProvider, "writeEpisodes").and.callFake(function (episodes, callback) {
               var i;
               for (i = 0; i < episodes.length; i++) {
                  fakeEpisodeStorage[episodes[i].uri] = episodes[i];
               }
               callback(episodes);
            });
         });

         it("should transfer a object (containing list of settings, sources and episodes) into the apps configuration", function (done) {
            HTML5Podcatcher.api.configuration.overrideConfiguration(testData, function () {
               expect(localStorage.length).toEqual(2);
               expect(fakeSourceStorage["https://podcast.web.site/feed/"]).toBeDefined();
               expect(fakeEpisodeStorage["https://podcast.web.site.new/episode2"].title).toEqual("Episode Two Title");
               expect(HTML5Podcatcher.api.storage.StorageProvider.writeSources.calls.count()).toEqual(1);
               expect(HTML5Podcatcher.api.storage.StorageProvider.writeEpisodes.calls.count()).toEqual(1);
               done();
            });
         });

      });

      describe("Merge configuration", function () {
         var preparationData;
         beforeAll(function () {
            preparationData = {
               settings: {
                  settingB: 'existing B',
                  settingC: 'existing C'
               },
               sources: [
                  { uri: "https://podcastB.web.site/feed/", link: "http://podcastB.web.site/", title: "Podcast B", description: "The not existing example podcast B." },
                  { uri: "https://podcastC.web.site/feed/", link: "http://podcastC.web.site/", title: "Podcast C", description: "The not existing example podcast C." }
               ],
               episodes: [
                  { uri: "https://podcastB.web.site.new/episode1", title: "Episode One Title", source: "https://podcastB.web.site/feed/" },
                  { uri: "https://podcastB.web.site.new/episode2", title: "Episode Two Title", source: "https://podcastB.web.site/feed/" },
                  { uri: "https://podcastB.web.site.new/news1", title: "News One Title", source: "https://podcastB.web.site/feed/" }
               ]
            };
         });
         beforeEach(function () {
            spyOn(HTML5Podcatcher.api.storage.StorageProvider, "writeSources").and.callFake(function (sources, callback) {
               var i;
               for (i = 0; i < sources.length; i++) {
                  fakeSourceStorage[sources[i].uri] = sources[i];
               }
               callback(sources);
            });
            spyOn(HTML5Podcatcher.api.storage.StorageProvider, "writeEpisodes").and.callFake(function (episodes, callback) {
               var i;
               for (i = 0; i < episodes.length; i++) {
                  fakeEpisodeStorage[episodes[i].uri] = episodes[i];
               }
               callback(episodes);
            });
         });

         it("should complete the existing configuration with additional values", function (done) {
            HTML5Podcatcher.api.configuration.overrideConfiguration(preparationData, function () {
               HTML5Podcatcher.api.configuration.mergeConfigurations(testData, function () {
                  expect(localStorage.length).toEqual(3);
                  expect(HTML5Podcatcher.api.storage.StorageProvider.writeSources.calls.count()).toEqual(2);
                  expect(fakeSourceStorage["https://podcast.web.site/feed/"]).toBeDefined();
                  expect(HTML5Podcatcher.api.storage.StorageProvider.writeEpisodes.calls.count()).toEqual(2);
                  expect(fakeEpisodeStorage["https://podcast.web.site.new/episode2"].title).toEqual("Episode Two Title");
                  done();
               });
            });
         });

      });

      describe("Read configuration", function () {
         beforeEach(function () {
            spyOn(HTML5Podcatcher.api.storage.StorageProvider, "readSources").and.callThrough();
            spyOn(HTML5Podcatcher.api.storage.StorageProvider, "readPlaylist").and.callThrough();
         });

         it("should return a object containing list of settings, sources and episodes", function (done) {
            HTML5Podcatcher.api.configuration.overrideConfiguration(testData, function () {
               HTML5Podcatcher.api.configuration.readConfiguration(function (config) {
                  expect(config).toBeDefined();
                  expect(config.settings).toBeDefined();
                  expect(config.settings.settingA).toEqual('A');
                  expect(config.episodes).toBeDefined();
                  expect(config.sources).toBeDefined();
                  expect(HTML5Podcatcher.api.storage.StorageProvider.readSources).toHaveBeenCalled();
                  expect(HTML5Podcatcher.api.storage.StorageProvider.readPlaylist).toHaveBeenCalled();
                  done();
               });
            });
         });

      });

      describe("Reset configuration", function () {

         it("should delete all application settings, sources and episodes", function (done) {
            console.log("test reset in " + jasmine.DEFAULT_TIMEOUT_INTERVAL + "ms");
            HTML5Podcatcher.api.configuration.resetConfiguration(function () {
               expect(localStorage.length).toEqual(0);
               HTML5Podcatcher.api.configuration.readConfiguration(function (config) {
                  expect(config).toBeDefined();
                  expect(config.episodes).toBeDefined();
                  expect(config.episodes.length).toEqual(0);
                  expect(config.sources).toBeDefined();
                  expect(config.sources.length).toEqual(0);
                  done();
               });
            });
         });

      });

      afterEach(function () {
         HTML5Podcatcher.api.configuration.resetConfiguration();
         jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      });
   });
}());

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
/*global localStorage */
/*global jasmine, describe, beforeEach, afterEach, it, expect, spyOn, done */
/*global HTML5Podcatcher, UI */
(function () {
    'use strict';
    describe("HTML5 Podcatcher Settings Spec", function () {
        var fakeSettingsStorage = {}, fakeSourceStorage = {}, fakeEpisodeStorage = {}, testData;
        testData = {
            Settings: {
                settingA: 'A',
                settingB: 'B'
            },
            Sources: {
                "https://podcast.web.site/feed/": { uri: "https://podcast.web.site/feed/", link: "http://podcast.web.site/", title: "Podcast", description: "The not existing example podcast." }
            },
            Episodes: {
                "https://podcast.web.site.new/episode1" : { uri: "https://podcast.web.site.new/episode1", title: "Episode One Title" },
                "https://podcast.web.site.new/episode2" : { uri: "https://podcast.web.site.new/episode2", title: "Episode Two Title" },
                "https://podcast.web.site.new/news1" : { uri: "https://podcast.web.site.new/news1", title: "News One Title" }
            }
        };
        describe("Import configuration", function () {
            var originalTimeout;
            beforeEach(function () {
                spyOn(UI.settings, "set").and.callFake(function (key, value) {
                    fakeSettingsStorage[key] = value;
                });
				spyOn(HTML5Podcatcher.storage, "writeSource").and.callFake(function (source, callback) {
                    fakeSourceStorage[source.uri] = source;
                    callback(source);
                });
                spyOn(HTML5Podcatcher.storage, "writeEpisode").and.callFake(function (episode, callback) {
                    fakeEpisodeStorage[episode.uri] = episode;
                    callback(episode);
                });
                originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
                jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
            });
            it("should insert a object containing list of settings, sources and episodes in the apps storage", function (done) {
                UI.import(testData, function () {
                    expect(Object.keys(fakeSettingsStorage).length).toEqual(2);
                    expect(fakeSourceStorage["https://podcast.web.site/feed/"]).toBeDefined();
                    expect(fakeEpisodeStorage["https://podcast.web.site.new/episode2"].title).toEqual("Episode Two Title");
                    expect(UI.settings.set.calls.count()).toEqual(2);
                    expect(HTML5Podcatcher.storage.writeSource.calls.count()).toEqual(1);
                    expect(HTML5Podcatcher.storage.writeEpisode.calls.count()).toEqual(3);
                    done();
                });
            });
            afterEach(function () {
                jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            });
        });
        describe("Export configuration", function () {
            var originalTimeout;
            beforeEach(function () {
                spyOn(HTML5Podcatcher.storage, "readSources").and.callThrough();
                spyOn(HTML5Podcatcher.storage, "readPlaylist").and.callThrough();
                originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
                jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
            });
            it("should return a object containing list of settings, sources and episodes", function (done) {
                UI.export(function (config) {
                    expect(config).toBeDefined();
                    expect(config.Settings).toBeDefined();
                    expect(config.Episodes).toBeDefined();
                    expect(config.Sources).toBeDefined();
                    expect(HTML5Podcatcher.storage.readSources).toHaveBeenCalled();
                    expect(HTML5Podcatcher.storage.readPlaylist).toHaveBeenCalled();
                    done();
                });
            });
            afterEach(function () {
                jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            });
        });
    });
}());
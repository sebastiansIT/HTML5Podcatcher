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
/*global navigator, window */
/*global jasmine, describe, it, expect, beforeEach, afterEach */
/*global HTML5Podcatcher */
/*global DOMParser */
(function () {
    'use strict';
    describe("HTML5 Podcatcher Low Level API", function () {
        describe("Storage Provider", function () {
            var originalTimeout;
            beforeEach(function () {
                originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
                jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
            });
            it("can clean all data in the storage subsystem", function (done) {
                HTML5Podcatcher.storage.cleanStorage(function () {
                    HTML5Podcatcher.storage.readPlaylist(true, function (readedEpisodes) {
                        HTML5Podcatcher.storage.readSources(function (readedSources) {
                            expect(readedEpisodes.length).toEqual(0);
                            expect(readedSources.length).toEqual(0);
                            done();
                        });
                    });
                });
            });
            describe("Selection of applicable storage provider in different browsers", function () {
                it("should available at least one storage provider for files (in Firefox, Chrome, Interet Explorer or Opera on Windows, Android or Firefox OS; Safarie on iOS don't support one of the implemented providers)", function () {
                    expect(HTML5Podcatcher.storage.isFileStorageAvailable()).toEqual(true);
                });
                it("should select Indexed DB storage provider for data when called in Firefox, Chrome, Opera or Internet Explorer on Windows, Android or Firefox OS", function () {
                    expect(HTML5Podcatcher.storage.dataStorageEngine()).toEqual(HTML5Podcatcher.storage.indexedDbStorage);
                });
                it("should select Indexed DB storage provider for files when called in Firefox", function () {
                    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
                        expect(HTML5Podcatcher.storage.fileStorageEngine()).toEqual(HTML5Podcatcher.storage.indexedDbStorage);
                    }
                });
                it("should select File System API storage provider for files when called in Chrome or Opera on Windows or Android", function () {
                    if (window.chrome) {
                        expect(HTML5Podcatcher.storage.fileStorageEngine()).toEqual(HTML5Podcatcher.storage.fileSystemStorage);
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
                    HTML5Podcatcher.storage.writeEpisodes(episodes, function (writenEpisodes) {
                        HTML5Podcatcher.storage.readPlaylist(true, function (playlist) {
                            expect(writenEpisodes).toEqual(episodes);
                            expect(playlist).toEqual(episodes);
                            done();
                        });
                    });
                });
                it("should get all new episodes", function (done) {
                    HTML5Podcatcher.storage.readPlaylist(false, function (episodes) {
                        expect(episodes.length).toEqual(2);
                        done();
                    });
                });
                it("should return all episodes from given source", function (done) {
                    HTML5Podcatcher.storage.readEpisodesBySource({"title": "Podcast"}, function (episodes) {
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
                    HTML5Podcatcher.storage.writeSources(sources, function (writenSources) {
                        HTML5Podcatcher.storage.readSources(function (readedSources) {
                            expect(writenSources.length).toEqual(2);
                            expect(writenSources).toEqual(sources);
                            expect(readedSources.length).toEqual(2);
                            expect(readedSources).toEqual(sources);
                            done();
                        });
                    });
                });
            });
            afterEach(function () {
                jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            });
        });
        describe("Parser", function () {
            var xml, psc, source;
            source = { uri: "http://podcast.web.site/feed/", link: "http://podcast.web.site/", title: "Podcast", description: "The not existing example podcast." };
            describe("Parser for \"Normal Play Time\" (RFC 2326)", function () {
                it("should be able to parse a value in seconds", function () {
                    var result = HTML5Podcatcher.parser.parseNormalPlayTime("345");
                    expect(result).toEqual(345000);
                });
                it("should be able to parse a value in seconds and milliseconds", function () {
                    var result = HTML5Podcatcher.parser.parseNormalPlayTime("345.789");
                    expect(result).toEqual(345789);
                });
                it("should be able to parse a value in minutes, seconds and milliseconds", function () {
                    var result = HTML5Podcatcher.parser.parseNormalPlayTime("23:45.789");
                    expect(result).toEqual(23 * 60 * 1000 + 45789);
                });
                it("should be able to parse a value in hours, minutes, seconds and milliseconds", function () {
                    var result = HTML5Podcatcher.parser.parseNormalPlayTime("01:23:45.789");
                    expect(result).toEqual(60 * 60 * 1000 + 23 * 60 * 1000 + 45789);
                });
            });
            describe("Parser for \"Podlove Simple Chapters\" (http://podlove.org/simple-chapters/)", function () {
                psc = (new DOMParser()).parseFromString('<psc:chapters version="1.1" xmlns:psc="http://podlove.org/simple-chapters">\n\t'
                    + '<psc:chapter start="00:00:00.000" title="Chapter1" />\n\t'
                    + '<psc:chapter start="00:01:30.009" title="Chapter2" href="https://podcast.web.site/episode1/chapter2/" />\n\t'
                    + '<psc:chapter start="00:12:57.062" image="https://podcast.web.site/episode1/chapter3/img.png" title="Chapter3" />\n\t'
                    + '<psc:chapter href="https://podcast.web.site/episode1/chapter4/" start="1:00:27.254" title="Chapter4" image="https://podcast.web.site/episode1/chapter4/img.png" />\n'
                    + '</psc:chapters>', "text/xml");
                it("should return an empty array if no correct <psc:chapters> element found", function () {
                    var result, xmlWithFailure;
                    xmlWithFailure = (new DOMParser()).parseFromString('<other type="format"><channel>\n'
                        + '\t<title>Podcast (changed title)</title>\n'
                        + '\t<link>http://podcast.web.site.new/</link>\n'
                        + '\t<description>The never existing example podcast.</description>\n'
                        + '</channel></other>', "text/xml");
                    result = HTML5Podcatcher.parser.parsePodloveSimpleChapters(xmlWithFailure);
                    expect(result).toEqual([]);
                });
                it("should return an array with 4 elements from parsing the sample xml fragment", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parsePodloveSimpleChapters(psc.getElementsByTagNameNS('http://podlove.org/simple-chapters', 'chapters'));
                    expect(result.length).toEqual(4);
                });
                it("should return an array with correct data from parsing the sample xml fragment", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parsePodloveSimpleChapters(psc.getElementsByTagNameNS('http://podlove.org/simple-chapters', 'chapters'));
                    expect(result[0].time).toEqual(0);
                    expect(result[1].time).toEqual(90.009);
                    expect(result[2].time).toEqual((12 * 60 + 57.062));
                    expect(result[3].time).toEqual((60 * 60 + 27.254));
                    expect(result[0].title).toEqual('Chapter1');
                    expect(result[1].title).toEqual('Chapter2');
                    expect(result[2].title).toEqual('Chapter3');
                    expect(result[3].title).toEqual('Chapter4');
                    expect(result[0].uri).toBeUndefined();
                    expect(result[1].uri).toEqual('https://podcast.web.site/episode1/chapter2/');
                    expect(result[2].uri).toBeUndefined();
                    expect(result[3].uri).toEqual('https://podcast.web.site/episode1/chapter4/');
                    expect(result[0].image).toBeUndefined();
                    expect(result[1].image).toBeUndefined();
                    expect(result[2].image).toEqual('https://podcast.web.site/episode1/chapter3/img.png');
                    expect(result[3].image).toEqual('https://podcast.web.site/episode1/chapter4/img.png');
                });
            });
            describe("RSS Version 2 Parser", function () {
                xml = (new DOMParser()).parseFromString('<?xml version="1.0" encoding="UTF-8"?>\n'
                    + '<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n'
                    + '\t<title>Podcast (changed title)</title>\n'
                    + '\t<link>https://podcast.web.site.new/</link>\n'
                    + '\t<atom:link href="https://podcast.web.site.mp3.rss/" rel="self" type="application/rss+xml" title="Feed MP3" />\n'
                    + '\t<atom:link href="https://podcast.web.site.off.rss/" rel="alternate" type="application/rss+xml" title="Feed OGG" />\n'
                    + '\t<description>The never existing example podcast.</description>\n'
                    + '\t<copyright>CC BY-NC-SA 3.0</copyright>\n'
                    
                    + '\t<item>\n'
                    + '\t\t<title>Episode One Title</title>\n'
                    + '\t\t<link>https://podcast.web.site.new/episode1</link>\n'
                    + '\t\t<pubDate>Fri, 05 Sep 2014 06:00:20 +0000</pubDate>\n'
                    + '\t\t<description><![CDATA[Episode description. <a href="https://podcast.web.site.new/episode1">More &#8594;</a>]]></description>\n'
                    + '\t\t<itunes:duration>0:59:30</itunes:duration>\n'
                    + '\t\t<enclosure url="https://podcast.web.site.new/files/episode1.mp3" length="10000000" type="audio/mpeg" />\n'
                    + '\t\t<psc:chapters version="1.1" xmlns:psc="http://podlove.org/simple-chapters">\n'
                    + '\t\t\t<psc:chapter start="00:00:00.000" title="Chapter1" />\n'
                    + '\t\t\t<psc:chapter start="00:01:30.009" title="Chapter2" href="https://podcast.web.site/episode1/chapter2/" />\n'
                    + '\t\t\t<psc:chapter start="00:12:57.062" image="https://podcast.web.site/episode1/chapter3/img.png" title="Chapter3" />\n'
                    + '\t\t\t<psc:chapter href="https://podcast.web.site/episode1/chapter4/" start="1:00:27.254" title="Chapter4" image="https://podcast.web.site/episode1/chapter4/img.png" />\n'
                    + '\t\t</psc:chapters>\n'
                    + '\t</item>\n'
                    
                    + '\t<item>\n'
                    + '\t\t<title>Episode Two Title</title>\n'
                    + '\t\t<guid>https://podcast.web.site.new/episode2</guid>\n'
                    + '\t\t<pubDate>12 Sep 2014 17:20:50 +0000</pubDate>\n'
                    + '\t\t<content:encoded><![CDATA[<p>Text and <span>some markup</span><a href="https://podcast.web.site.new/files/episode2.mp3" target="_blank">Download</a></p>]]></content:encoded>\n'
                    + '\t</item>\n'
                    
                    + '\t<item>\n'
                    + '\t\t<title>Item without Audio-File</title>\n'
                    + '\t\t<link>https://podcast.web.site.new/news1</link>\n'
                    + '\t\t<guid>https://podcast.web.site.new/news1_guid</guid>\n'
                    + '\t\t<pubDate>Fri, 13 Sep 2014 18:21:26 +0000</pubDate>\n'
                    + '\t</item>\n'
                    
                    + '\t<item>\n'
                    + '\t\t<title>Item with MP3 enclosure</title>\n'
                    + '\t\t<guid>https://podcast.web.site/episode3_guid</guid>\n'
                    + '\t\t<link>https://podcast.web.site/episode3</link>\n'
                    + '\t\t<pubDate>Fri, 13 Sep 2014 18:21:26 +0000</pubDate>\n'
                    + '\t\t<content:encoded><![CDATA[<p>Text and <span>some markup</span><a href="https://podcast.web.site.new/files/ankerTo.opus" target="_blank">Download</a></p>]]></content:encoded>\n'
                    + '\t\t<enclosure url="https://podcast.web.site/episode.mp3" length="76206624" type="audio/mpeg" />\n'
                    + '\t</item>\n'
                    
                    + '\t<item>\n'
                    + '\t\t<title>Item with AAC enclosure</title>\n'
                    + '\t\t<link>https://podcast.web.site/episode4</link>\n'
                    + '\t\t<pubDate>Fri, 14 Sep 2014 18:21:26 +0000</pubDate>\n'
                    + '\t\t<enclosure url="https://podcast.web.site/episode.m4a" length="49966646" type="audio/mp4" />\n'
                    + '\t</item>\n'
                    
                    + '\t<item>\n'
                    + '\t\t<title>Item with Ogg/Opus enclosure and Ogg Mime-Type</title>\n'
                    + '\t\t<link>https://podcast.web.site/episode5</link>\n'
                    + '\t\t<pubDate>Fri, 15 Sep 2014 18:21:26 +0000</pubDate>\n'
                    + '\t\t<enclosure url="https://podcast.web.site/episode.opus" length="34069747" type="audio/ogg; codecs=opus" />\n'
                    + '\t</item>\n'
                    
                    + '\t<item>\n'
                    + '\t\t<title>Item with AAC content link</title>\n'
                    + '\t\t<guid>https://podcast.web.site.new/episode6</guid>\n'
                    + '\t\t<pubDate>16 Sep 2014 17:20:50 +0000</pubDate>\n'
                    + '\t\t<content:encoded><![CDATA[<p>Text and <span>some markup</span><a href="https://podcast.web.site.new/files/episode.m4a" target="_blank">Download</a></p>]]></content:encoded>\n'
                    + '\t</item>\n'
                    + '\t<item>\n'
                    + '\t\t<title>Item with Ogg/Vorbis content link</title>\n'
                    + '\t\t<guid>https://podcast.web.site.new/episode7</guid>\n'
                    + '\t\t<pubDate>17 Sep 2014 17:20:50 +0000</pubDate>\n'
                    + '\t\t<content:encoded><![CDATA[<p>Text and <span>some markup</span><a href="https://podcast.web.site.new/files/episode.oga" target="_blank">Download</a></p>]]></content:encoded>\n'
                    + '\t</item>\n'
                    + '\t<item>\n'
                    + '\t\t<title>Item with Opus content link</title>\n'
                    + '\t\t<guid>https://podcast.web.site.new/episode8</guid>\n'
                    + '\t\t<pubDate>18 Sep 2014 17:20:50 +0000</pubDate>\n'
                    + '\t\t<content:encoded><![CDATA[<p>Text and <span>some markup</span><a href="https://podcast.web.site.new/files/episode.opus" target="_blank">Download</a></p>]]></content:encoded>\n'
                    + '\t</item>\n'
                    
                    + '\t<item>\n'
                    + '\t\t<title>Item with Ogg/Opus enclosure and  Opus Mime-Type</title>\n'
                    + '\t\t<link>https://podcast.web.site/episode9</link>\n'
                    + '\t\t<pubDate>Fri, 19 Sep 2014 18:21:26 +0000</pubDate>\n'
                    + '\t\t<enclosure url="https://podcast.web.site/episode.opus" length="34069747" type="audio/opus" />\n'
                    + '\t</item>\n'
                    
                    + '</channel></rss>', "text/xml");
                it("should return 'undefined' if no correct root element for RSS (Level 2) feed found", function () {
                    var result, xmlWithFailure;
                    xmlWithFailure = (new DOMParser()).parseFromString('<?xml version="1.0" encoding="UTF-8"?>\n'
                        + '<other type="format"><channel>\n'
                        + '\t<title>Podcast (changed title)</title>\n'
                        + '\t<link>http://podcast.web.site.new/</link>\n'
                        + '\t<description>The never existing example podcast.</description>\n'
                        + '</channel></other>', "text/xml");
                    result = HTML5Podcatcher.parser.parseSource(xmlWithFailure, source);
                    expect(result).toBeUndefined();
                });
                it("should return 'undefined' if no root element exists", function () {
                    var result, xmlWithFailure;
                    try {
                        xmlWithFailure = (new DOMParser()).parseFromString('<?xml version="1.0" encoding="UTF-8"?>\n', "text/xml");
                        result = HTML5Podcatcher.parser.parseSource(xmlWithFailure, source);
                        expect(result).toBeUndefined();
                    } catch (syntaxerror) {
                        return;
                    }
                });
                it("should return the old link when podcast <link> element isn't available in feed", function () {
                    var result, xmlWithFailure;
                    xmlWithFailure = (new DOMParser()).parseFromString('<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n'
                        + '</channel></rss>', "text/xml");
                    result = HTML5Podcatcher.parser.parseSource(xmlWithFailure, source);
                    expect(result.source.link).toEqual('http://podcast.web.site/');
                });
                it("should return the podcast website as title when title isn't set explicit", function () {
                    var result, xmlWithFailure;
                    xmlWithFailure = (new DOMParser()).parseFromString('<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n'
                        + '\t<link>https://podcast.web.site.new/</link>\n'
                        + '</channel></rss>', "text/xml");
                    result = HTML5Podcatcher.parser.parseSource(xmlWithFailure, source);
                    expect(result.source.title).toEqual('https://podcast.web.site.new/');
                });
                it("should return a empty string as description when description isn't set explicit", function () {
                    var result, xmlWithFailure;
                    xmlWithFailure = (new DOMParser()).parseFromString('<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n'
                        + '\t<link>https://podcast.web.site.new/</link>\n'
                        + '\t<title>Podcast (changed title)</title>\n'
                        + '</channel></rss>', "text/xml");
                    result = HTML5Podcatcher.parser.parseSource(xmlWithFailure, source);
                    expect(result.source.description).toEqual('');
                });
                it("should return a empty string as description when description element is empty", function () {
                    var result, xmlWithFailure;
                    xmlWithFailure = (new DOMParser()).parseFromString('<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n'
                        + '\t<link>https://podcast.web.site.new/</link>\n'
                        + '\t<title>Podcast (changed title)</title>\n'
                        + '\t<description></description>\n'
                        + '</channel></rss>', "text/xml");
                    result = HTML5Podcatcher.parser.parseSource(xmlWithFailure, source);
                    expect(result.source.description).toEqual('');
                });
                it("should be able to parse a source title from a RSS (Level 2) feed", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.source.title).toEqual('Podcast (changed title)');
                });
                it("should be able to parse a source description from a RSS (Level 2) feed", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.source.description).toEqual('The never existing example podcast.');
                });
                it("should be able to parse the link to the website of a source from a RSS (Level 2) feed", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.source.link).toEqual('https://podcast.web.site.new/');
                });
                it("should be able to parse a source license from a RSS (Level 2) feed", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.source.license).toEqual('CC BY-NC-SA 3.0');
                });
                it("should return a \"undefined\" license if no such information is contains in a RSS (Level 2) feed", function () {
                    var result, xmlWithFailure;
                    xmlWithFailure = (new DOMParser()).parseFromString('<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n'
                        + '\t<link>https://podcast.web.site.new/</link>\n'
                        + '\t<title>Podcast (changed title)</title>\n'
                        + '\t<description>This is a sample.</description>\n'
                        + '</channel></rss>', "text/xml");
                    result = HTML5Podcatcher.parser.parseSource(xmlWithFailure, source);
                    expect(result.source.license).toBeUndefined();
                });
                it("should be able to parse the list of items from a RSS (Level 2) feed", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes.length).toEqual(10);
                });
                it("should be able to parse a episodes title from a RSS (Level 2) feed", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes[0].title).toEqual('Episode One Title');
                    expect(result.episodes[1].title).toEqual('Episode Two Title');
                    expect(result.episodes[2].title).toEqual('Item without Audio-File');
                });
                it("should be able to parse the link to a episodes web page from a RSS (Level 2) feed", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    //Test <link>-Element
                    expect(result.episodes[0].uri).toEqual('https://podcast.web.site.new/episode1');
                    //Test <guid>-Element
                    expect(result.episodes[1].uri).toEqual('https://podcast.web.site.new/episode2');
                    //Test <link> before <guid> in markup (<link> has priority)
                    expect(result.episodes[2].uri).toEqual('https://podcast.web.site.new/news1');
                    //Test <guid> before <link> in markup (<link> has priority)
                    expect(result.episodes[3].uri).toEqual('https://podcast.web.site/episode3');
                });
                it("should be able to add a reference to the source when parsing a episode", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes[0].source).toEqual('Podcast (changed title)');
                });
                it("should be able to parse the publishing date of a episode from a RSS (Level 2) feed", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    //Test <pubdate>
                    expect(result.episodes[0].updated).toEqual(new Date(Date.UTC(2014, 8, 5, 6, 0, 20, 0)));
                    //Test <pubdate> with missing Day of Week (Mon - Sat)
                    expect(result.episodes[1].updated).toEqual(new Date(Date.UTC(2014, 8, 12, 17, 20, 50, 0)));
                });
                it("should be able to parse at least one (if one exists) audio file of a episode from a RSS (Level 2) feed", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    //use enclosure to get the file url
                    expect(result.episodes[0].mediaUrl).toEqual('https://podcast.web.site.new/files/episode1.mp3');
                    //use links in HTML content of the item
                    expect(result.episodes[1].mediaUrl).toEqual('https://podcast.web.site.new/files/episode2.mp3');
                    expect(result.episodes[2].mediaUrl).toBeUndefined();
                });
                it("should be able to detect a MP3 file from a closure tag in RSS (Level 2) feed by mimetype \"audio/mpeg\"", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes[3].mediaUrl).toEqual('https://podcast.web.site/episode.mp3');
                    expect(result.episodes[3].mediaType).toEqual('audio/mpeg');
                });
                it("should be able to detect a ACC file from a closure tag in RSS (Level 2) feed by mimetype \"audio/mp4\"", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes[4].mediaUrl).toEqual('https://podcast.web.site/episode.m4a');
                    expect(result.episodes[4].mediaType).toEqual('audio/mp4');
                });
                it("should be able to detect a Ogg/Opus file from a closure tag in RSS (Level 2) feed by mimetype \"audio/ogg; codecs=opus\" when this format is supported. Instead the episodes media URL shoud be undefined.", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    if (document.createElement('audio').canPlayType('audio/ogg; codecs=opus') !== '') {
                        expect(result.episodes[5].mediaUrl).toEqual('https://podcast.web.site/episode.opus');
                    } else {
                        expect(result.episodes[5].mediaUrl).toBeUndefined();
                    }
                    //expect(result.episodes[5].mediaType).toEqual('audio/opus');
                    expect(result.episodes[5].mediaType).toEqual('audio/ogg; codecs=opus');
                });
                it("should be able to detect a Ogg/Opus file from a closure tag in RSS (Level 2) feed by mimetype \"audio/opus\" when this format is supported. Instead the episodes media URL shoud be undefined.", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    if (document.createElement('audio').canPlayType('audio/ogg; codecs=opus') !== '') {
                        expect(result.episodes[9].mediaUrl).toEqual('https://podcast.web.site/episode.opus');
                    } else {
                        expect(result.episodes[9].mediaUrl).toBeUndefined();
                    }
                    expect(result.episodes[9].mediaType).toEqual('audio/ogg; codecs=opus');
                });
                it("should be able to detect a MP3 file from the content tag in RSS (Level 2) feed by file extension \".mp3\"", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes[1].mediaUrl).toEqual('https://podcast.web.site.new/files/episode2.mp3');
                    expect(result.episodes[1].mediaType).toEqual('audio/mpeg');
                });
                it("should be able to detect a AAC file from the content tag in RSS (Level 2) feed by file extension \".m4a\"", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes[6].mediaUrl).toEqual('https://podcast.web.site.new/files/episode.m4a');
                    expect(result.episodes[6].mediaType).toEqual('audio/mp4');
                });
                it("should be able to detect a Ogg/Vorbis file from the content tag in RSS (Level 2) feed by file extension \".oga\"", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes[7].mediaUrl).toEqual('https://podcast.web.site.new/files/episode.oga');
                    expect(result.episodes[7].mediaType).toEqual('audio/ogg');
                });
                it("should be able to detect a Ogg/Opus file from the content tag in RSS (Level 2) feed by file extension \".opus\"", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes[8].mediaUrl).toEqual('https://podcast.web.site.new/files/episode.opus');
                    expect(result.episodes[8].mediaType).toEqual('audio/ogg; codecs=opus');
                });
                it("should be able to detect a chapters list from the rss item in \"Podlove Simple Chapters\" format", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes[0].jumppoints.length).toEqual(4);
                });
            });
        });
    });
}());
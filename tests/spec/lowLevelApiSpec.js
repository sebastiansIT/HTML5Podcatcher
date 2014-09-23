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
/*global describe, it, expect */
/*global HTML5Podcatcher */
/*global DOMParser */
(function () {
    'use strict';
    describe("HTML5 Podcatcher Low Level API", function () {
        describe("Parser", function () {
            var xml, source;
            source = { uri: "http://podcast.web.site/feed/", link: "http://podcast.web.site/", title: "Podcast", description: "The not existing example podcast." };
            describe("RSS Version 2 Parser", function () {
                xml = (new DOMParser()).parseFromString('<?xml version="1.0" encoding="UTF-8"?>\n'
                    + '<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n'
                    + '\t<title>Podcast (changed title)</title>\n'
                    + '\t<atom:link href="https://podcast.web.site.new/" rel="self" type="application/rss+xml" />\n'
                    + '\t<link>https://podcast.web.site.new/</link>\n'
                    + '\t<description>The never existing example podcast.</description>\n'
                    + '\t<item>\n'
                    + '\t\t<title>Episode One Title</title>\n'
                    + '\t\t<link>https://podcast.web.site.new/episode1</link>\n'
                    + '\t\t<pubDate>Fri, 05 Sep 2014 06:00:20 +0000</pubDate>\n'
                    + '\t\t<description><![CDATA[Episode description. <a href="https://podcast.web.site.new/episode1">More &#8594;</a>]]></description>\n'
                    + '\t\t<itunes:duration>0:59:30</itunes:duration>\n'
                    + '\t\t<enclosure url="https://podcast.web.site.new/files/episode1.mp3" length="10000000" type="audio/mpeg" />\n'
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
                    + '\t\t<pubDate>Fri, 13 Sep 2014 18:21:26 +0000</pubDate>\n'
                    + '\t</item>\n'
                    //Add third item from system matters and check pi halbe podcast
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
                it("should be able to parse the list of items from a RSS (Level 2) feed", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    expect(result.episodes.length).toEqual(3);
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
                it("should be able to parse at least one (if one exists) audio file of a episode from a RSS (Level 2) feed ", function () {
                    var result;
                    result = HTML5Podcatcher.parser.parseSource(xml, source);
                    //use enclosure to get the file url
                    expect(result.episodes[0].mediaUrl).toEqual('https://podcast.web.site.new/files/episode1.mp3');
                    //use links in HTML content of the item
                    expect(result.episodes[1].mediaUrl).toEqual('https://podcast.web.site.new/files/episode2.mp3');
                    expect(result.episodes[2].mediaUrl).toBeUndefined();
                });
            });
        });
    });
}());
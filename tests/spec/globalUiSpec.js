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
/*global HTML5Podcatcher, GlobalUserInterfaceHelper */
(function () {
    'use strict';
    describe("HTML5 Podcatcher UI", function () {
        describe("Settings API", function () {
            localStorage.clear();
            it("should return the same value it is set before.", function () {
                GlobalUserInterfaceHelper.settings.set("test", "test value");
                expect(GlobalUserInterfaceHelper.settings.get("test")).toEqual("test value");
            });
            localStorage.clear();
        });
    });
}());
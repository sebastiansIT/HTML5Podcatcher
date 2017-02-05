/*  Copyright 2013, 2014 Sebastian Spautz

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
/* Version: {{ VERSION }} */
/*global navigator, window, document */
/*global CustomEvent, EventTarget */

// ============== Take care of vendor prefixes ==============
window.URL = window.URL || window.webkitURL;
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;
window.navigator.persistentStorage = window.navigator.persistentStorage || window.navigator.webkitPersistentStorage;
window.navigator.connection = window.navigator.connection || window.navigator.mozConnection;

// ============== Polyfills ==============
// Custom Events
(function () {
    function CustomEvent(event, params) {
        params = params || {bubbles: false, cancelable: false, detail: undefined};
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
}());

// Pointer Events (partial)
window.registerPointerEventListener = (function () {
    var pointerDownEventName = [], pointerUpEventName = [], registerPointerEventListener;

    if (window.PointerEvent) {
        pointerDownEventName.push('pointerdown');
        pointerUpEventName.push('pointerup');
    } else if (window.MSPointerEvent) {
        pointerDownEventName.push('MSPointerDown');
        pointerUpEventName.push('MSPointerUp');
    } else {
        if (window.TouchEvent) {
            pointerDownEventName.push('touchstart');
            pointerUpEventName.push('touchend');
        } else {
            pointerDownEventName.push('mousedown');
            pointerUpEventName.push('mouseup');
        }
    }

    registerPointerEventListener = function (eventTarget, type, listener, useCapture) {
        if (type === 'pointerdown') {
            pointerDownEventName.forEach(function (eventType) {
                eventTarget.addEventListener(eventType, listener, useCapture);
            });
        } else if (type === 'pointerup') {
            pointerUpEventName.forEach(function (eventType) {
                eventTarget.addEventListener(eventType, listener, useCapture);
            });
        }
    };

    return registerPointerEventListener;
}());
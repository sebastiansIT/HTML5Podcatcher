/** Functions to create and manage notifications.

    @module  h5p/notifications
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @license Copyright 2019 Sebastian Spautz

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
/* global Notification */

/** Permission "granted" to show notifications.
  * @const {external:String}
  */
const PERMISSION_GRANTED = 'granted'
/** Permission to show notifications denied.
  * @const {external:String}
  */
const PERMISSION_DENIED = 'denied'

/**
  * A promise fulfilled with undefined when a notification is created.
  * @promise CreateNotificationPromise
  * @fulfill {undefined} Fulfill empty when a notification is created.
  * @reject {external:Error} An Error if somthing goes wrong.
  */
/** Creates a Notification. First it trys to create a site local notification.
  * If this dosn't works, like in Chrome for Android, it creates a Notification
  * in the service worker scope.
  * @private
  * @static
  * @param {external:Notification[]} notificationsList A list of created notifications.
  * @param {external:String} message The message to show in a notification.
  * @param {external:String} tag The tag to identify a notification.
  * @returns {CreateNotificationPromise} A promise that fullfiled with undefined.
  */
function createNotification (notificationsList, message, tag) {
  try {
    notificationsList.push(new Notification(message, { icon: 'images/logo32.png', tag: tag }))
    return Promise.resolve()
  } catch (error) {
    // Chrome on Android don't allow Notifications directly shown by a site.
    // See https://bugs.chromium.org/p/chromium/issues/detail?id=481856 for more details.
    if (error.name === 'TypeError') {
      return navigator.serviceWorker.getRegistration()
        .then(registration => {
          if (registration && registration.showNotification) {
            registration.showNotification(message, { icon: 'images/logo32.png', tag: tag })
          } else {
            return Promise.reject(new Error('Can not show notification: no service worker registration available.'))
          }
        })
    } else {
      return Promise.reject(error)
    }
  }
}

/** This class manages notifications.
  * @class
  * @private
  */
class NotificationManager {
  /** Creates a new NotificationManager.
    * @constructs
    */
  constructor () {
    /** List of created notifications
      * @type {external:Notification[]}
      * @private
      */
    this.notifications = []
  }

  /** Shows a message as a notifications
    * @param {external:String} message The message to show in a notification.
    * @param {external:String} tag The tag to identify a notification.
    * @returns {CreateNotificationPromise} A promise that fullfiled with undefined.
    */
  showNotification (message, tag) {
    return new Promise((resolve, reject) => {
      if (Notification) {
        if (Notification.permission === PERMISSION_GRANTED) { // If it's okay let's create a notification
          createNotification(this.notifications, message, tag)
            .then(() => resolve())
            .catch((error) => reject(error))
        } else if (Notification.permission !== PERMISSION_DENIED) { // Otherwise, we need to ask the user for permission
          Notification.requestPermission(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === PERMISSION_GRANTED) {
              createNotification(this.notifications, message, tag)
                .then(() => resolve())
                .catch((error) => reject(error))
            } else {
              reject(new Error('Permission to show notification is not granted.'))
            }
          })
        }
      } else {
        reject(new Error('Notification API is not supported.'))
      }
    })
  }
}

/** Exports a singelton Instance of NotificationManager.
  * @constant {module:h5p/notifications~NotificationManager}
  */
export const notificationManager = new NotificationManager()

/** The HTML5Podcatcher Command Worker.

    @module  podcatcher/commands/worker
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:podcatcher/utils/logging
    @license Copyright 2020 Sebastian Spautz

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

/* global self */

const commandProzessorUrl = self.name + '.js'
self.importScripts(commandProzessorUrl)

const COMMAND_PROCESSOR = new self.CommandProcessor(self)

self.addEventListener('message', (event) => {
  console.debug(`Command ${event.data.command} is called.`)

  // check event.data.command exists
  const command = event.data.command
  if (!command) {
    throw new Error('Command is missing in message to worker')
  }
  const payload = event.data.payload

  const postEventMessage = (payload) => {
    self.postMessage({
      echo: {
        command: command,
        payload: payload
      },
      type: 'event',
      payload: payload
    })
  }

  if (COMMAND_PROCESSOR[command] && typeof COMMAND_PROCESSOR[command] === 'function') {
    COMMAND_PROCESSOR[command](payload, postEventMessage)
      .then((workerResult) => {
        self.postMessage({
          echo: {
            command: command,
            payload: payload
          },
          type: 'result',
          payload: workerResult
        })
      })
      .catch(error => {
        self.postMessage({
          echo: {
            command: command,
            payload: payload
          },
          type: 'error',
          payload: error
        })
      })
  } else {
    throw new Error('Unknown command')
  }
}, false)

self.addEventListener('messageerror', (event) => {
  // TODO more logging
  console.error(event.data)
})

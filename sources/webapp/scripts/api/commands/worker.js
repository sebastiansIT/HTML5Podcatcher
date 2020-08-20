/** The HTML5Podcatcher Command Worker. This
    {@link https://developer.mozilla.org/en-US/docs/Web/API/Worker|Web Worker}
    is a generic endpoint to call a command prozessor. Whenever this worker is
    instanciatet it is necessary to give him a name. This name is used to find
    the implementation of the command prozessor to use.

    Messages send to the worker has to contain a
    {@link modul:podcatcher/commands/worker~CommandRequest|CommandRequest}
    in there data property of the message.

    Each command send one or more
    {@link modul:podcatcher/commands/worker~CommandResponse|CommandResponse}
    back to the caller.

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

/**
 * The file name of the command prozessor to use. It is based on the name of
 * the worker.
 * @constant {string}
 */
const commandProzessorUrl = self.name + '.js'
self.importScripts(commandProzessorUrl)

/**
 * The command prozessor used by this worker.
 * @constant {module:podcatcher/commands/processor.BaseCommandProcessor}
 */
const COMMAND_PROCESSOR = new self.CommandProcessor(self)

/**
 * A command request.
 * @typedef {object} CommandRequest
 * @property {string} command - The command - it is also the name of the method called from the command prozessor.
 * @property {object} payload - The payload for the command.
 */

/**
  * A command response.
  * It is possible to have more than one response per request.
  * @typedef {object} CommandResponse
  * @property {CommandRequest} echo - The original CommandRequest.
  * @property {'result'|'event'|'error'} type - The type of the response.
  * @property {object} payload - The result of the command, the event data or the error.
  */

/*
 * Listens for messages from the client and call the command prozessor.
 */
self.addEventListener('message', (event) => {
  console.debug(`Command ${event.data.command} is called.`)

  // check event.data.command exists
  const command = event.data.command
  if (!command) {
    throw new Error('Command is missing in message to worker')
  }
  const payload = event.data.payload

  const postEventMessage = (eventName, eventPayload) => {
    self.postMessage({
      echo: {
        command: command,
        payload: payload
      },
      type: 'event',
      payload: {
        name: eventName,
        data: eventPayload
      }
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
  console.error(event.data)
})

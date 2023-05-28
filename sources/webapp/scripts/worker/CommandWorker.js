class CommandWorker {
    dedicatedWorker;

    constructor(workerScript) {
        if (window.Worker) {
            this.dedicatedWorker = new Worker(workerScript, { type: "module" })
            /*this.dedicatedWorker.onmessage = (event) => {
                console.log(`Report received from worker: `, event.data)
            };
            this.dedicatedWorker.onerror = (event) => {
                console.error(event)
            }*/
            this.dedicatedWorker.messageerror = (event) => {
                console.error(event)
            }
        } else {
            throw "Worker are not supported!"
        } 
    }

    terminate() {
        this.dedicatedWorker.terminate()
    }

    command(order, data) {
        const commandId = crypto.randomUUID()
        // Command and Report are wrapped in a promise for easy handling
        return new Promise((resolve, reject) => {
            // Listener for messages from the worker
            const messageListener = (event) => {
                if (event.data.echo.uuid === commandId) {
                    this.dedicatedWorker.removeEventListener('message', messageListener)
                    this.dedicatedWorker.removeEventListener('error', errorListener)
                    if (event.data.code === '200') {
                        resolve(event.data)
                    } else {
                        reject(event.data)
                    }
                }
            }
            // Listener for errors from the worker. Rejects all commands in queue
            const errorListener = (event) => {
                this.dedicatedWorker.removeEventListener('message', messageListener)
                this.dedicatedWorker.removeEventListener('error', errorListener)
                reject({
                    code: '500', 
                    status: 'Failed', 
                    echo: {
                        uuid: commandId,
                        order: order
                    },
                    data: event.message
                })
            }
            // Add Listeners to the worker for each single command
            this.dedicatedWorker.addEventListener("message", messageListener);
            this.dedicatedWorker.addEventListener("error", errorListener);
            // Send command to the worker
            this.dedicatedWorker.postMessage({
                uuid: commandId,
                order: order,
                data: data || null
            })
            console.log(`Command "${order}" with id ${commandId} posted to worker.`)
        })
    }

    debug() {
        return this.command('debug')
    }
}


const debugWorker = new CommandWorker('scripts/worker/PlaylistWorkerScript.js');
/*debugWorker.debug()
    .then((data) => console.log('Success!', data))
    .catch((data) => console.error('Fail!', data))*/
debugWorker.command('update')
    .then((data) => console.log('Success!', data))
    .catch((data) => console.error('Fail!', data))
/*debugWorker.command('Heiopei')
    .then((data) => console.log('Success!', data))
    .catch((data) => console.error('Fail!', data))*/
//window.setTimeout(() => debugWorker.terminate(), 100);
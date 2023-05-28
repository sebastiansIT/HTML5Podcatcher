import { downloadXML } from "../web/fetch.js"
import "./CommandWorkerScript.js"

// self.importScripts('CommandWorkerScript.js')

async function updateAllSources() {
    // TODO read list of Sources from indexedDB
    // TODO iterate over the list of sources
    return await downloadXML(
        'https://workingdraft.de/feed/'
    ).then((document) => {
        // TODO RSS-Parser
        console.log(document)
        return {}
    })
}

self.registerOrder('update', async (event) => {
    if (!event.data.data) {
        postMessage({
            code: '200', 
            status: 'Done', 
            echo: event.data,
            data: await updateAllSources()
        })
    } else {
        postMessage({
            code: '400', 
            status: 'Not executable', 
            echo: event.data,
            data: null
        })
    }
})
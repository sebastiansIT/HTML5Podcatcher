const registeredOrders = {
    debug: (event) => {
        postMessage({
            code: '200', 
            status: 'Done', 
            echo: event.data,
            data: {
                eventid: event.lastEventId,
                eventOrigin: event.origin,
                workerScript: {
                    location: self.location.href,
                    isSecure: self.isSecureContext,
                    origin: self.origin
                }
            }
        })
    },
    echo: (event) => {
        postMessage({
            code: '200', 
            status: 'Done', 
            echo: event.data,
            data: event.data
        })
    }
}

self.registerOrder = (order, handler) => {
    registeredOrders[order] = handler
}

onmessage = (event) => {
    console.debug(`Command received from main script: `, event.data)
    if (registeredOrders[event.data.order]) {
        registeredOrders[event.data.order](event)
    } else {
        postMessage({
            code: '404',
            status: 'Not familiar',
            echo: event.data,
            data: undefined
        })
    }
}
  
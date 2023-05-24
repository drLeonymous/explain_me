import { createParser } from 'eventsource-parser'

const readStream = (reader: ReadableStreamDefaultReader, callback: Function) => {
    reader.read().then(({ done, value }: any) => {
        if (done) {
            reader.releaseLock()
            return null
        }
        callback(value)
        return readStream(reader, callback)
    })
}

const streamAsyncIterable = (stream: ReadableStream, callback: Function) => {
    const reader = stream.getReader()
    readStream(reader, callback)
}

const postToContentScript = (payload: { port: chrome.runtime.Port, action: string, mes: string }) => {
    const { port, action, mes } = payload
    port.postMessage({
        action,
        portName: port.name,
        result: mes,
    })
}

const queryChatGPT = async (port: chrome.runtime.Port, query: string) => {
    let API_KEY = null;
    try {
        const keyObj = await chrome.storage.local.get('openaiKey')
        API_KEY = structuredClone(keyObj).openaiKey
    } catch (error) {
        postToContentScript({
            port,
            action: 'ans',
            mes: error,
        })
        return error
    }
    if (!API_KEY) {
        postToContentScript({
            port,
            action: 'ans',
            mes: '[ERROR] Missing API key',
        })
        return '[ERROR] Missing API key'
    }
    const getMaxTokenNum = (_query: string): number => {
        // split the query by " " and count it, then accordinglly return token numbers
        return 240;
    }
    try {
        // Use the fetch API to call the ChatGPT API
        let result = ''
        const resp = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                // model: 'text-davinci-003',
                model: 'text-curie-001',
                prompt: `In the most simple terms explain this: ${query}`,
                temperature: 0.5,
                max_tokens: getMaxTokenNum(query),
                stream: true,
            }),
        })

        if (!resp.ok) {
            throw new Error('[ERROR] ChatGPT failed, please check your API key or use another sentence')
        }
        const parser = createParser(event => {
            if (event.type === 'event') {
                const message = event.data
                if (message === '[DONE]') {
                    port.disconnect()
                    return
                }
                let data
                try {
                    data = JSON.parse(message)
                    const { text } = data.choices[0]
                    if (text === '<|im_end|>' || text === '<|im_sep|>') {
                        return
                    }
                    result += text
                    postToContentScript({
                        port,
                        action: 'ans',
                        mes: result,
                    })
                } catch (err) {
                    postToContentScript({
                        port,
                        action: 'ans',
                        mes: err,
                    })
                }
            }
        })
        streamAsyncIterable(resp.body!, (value: BufferSource) => {
            const str = new TextDecoder().decode(value)
            parser.feed(str)
        })
    } catch (err) {
        postToContentScript({
            port,
            action: 'ans',
            mes: err.message,
        })
        return err
    }
    return ''
}

chrome.runtime.onConnect.addListener(port => {
    if (port.name.startsWith('content-script')) {
        port.onMessage.addListener(async (msg: any) => {
            try {
                const query = msg
                queryChatGPT(port, query)
            } catch (err: any) {
                console.error(err)
                postToContentScript({
                    port,
                    action: 'ans',
                    mes: err.message,
                })
            }
        })
    }
})

chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
        id: 'explain-me',
        title: 'Explain Me',
        contexts: ['selection'],
    })

    chrome.contextMenus.onClicked.addListener(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'contextMenu',
            })
        })
    })
})

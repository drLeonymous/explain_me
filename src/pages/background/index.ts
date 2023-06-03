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
    let API_KEY = null
    let _PROMPT = null
    let MODEL = null
    let TEMP = 0
    let TRETURN = 0
    try {
        let storage = await chrome.storage.local.get()
        storage = structuredClone(storage);
        ({
            openaiKey: API_KEY,
            p: _PROMPT,
            m: MODEL,
            t: TEMP,
            tr: TRETURN,
        } = storage)
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

    try {
        // Pricing: https://openai.com/pricing
        // Rate limits: https://platform.openai.com/account/rate-limits
        // usage: https://platform.openai.com/account/usage
        // Fetch ChatGPT' API
        let result = ''
        const resp: Response = await fetch('https://api.openai.com/v1/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL || "text-davinci-003",
                prompt: `${_PROMPT || 'In the most simple terms explain this:'} ${query}`,
                temperature: Number(TEMP) || 0.5,
                max_tokens: Number(TRETURN) || 240,
                stream: true,
            }),
        })

        if (!resp.ok) {
            return resp.json()
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

chrome.runtime.onConnect.addListener((port) => {
    if (port.name.startsWith('content-script')) {
        port.onMessage.addListener(async (msg) => {
            try {
                const resp = await queryChatGPT(port, msg);
                if (resp?.error) {
                    postToContentScript({
                        port,
                        action: 'ans',
                        mes: `[ERROR]:: ${resp.error?.code}`,
                    })
                }
            } catch (err: any) {
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

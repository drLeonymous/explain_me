// This script gets injected into any opened page
// whose URL matches the pattern defined in the manifest
// (see "content_script" key).
// Several foreground scripts can be declared
// and injected into the same or different pages.

let iconButtonRef: HTMLElement = null
let contentRef: HTMLElement = null
const popoverID = 'popover-button-id'
const contentID = 'content-window-id'
let port = null as chrome.runtime.Port
let currentPortName = null as string

// base64 string of logo-48.png, to avoid using 'web_accessible_resources' in manifest
// eslint-disable-next-line max-len
const image = `data:image/png;base64,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`

const cls = {
    iconButton: () => {
        if (iconButtonRef) {
            document.body.removeChild(iconButtonRef)
            iconButtonRef = null
        }
    },

    content: () => {
        if (contentRef) {
            document.body.removeChild(contentRef)
            contentRef = null
        }
    },
    all: () => {
        cls.iconButton()
        cls.content()
    }
}

const setResponseToWindow = (res: string) => {
    if (contentRef) contentRef.innerHTML = res
}

const getPosition = () => document.getSelection().getRangeAt(0).getBoundingClientRect()

const initContentWindow = (pos?: any) => {
    pos = pos || getPosition()
    const { x, y, height } = pos

    contentRef = document.createElement('div')
    contentRef.id = contentID
    contentRef.style.boxShadow = 'rgba(0, 0, 0, 0.2) 0px 1px 3px'
    contentRef.style.background = `url('${image}') no-repeat left center rgb(243, 243, 243)`
    contentRef.style.border = '1px solid rgb(187, 187, 187)'
    contentRef.style.padding = '10px 10px 10px 40px'
    contentRef.style.position = 'absolute'
    contentRef.style.left = `${x}px`
    contentRef.style.top = `${y + height + window.scrollY}px`
    contentRef.style.zIndex = '2147483647'
    contentRef.style.width = '50vw'
    contentRef.style.color = 'black'
    contentRef.innerHTML = 'Waiting for response...'

    document.body.appendChild(contentRef)
}

const queryGPT = (text: string) => {
    const uuid = Math.random().toString(36).substring(2, 15)
    currentPortName = `content-script-${uuid}`

    port = chrome.runtime.connect({
        name: currentPortName,
    })

    port.postMessage(text)

    port.onMessage.addListener(async (message: any) => {
        if (message.action === 'ans' && message.portName === currentPortName) {
            setResponseToWindow(message.result)
        }
    })
}

document.addEventListener('selectionEnd', () => {
    const pos = getPosition()
    const { x, y, height } = pos
    const selectionText = document.getSelection().toString()
    if (selectionText.length > 1) {
        iconButtonRef = document.createElement('div')
        iconButtonRef.id = popoverID
        iconButtonRef.style.background = `url('${image}') no-repeat center rgb(243, 243, 243)`
        iconButtonRef.style.border = 'rgb(187, 187, 187)'
        iconButtonRef.style.position = 'absolute'
        iconButtonRef.style.height = '32px'
        iconButtonRef.style.width = '32px'
        iconButtonRef.style.left = `${x}px`
        iconButtonRef.style.top = `${y + height + window.scrollY}px`
        iconButtonRef.style.zIndex = '2147483647'
        iconButtonRef.style.padding = '2px'
        iconButtonRef.style.borderRadius = '5px'

        iconButtonRef.onmouseover = () => {
            iconButtonRef.style.cursor = 'pointer'
        }
        iconButtonRef.onclick = async () => {
            initContentWindow(pos)
            queryGPT(selectionText)
        }

        document.body.appendChild(iconButtonRef)
    }
})
document.addEventListener('click', (evt: MouseEvent) => {
    const { id } = evt.target as any
    if (id === contentID || id === popoverID) cls.iconButton()
    else cls.all()
})

// [REGION] debounce of selection event and icon appear
class SelectedEvent extends Event {
    info: Record<string, number>

    constructor(type: string, info: Record<string, number>) {
        super(type)
        this.info = info
    }
}

let selectionEndTimeout: NodeJS.Timeout = null
document.addEventListener('mouseup', (evt: MouseEvent) => {
    selectionEndTimeout = setTimeout(() => {
        const noContentWindow = !contentRef
        const haveText = window.getSelection().toString() !== ''
        if (noContentWindow && haveText) {
            const info = {
                x: evt.pageX - document.body.scrollLeft,
                y: evt.pageY - document.body.scrollTop,
            }
            const selectionEndEvent = new SelectedEvent('selectionEnd', info)
            document.dispatchEvent(selectionEndEvent)
        }
    }, 100)
})

document.addEventListener('selectionchange', () => {
    if (selectionEndTimeout) {
        clearTimeout(selectionEndTimeout)
    }
})
// [ENDREGION]

chrome.runtime.onMessage.addListener(async (message: any) => {
    if (message.action === 'contextMenu') {
        cls.all()
        const selectionText = document.getSelection().toString()
        initContentWindow()
        queryGPT(selectionText)
    }
})

document.addEventListener('DOMContentLoaded', () => {
    const inputField = document.getElementById('api_key_input_field') as HTMLInputElement
    const saveBtn = document.getElementById('save_btn') as HTMLButtonElement

    saveBtn.addEventListener('click', async () => {
        const key = inputField.value
        await chrome.storage.local.set({ openaiKey: key })
        window.close()
    })

    document.querySelector('#go-to-options').addEventListener('click', function () {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage()
        } else {
            window.open(chrome.runtime.getURL('options/index.html'))
        }
    })
})

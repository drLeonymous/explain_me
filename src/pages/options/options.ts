const _prompt = document.getElementById('prompt') as HTMLInputElement
const model = document.getElementById('model') as HTMLSelectElement
const temp = document.getElementById('model_temperture') as HTMLInputElement
const output = document.getElementById('temp_value') as HTMLDivElement
const treturn = document.getElementById('treturn') as HTMLInputElement
const trOutput = document.getElementById('treturn_value') as HTMLDivElement
const save = document.getElementById('save_btn') as HTMLButtonElement
const reset = document.getElementById('reset_btn') as HTMLButtonElement

const ft = (t: any) => Number.parseFloat(t).toFixed(1)
const restFromStorage = async () => {
    const { p, m, t, tr } = await chrome.storage.local.get()
    _prompt.value = p || 'In the most simple terms explain this'
    model.value = m || 'text-davinci-003'
    temp.value = t || 0.5
    output.innerHTML = t || 0.5
    treturn.value = tr || 240
    trOutput.innerHTML = tr || 240
}

window.addEventListener('load', async () => restFromStorage())

output.innerHTML = ft(temp.value)
temp.oninput = (e: any) => { output.innerHTML = ft(e.target.value) }

trOutput.innerHTML = ft(treturn.value)
treturn.oninput = (e: any) => { trOutput.innerHTML = ft(e.target.value) }

save.onclick = async () => {
    await chrome.storage.local.set({
        p: _prompt.value,
        m: model.value,
        t: temp.value,
        tr: treturn.value,
    })
    window.close()
}

reset.onclick = async () => {
    await restFromStorage()
}

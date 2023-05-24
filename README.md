# ![Explain me](src/pages/assets/logo96.png) Explain me! #

## The Chrome extention that explain selected text with ChatGPT AI models ##
---

1. `git clone <repo address>`
2. `cd explain_me`
3. `yarn && yarn build`
4. Open your Chrome browser and navigate to `chrome://extensions/`
5. Toggle ON `Developers Mode` and click on `Load unpacked` 
7. Navigate to `explain-me/dist` folder and click `Select`
8. Add a `New Tab` and up right click on `Extensions` and pin `Explain me!`
9. Click on `Explain me!` and register your OpenAPI Key! If you don't have one go to [OpenAI](https://beta.openai.com/account/api-keys) and get one!
10. If you are not satisfied with the model explains, edit `explain_me/src/background/index.ts` and uncomment line 66 then comment line 67. Increase the temperature if you want.
11. Run `yarn build` and don't forget to reload your extension
12. Have fun!


Cheers ;) !
<br/>
drLeo


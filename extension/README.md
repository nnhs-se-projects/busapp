# Bus App Browser Extension

This is a simple extension that just contains an iframe that shows the /extension page on the Bus App. There is some Javascript to resize the iframe to the content, but that is all this extension does.

The extension is published to Firefox Add-Ons [here](https://addons.mozilla.org/en-US/firefox/addon/nnhs-bus-app/) and to the Chrome Web Store [here]().

Ask Mr. Schmit for access to the accounts to update the addons if you need to.


## Building

run `./pack.sh` in an sh-compliant terminal from the extension directory to pack the extensions into a zip file that can be uploaded to an extension marketplace. Make sure to update the version in manifest.json as well!

You can add files to the command in the script if more files are added to the extension.


## Testing

You can change the source of the iframe to a localhost version of the page. Then look up how to load an "unpacked extension" for your browser, and load this folder. The extension should update automatically for most changes on most browsers, otherwise you can manually reload it.

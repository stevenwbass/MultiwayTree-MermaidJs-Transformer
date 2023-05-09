# MultiwayTree-MermaidJs-Transformer
Transform MultiwayTrees into MermaidJs chart definitions (text) and vice versa

This is part of a larger effort to evolve a data collection platform. It will probably not be of interest to anyone, so it is not published on NPM.

The most convenient way to debug tests is to use VS Code's built-in "Run and Debug" (Ctrl+Shift+D). The project has a `launch.json` file to support this, but you will still have to select the "test" script as the "Run Script".

To debug in any Chromium-based browser:
  1. execute `npm run debug-test`
  2. open the browser and go to chrome://inspect
  3. click on "Open Dedicated DevTools for Node"
  4. click on the address displayed in the terminal (usually something like localhost:9229)

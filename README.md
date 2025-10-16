# Sharat

I wanted my students to start web development with TypeScript, but without the overhead of comiling TS files, so I created Sharat.

Sharat is a static file server, similar to other projects such as serve, live-server and http-server to name a few.
However, Sharat would also compile TS files before serving them, making development with TypeScript feel like using JavaScript directly.

Some of Sharat's features:
1. Serve static files from a desired folder
2. Compile TS and SCSS files before serving
3. Configure TypeScript compilation by using a tsconfig.json file
4. Watch for file changes and refresh the page

> [!CAUTION]  
> **DO NOT USE Sharat IN PRODUCTION!**  
> Sharat is meant for learning purposes and POCs, please compile and serve your application properly in production.

## Usage
The recommended usage is with NPX.  
From a terminal, go to the project you'd like to serve, and run:
```bash
> cd to/site/root
> npx sharat
```
This would start the development server and serve files from the specific folder you're in.

A less recommended option is with a global installation.  
Start by installing Sharat globally using NPM:
```bash
> npm i -g sharat
```
Then go to the desired folder and run Sharat directly:
```bash
> cd to/site/root
> sharat
```

## Debugging
In case you want to see the debug logs, you should set the environment variable SHOW_DEBUG_LOGS to "true".  
It's also possible to create a `sharat.env` file in the root directory you're serving, and add the setting there:
```bash
# path/to/site/root/sharat.env

SHOW_DEBUG_LOGS=true
```

## Change log
* v0.1.0
    * Added auto refresh on file changes
    * Added `SHOW_DEBUG_LOGS` environment variable
    * Split from single file to multiple files
    * Create readme file
* v0.0.3
    * Initial release

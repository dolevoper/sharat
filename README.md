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

# PieceMeta Angular Frontend #

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/a8510f7272624ce6984596467256f8fa)](https://www.codacy.com/app/dasantonym/piecemeta-angular-frontend?utm_source=github.com&utm_medium=referral&utm_content=PieceMeta/piecemeta-angular-frontend&utm_campaign=badger)
[![Code Climate](https://codeclimate.com/github/PieceMeta/piecemeta-angular-frontend/badges/gpa.svg)](https://codeclimate.com/github/PieceMeta/piecemeta-angular-frontend) [![devDependency Status](https://david-dm.org/PieceMeta/piecemeta-angular-frontend/dev-status.svg)](https://david-dm.org/PieceMeta/piecemeta-angular-frontend#info=devDependencies)

The Web and NodeWebkit frontend based on [AngularJS](https://angularjs.org/) for the [PieceMeta](http://www.piecemeta.com) service.

**Important: This version of the frontend (1.x.x) is only compatible with the [LMDB branch](https://github.com/PieceMeta/piecemeta-api/tree/lmdb) of the API **

## Stability

Experimental: Expect the unexpected. Please provide feedback on api and your use-case.

## Web Frontend ##

The web app consists of static code only so you can just clone the repo, set the ``dist/web`` folder as the document root and it should work.

Since the app uses Angular in HTML5 mode, you need to make sure that every 404 not found error gets redirected to index.html. There's a bundled .htaccess so at least apache setup should be effortless.

### Development ###

Copy ``configuration.default.js`` to ``configuration.js`` and update as needed.

```shell
npm install
bower install
gulp build-web
```

## NodeWebkit Frontend ##

To build the native modules you need [nw-gyp](https://github.com/nwjs/nw-gyp) and [node-pre-gyp](https://github.com/mapbox/node-pre-gyp).

Once built you'll find the resulting app in the ``build`` folder. To build a Node-Webkit application, edit `gulpfile.js` and enter your platform at the bottom in the `build-webkit-app` task. It can then be built with:

```shell
npm install
bower install
cd dist/nw
npm install
cd ..
gulp node-webkit
```

After the basic build you need to perform these steps to rebuild the native modules for your architecture. You only need to do this one time, the binaries are reused each time you run the grunt task.

```shell
cd dist/nw/node_modules/osc/node_modules/serialport
node-pre-gyp rebuild --target=0.12.1 --runtime=node-webkit
cd ../ws/node_modules/bufferutil
nw-gyp configure --target=0.12.1
nw-gyp build
cd ../utf-8-validate
nw-gyp configure --target=0.12.1
nw-gyp build
```

Finally, you can build your Node-Webkit app with:

```
gulp build-webkit-app
```

**Note:** If you are building for Windows, you need to flatten ``dist/nw/node_modules`` before building the app. This is due to the 256 character path length limit in Windows.

Install [flatten-packages](https://github.com/arifsetiawan/flatten) and then run

```shell
cd dist/nw/
flatten-packages
```

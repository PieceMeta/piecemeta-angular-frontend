# PieceMeta Angular Frontends #

[![Code Climate](https://codeclimate.com/github/PieceMeta/piecemeta-angular-frontend/badges/gpa.svg)](https://codeclimate.com/github/PieceMeta/piecemeta-angular-frontend) [![devDependency Status](https://david-dm.org/PieceMeta/piecemeta-angular-frontend/dev-status.svg)](https://david-dm.org/PieceMeta/piecemeta-angular-frontend#info=devDependencies)

The Web and NodeWebkit frontends based on [AngularJS](https://angularjs.org/) for the [PieceMeta](http://www.piecemeta.com) service.

## Web Frontend ##

The web app consists of static code only so you can just clone the repo, set the ``dist/web`` folder as the document root and it should work.

Since the app uses Angular in HTML5 mode, you need to make sure that every 404 not found error gets redirected to index.html. There's a bundled .htaccess so at least apache setup should be effortless.

### Development ###

Copy ``configuration.default.js`` to ``configuration.js`` and update as needed.

```shell
npm install
bower install
grunt build-web
```

To watch and rebuild automatically:

```shell
grunt watch:web
```

## NodeWebkit Frontend ##

To build the native modules you need [nw-gyp](https://github.com/nwjs/nw-gyp) and [node-pre-gyp](https://github.com/mapbox/node-pre-gyp).

Once built you'll find the resulting app in the ``build`` folder. To build a Node-Webkit application, edit `Gruntfile.js` and enter your platform at the bottom in the `nodewebkit` task. It can then be built with:

```shell
npm install
bower install
cd dist/nw
npm install
cd ..
grunt build-nw
```

After the basic build you need to perform these steps to rebuild the native modules for your architecture. You only need to do this one time, the binaries are reused each time you run the grunt task.

```shell
cd dist/nw/node_modules/osc/node_modules/serialport
node-pre-gyp rebuild --target=0.12.0 --runtime=node-webkit
cd ../ws/node_modules/bufferutil
nw-gyp configure --target=0.12.0
nw-gyp build
cd ../utf-8-validate
nw-gyp configure --target=0.12.0
nw-gyp build
```

To watch and rebuild JS and HTML automatically:

```shell
grunt watch:nw
```

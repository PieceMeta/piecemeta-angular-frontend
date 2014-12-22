# PieceMeta Angular Frontends #

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

## NodeWebkit Frontend (Coming soon) ##

Once built you'll find the resulting app in the ``build`` folder. The frontend for a local Node-Webkit application can be built with:

```shell
npm install
bower install
cd dist/nw
npm install
cd ..
grunt build-nw
```

To watch and rebuild automatically:

```shell
grunt watch:nw
```

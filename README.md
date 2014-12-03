# PieceMeta Angular Frontend #

Web frontend based on [AngularJS](https://angularjs.org/) for the [PieceMeta](http://www.piecemeta.com) service.

The app consists of static code only so you can just clone the repo, set the ``dist`` folder as the document root and it should work.

Since the app uses Angular in HTML5 mode, you need to make sure that every 404 not found error gets redirected to index.html. There's a bundled .htaccess so at least apache setup should be effortless.


## Development ##

Copy ``configuration.default.js`` to ``configuration.js`` and update as needed.

```shell
npm install
bower install
grunt
```

To watch and rebuild automatically:

```shell
grunt dev
```

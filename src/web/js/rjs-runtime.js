/* global require,angular,document */

(function () {
    'use strict';

    require.config({
        urlArgs: "build=16061701",
        paths: {
            config: '/js/configuration',

            controllers_site: '/src/web/js/controllers/site',
            controllers_users: '/src/web/js/controllers/users',
            controllers_basic_resource: '/src/shared/js/controllers/basic-resource',
            controllers_packages: '/src/shared/js/controllers/packages',
            controllers_channels: '/src/shared/js/controllers/channels',
            controllers_streams: '/src/shared/js/controllers/streams',

            directives_helpers: '/src/shared/js/directives/helpers',

            services_api: '/src/shared/js/services/api',
            services_auth: '/src/shared/js/services/auth',

            services_importers_bvh: '/src/shared/js/services/importers/bvh',
            services_importers_json: '/src/shared/js/services/importers/json',
            services_importers_text: '/src/shared/js/services/importers/text',
            services_importers_trac: '/src/shared/js/services/importers/trac',

            piecemeta_frontend: '/src/web/js/app'
        }
    });

    require([
            'piecemeta_frontend'
        ], function (piecemeta_frontend) {
            angular.bootstrap(document, ['piecemeta-frontend']);
        }
    );

})();
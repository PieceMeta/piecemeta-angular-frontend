angular.module('piecemeta-web.services.spatial-viewer', []).
    factory('spatialViewer', [function () {
        'use strict';
        var viewer = {
            scene : new THREE.Scene(),
            renderer: new THREE.CanvasRenderer(),
            hierarchy: new THREE.Object3D(),
            camera : null,
            meshes : {},
            dataSequence : null,
            frameIndex: 0,
            frameCount: 0,
            init : function (dataPackage, targetSelector, callback) {
                var width = document.querySelector(targetSelector).offsetWidth,
                    height = document.querySelector(targetSelector).offsetHeight;

                if (height === 0) {
                    height = 320;
                }

                viewer.dataPackage = dataPackage;
                viewer.camera = new THREE.PerspectiveCamera(75, width / height, 1, 10000);
                viewer.camera.position.z = 1000;
                viewer.renderer.setSize(width, height);

                for (var i in dataPackage.data_channels) {
                    if (typeof dataPackage.data_channels[i] === 'object') {
                        var geometry = new THREE.BoxGeometry(10, 10, 10),
                            material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }),
                            mesh = new THREE.Mesh(geometry, material);
                        viewer.meshes[dataPackage.data_channels[i].id] = mesh;
                        for (var s in dataPackage.data_channels[i].data_streams) {
                            if (typeof dataPackage.data_channels[i].data_streams[s] === 'object') {
                                var stream = dataPackage.data_channels[i].data_streams[s];
                                if (stream.data_frames.length > viewer.frameCount) {
                                    viewer.frameCount = stream.data_frames.length;
                                }
                                if (typeof stream.data_frames[viewer.frameIndex] === 'number') {
                                    viewer.meshes[dataPackage.data_channels[i].id][stream.group][stream.title] = (stream.value_offset + stream.data_frames[viewer.frameIndex])*10;
                                }
                            }
                        }
                    }
                }

                for (var n in dataPackage.data_channels) {
                    if (typeof dataPackage.data_channels[n] === 'object') {
                        var channel = dataPackage.data_channels[n];
                        if (channel.parent_data_channel_id) {
                            viewer.meshes[channel.parent_data_channel_id].add(viewer.meshes[channel.id]);
                        } else {
                            viewer.hierarchy.add(viewer.meshes[channel.id]);
                        }
                    }
                }

                viewer.scene.add(viewer.hierarchy);
                document.querySelector(targetSelector).appendChild(viewer.renderer.domElement);
                viewer.animate();
                if (typeof callback === 'function') {
                    callback();
                }
            },
            animate : function () {
                window.requestAnimationFrame(viewer.animate);



                viewer.renderer.render(viewer.scene, viewer.camera);
            }
        };
        return viewer;
    }]);
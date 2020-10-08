
import 'tinymce-mention';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as MapboxDrawGeodesic from 'mapbox-gl-draw-geodesic';
import gantt from 'dhtmlx-gantt';
import '../services/gantt/ganttAPI';
import html2canvas from 'html2canvas';
import {
    getDrawStyles, deleteMarkerWithPopup, createPopup, getIdElement, setMapHTML,
} from '../services/mapbox';
import {
    setGanttHTML, ganttConfig,
} from '../services/gantt/gantt';
import {
    createTodayMarker, getMarker, updateMarker, checkProject, addMarker,
    checkParentDeadline, showAlert, taskUpdate, resizeLayout,
} from '../services/gantt/utils';

function diagramGanttPlugin(pageId) {
    let markers = [];
    let currentMarker = '';

    function showDiagramm(diagrammID) {

        let ganttID = diagrammID;
        let gantts;
        const parentDiv = document.createElement('div');
        parentDiv.setAttribute('class', 'fullscreen');
        parentDiv.style.backgroundColor = '#FFFFFF';
        document.body.appendChild(parentDiv);
        parentDiv.innerHTML += setGanttHTML();

        ganttConfig(gantt);

        gantt.attachEvent('onAfterTaskDelete', function (id, item) {
            gantt.deleteMarker(id);
        });

        gantt.attachEvent('onLightboxSave', function (id, task, is_new) {

            if (!is_new && !checkProject(task.id)) {
                const { text, end_date } = task;
                const marker = getMarker(markers, id);
                updateMarker(marker, end_date, text);
            };
            return true;
        });

        gantt.attachEvent('onBeforeTaskAdd', function () {

            if (!gantt.getTaskCount()) {
                createTodayMarker(gantt);
            };
            return true;
        });

        gantt.attachEvent('onAfterTaskAdd', function (id, item) {

            if (!checkProject(id)) {
                const marker = addMarker(item.end_date, 'project_marker', item.text, item.id)
                markers.push(marker);
                gantt.render();
                return;
            }
            checkParentDeadline(markers, id, item);
            gantt.updateTask(id)
            gantt.render();
        });

        gantt.attachEvent('onAfterTaskUpdate', function (id, item) {

            if (gantt.getParent(id)) {
                checkParentDeadline(markers, id, item);
            } else {
                const marker = getMarker(markers, id);
                if (marker) {
                    const markerDate = gantt.getMarker(marker).start_date;
                    const taskDate = item.end_date;
                    if ((markerDate - taskDate) < 0) {
                        showAlert('Ошибка', 'alert-error', `Вы превысили дедлайн проекта ${item.text}`);
                        taskUpdate(markerDate, id);
                    } else if ((markerDate - taskDate) > 0) {
                        updateMarker(marker, item.end_date);
                    }
                }
            }
            gantt.render();
        });


        gantt.attachEvent('onScaleClick', function (e, date) {

            if (currentMarker) {
                const marker = gantt.getMarker(currentMarker);
                if (date == marker.start_date) {
                    gantt.deleteMarker(currentMarker);
                    currentMarker = null;
                } else {
                    updateMarker(currentMarker, date);
                }
            } else {
                currentMarker = addMarker(date, 'status_line', 'Текущий статус')
            }
        });

        gantt.attachEvent('onGanttScroll', function (left, top) {
            const scroll_position = gantt.getScrollState().y + 'px';
            const markers = document.querySelectorAll('.gantt_marker_content');
            markers.forEach(marker => marker.style.top = scroll_position);
        });

        async function containerClickHandler({ target }) {

            if (target.tagName === 'BUTTON') {
                const btnID = target.id;

                switch (btnID) {
                    case 'save_btn':

                        resizeLayout(gantt, 'xy', false);
                        const jsonGanttData = gantt.serialize('json');

                        const ganttData = {
                            json: jsonGanttData,
                            currentMarker: gantt.getMarker(currentMarker),
                            markers: markers.map(marker => gantt.getMarker(marker)),
                        };

                        const data = {
                            image: await html2canvas(document.querySelector('#gantt_here')).then(canvas => canvas.toDataURL()),
                            uploaded_to: pageId,
                        };
                        const { path } = (await window.$http.post(window.baseUrl(`/images/drawio`), data)).data;
                        gantts = JSON.parse(localStorage.getItem('gantt')) || [];

                        if (ganttID) {
                            const img = tinymce.activeEditor.selection.getNode();
                            editor.dom.setAttrib(img, 'src', path);
                            img.style.minHeight = '100px';

                            gantts = gantts.map(gantt => {
                                if (gantt.id == ganttID) {
                                    return {
                                        ...gantt,
                                        ganttData,
                                    }
                                }
                                return gantt;
                            });
                        } else {
                            ganttID = Date.now();
                            gantts.push({
                                id: ganttID,
                                ganttData,
                            })
                            editor.insertContent(`
                            <img data-id=${ganttID} data-type="gantt" src="${path}" style="min-height:100px"
                            alt="gantt-${ganttID}"
                            />
                            `);
                        };
                        localStorage.setItem('gantt', JSON.stringify(gantts));
                        parentDiv.removeEventListener('click', containerClickHandler);
                        parentDiv.remove();
                        break;
                    case 'export_to_pdf':

                        gantt.exportToPDF({
                            locale: 'ru',
                            raw: true,
                        });
                        break
                    case 'zoom_in':
                        gantt.ext.zoom.zoomIn();
                        break;
                    case 'zoom_out':
                        gantt.ext.zoom.zoomOut();
                        break;
                    case 'exit_btn':
                        parentDiv.removeEventListener('click', containerClickHandler);
                        parentDiv.remove();
                        break;
                    default: break;
                }
            }
        };

        if (ganttID) {
            gantt.resetLayout();
            resizeLayout(gantt, false, true)
            gantts = JSON.parse(localStorage.getItem('gantt'));
            const currentGantt = gantts.find(gantt => gantt.id == ganttID);
            const { ganttData } = currentGantt;
            const { json } = ganttData;
            gantt.parse(json);
            createTodayMarker(gantt);

            if (ganttData.markers.length) {
                ganttData.markers.forEach(marker => {
                    markers.push(addMarker(marker.start_date, marker.css, marker.text, marker.id))
                });
            }
            if (ganttData.currentMarker) {
                const { start_date, css, text, id } = ganttData.currentMarker;;
                currentMarker = addMarker(start_date, css, text, id);
            }
        }
        parentDiv.addEventListener('click', containerClickHandler)
    }

    window.tinymce.PluginManager.add('gantt', function (editor, url) {

        editor.addButton('gantt', {
            type: 'button',
            tooltip: 'diagramm',
            image: url + '/diagram-icon.png',
            onclick() {
                showDiagramm();
            }
        });

        editor.on('dblclick', event => {
            const { type, id } = event.target.dataset;
            if (type === 'gantt') {
                showDiagramm(id);
            }
        });
    });
}

function mapboxPlugin(pageId) {

    function showMap(editor, pageId, mapId) {
        mapboxgl.accessToken = 'pk.eyJ1IjoieGF2aTc3NyIsImEiOiJja2VlM3ZqY3AwYzlmMnlveWVpcXZ5cmRyIn0.-NW-vPH9v5Cgl977p4bG3A';

        const currentMapId = mapId;
        let markersOnMap = [];

        const parentDiv = document.createElement('div');
        parentDiv.setAttribute('class', 'fullscreen');
        parentDiv.style.backgroundColor = '#FFFFFF';
        document.body.appendChild(parentDiv);
        parentDiv.innerHTML += setMapHTML();

        const mapDiv = document.getElementById('map');

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [37.6155, 55.7522],
            preserveDrawingBuffer: true,
            zoom: 13
        });

        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            marker: false,
            mapboxgl,
            placeholder: '     Поиск',
            language: 'ru-RU',
            collapsed: true,
        });

        map.addControl(geocoder);

        let modes = MapboxDraw.modes;
        modes = MapboxDrawGeodesic.enable(modes);

        const controls = {
            point: true,
            line_string: true,
            polygon: true,
            trash: true,
            combine_features: false,
            uncombine_features: false,
        }

        const draw = new MapboxDraw({
            modes, controls,
            styles: getDrawStyles(),
        });

        map.addControl(draw, 'top-left');

        async function containerClickHandler({ target }) {

            if (target.className === 'fullscreen') {
                parentDiv.remove();
            }

            const { id } = target;
            switch (id) {
                case ('save-map-btn'):

                    const mapData = {
                        center: map.getCenter(),
                        zoom: map.getZoom(),
                        features: draw.getAll().features,
                        markers: markersOnMap,
                    };
                    map.removeControl(geocoder);
                    map.removeControl(draw);
                    const popupBtns = document.querySelector('.popup-panel');
                    if (popupBtns) {
                        popupBtns.remove();
                    }
                    const data = {
                        image: await html2canvas(document.querySelector('#map')).then(canvas => canvas.toDataURL()),
                        uploaded_to: pageId,
                    };

                    const { path } = (await window.$http.post(window.baseUrl(`/images/drawio`), data)).data;

                    let maps = JSON.parse(localStorage.getItem('map'));

                    maps = maps ? maps
                        .map(currentMap => {
                            if (currentMap.id == currentMapId) {
                                return {
                                    id: currentMapId,
                                    mapData: {
                                        ...currentMap.mapData,
                                        markers: mapData.markers,
                                        features: [
                                            ...mapData.features,
                                        ],
                                    }
                                }
                            } else {
                                return currentMap;
                            }
                        })
                        : [];

                    if (currentMapId) {
                        const img = tinymce.activeEditor.selection.getNode();
                        editor.dom.setAttrib(img, 'src', path);
                        localStorage.setItem('map', JSON.stringify(maps));
                    } else {
                        const id = Date.now();
                        editor.insertContent(`<img data-id=${id} data-type="map" src="${path}" alt="map${id}"/>`);
                        if (maps.length) {
                            localStorage.setItem('map', JSON.stringify([...maps, { id, mapData }]));
                        } else {
                            localStorage.setItem('map', JSON.stringify([{ id, mapData }]));
                        }
                    }
                    parentDiv.remove();
                    break;
                case ('exit-map-btn'):
                    parentDiv.remove();
                    break;
                default:
                    break;
            }
        }

        function mapSubmitHandler(event) {

            event.preventDefault();
            const { target } = event;
            const { id } = target;
            if (id) {
                const formInputs = Object.fromEntries(
                    new FormData(target),
                );
                const coordinates = id.split(':');
                const { description, url } = formInputs;
                if (description) {
                    document.getElementById(id).parentNode.parentNode.remove();
                    const marker = new mapboxgl.Marker({ draggable: true })
                        .setLngLat(coordinates)
                        .setPopup(createPopup(true, id, null, map, { url, description }))
                        .addTo(map);

                    let markerElemment = marker.getElement();
                    markerElemment.id = id;

                    marker.on('dragend', () => {
                        const coordinates = marker.getLngLat();
                        markersOnMap = markersOnMap.map(currentMarker => {
                            if (currentMarker.id == id) {
                                const id = getIdElement(coordinates);
                                const { url, description } = currentMarker.popup;
                                markerElemment.id = id;
                                marker.setPopup(createPopup(true, id, null, map, { url, description }));

                                return {
                                    ...currentMarker,
                                    coordinates,
                                    id,
                                }
                            }
                            return currentMarker;
                        })
                    });

                    markersOnMap.push({
                        id,
                        coordinates: marker.getLngLat(),
                        popup: {
                            url,
                            description,
                        },
                    });
                } else {
                    document.getElementById('form-error').classList.remove('hidden');
                }
            }
        }

        function mapClickHandler(event) {
            const { target } = event;
            const clickedBtn = target.closest('button');

            if (clickedBtn) {
                const id = target.closest('div').dataset.id;
                if (clickedBtn.id === 'button-addon2') {
                    const { id } = event.target.closest('form');
                    const entitySelector = document.getElementById('entity-selector-wrap').childNodes[1];
                    entitySelector.style.display = 'block';

                    window.EntitySelectorPopup.show(function (entity) {
                        const form = document.getElementById(id);
                        const inputs = form.querySelectorAll('input');
                        if (!inputs[0].value) {
                            inputs[0].value = entity.name;
                        }
                        inputs[1].value = entity.link;
                        const errorElem = document.getElementById('form-error');
                        if (errorElem) {
                            errorElem.remove();
                        }
                    })
                }
                if (clickedBtn.id === 'delete-marker') {
                    deleteMarkerWithPopup(id);
                    markersOnMap = markersOnMap.filter(marker => marker.id !== id)

                }
                if (clickedBtn.id === 'edit-marker') {

                    deleteMarkerWithPopup(id);

                    const currentMarker = markersOnMap.find(marker => marker.id === id);
                    const { coordinates } = currentMarker;
                    const { description, url } = currentMarker.popup;

                    createPopup(false, id, coordinates, map, { description, url })
                }
            }
        }

        function mapInputHandler({ target }) {
            if (target.id === 'title') {
                const errorMessage = document.getElementById('form-error');
                if (target.value === '') {
                    errorMessage.classList.remove('hidden');
                } else {
                    errorMessage.classList.add('hidden');
                }
            }
        }

        if (currentMapId) {
            debugger;
            const maps = JSON.parse(localStorage.getItem('map'));
            const currentMap = maps.find(map => map.id == currentMapId);
            const { features, zoom, center, markers } = currentMap.mapData;
            const { lng, lat } = center;
            map.setCenter([lng, lat]);
            map.setZoom(zoom);

            if (features.length) {
                features.forEach(feature => {
                    draw.add(feature);
                });
            }

            if (markers.length) {
                markersOnMap = [...markers];

                markers.forEach(marker => {
                    const { id } = marker;
                    const { url, description } = marker.popup;
                    const current = new mapboxgl.Marker({ draggable: true })
                        .setLngLat(marker.coordinates)
                        .setPopup(createPopup(true, id, null, map, { url, description }))
                        .addTo(map);
                    const currentElement = current.getElement();
                    currentElement.id = id;

                    current.on('dragend', () => {
                        const coordinates = current.getLngLat();
                        markersOnMap = markersOnMap.map(currentMarker => {
                            if (currentMarker.id == id) {
                                const id = getIdElement(coordinates);
                                const { url, description } = currentMarker.popup;
                                currentElement.id = id;
                                current.setPopup(createPopup(true, id, null, map, { url, description }));

                                return {
                                    ...currentMarker,
                                    coordinates,
                                    id,
                                }
                            }
                            return currentMarker;
                        })
                    });
                });

            }
        }

        map.on('dblclick', event => {
            const { lngLat } = event;
            const id = getIdElement(lngLat);
            createPopup(false, id, lngLat, map);
        })

        mapDiv.addEventListener('click', mapClickHandler);
        mapDiv.addEventListener('submit', mapSubmitHandler);
        mapDiv.addEventListener('input', mapInputHandler);
        parentDiv.addEventListener('click', containerClickHandler);
    }

    window.tinymce.PluginManager.add('mapbox', function (editor, url) {

        editor.addButton('mapbox', {
            type: 'button',
            tooltip: 'map',
            image: url + '/map.png',
            onclick() {
                showMap(editor, pageId);
            }
        });

        editor.on('dblclick', event => {
            if (event.target.dataset.type === 'map') {
                showMap(editor, pageId, event.target.dataset.id);
            }
        });
    });
}
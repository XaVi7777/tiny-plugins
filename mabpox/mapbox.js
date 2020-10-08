import mapboxgl from 'mapbox-gl';

export const setMapHTML = () => {
    return `
    <div class="btn-group" role="group">
        <button id="save-map-btn" type="button" class="button">Сохранить</button>
        <button id="exit-map-btn" type="button" class="button">Выйти</button>
    </div>
    <div class="map-container">
        <div id="map"></div>
    </div>
    `
}

export const getDrawStyles = () => {
    const currentStyles = [
        {
            'id': 'highlight-active-points',
            'type': 'circle',

            'paint': {
                'circle-radius': 10,
                'circle-color': '#ffa500'
            }
        },
        {
            "id": "gl-draw-line",
            "type": "line",
            "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#D20C0C",
                "line-dasharray": [0.2, 2],
                "line-width": 2
            }
        },
        // polygon fill
        {
            "id": "gl-draw-polygon-fill",
            "type": "fill",
            "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "paint": {
                "fill-color": "#D20C0C",
                "fill-outline-color": "#D20C0C",
                "fill-opacity": 0.1
            }
        },
        // polygon outline stroke
        // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
        {
            "id": "gl-draw-polygon-stroke-active",
            "type": "line",
            "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#D20C0C",
                "line-dasharray": [0.2, 2],
                "line-width": 2
            }
        },
        // vertex point halos
        {
            "id": "gl-draw-polygon-and-line-vertex-halo-active",
            "type": "circle",
            "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
            "paint": {
                "circle-radius": 5,
                "circle-color": "#FFF"
            }
        },
        // vertex points
        {
            "id": "gl-draw-polygon-and-line-vertex-active",
            "type": "circle",
            "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
            "paint": {
                "circle-radius": 3,
                "circle-color": "#D20C0C",
            }
        },

        // INACTIVE (static, already drawn)
        // line stroke
        {
            "id": "gl-draw-line-static",
            "type": "line",
            "filter": ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#000",
                "line-width": 3
            }
        },
        // polygon fill
        {
            "id": "gl-draw-polygon-fill-static",
            "type": "fill",
            "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
            "paint": {
                "fill-color": "#000",
                "fill-outline-color": "#000",
                "fill-opacity": 0.1
            }
        },
        // polygon outline
        {
            "id": "gl-draw-polygon-stroke-static",
            "type": "line",
            "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-color": "#000",
                "line-width": 3
            }
        }
    ]
    return currentStyles;
}

export const setPopupHtml = (id, description = '', url = '') => {
    return `               
<form id="${id}">
    <input id="title" type="text"  name="description" value="${description}" class="input-base mapbox-popup-input" placeholder="Описание">
    <p id="form-error" style="color: red" class="hidden">Заполните поле!</p>
    <div class="search-box">
      <input name="url" type="text" class="form-control" 
        placeholder="URL" aria-describedby="button-addon2"
        value="${url}" 
        >
      <button  type="button" id="button-addon2">
        <svg width="1.5em" height="1.5em" viewBox="0 0 16 16" 
          fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" 
          d="M10.442 10.442a1 1 0 0 1 1.415 0l3.85 3.85a1 1 0 0 1-1.414 1.415l-3.85-3.85a1 1 0 0 1 0-1.415z"></path>
        <path fill-rule="evenodd" 
        d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"></path>
        </svg>
    </div>
    <button type="submit" class="button">Сохранить</button>
</form>
`
}

export const setPopupContent = (id, description, url) => {

    const popupBody = url ? `<h3><a href="${url}" target="_blank">${description}</a></h3>` : `<h3>${description}</h3>`
    return `
    <div class="popup-container">
    ${popupBody}
    <div data-id="${id}" class="popup-panel">
                    <button id="delete-marker" class="button svg">
                    <svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M17 5V4C17 2.89543 16.1046 2 15 2H9C7.89543 2 7 2.89543 7 4V5H4C3.44772 5 3 5.44772 3 6C3 6.55228 3.44772 7 4 7H5V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H17ZM15 4H9V5H15V4ZM17 7H7V18C7 18.5523 7.44772 19 8 19H16C16.5523 19 17 18.5523 17 18V7Z"
    fill="currentColor"
  />
  <path d="M9 9H11V17H9V9Z" fill="currentColor" />
  <path d="M13 9H15V17H13V9Z" fill="currentColor" />
</svg>
                    </button>
                    <button id="edit-marker" class="button svg">
                    <svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM18.5793 19.531C20.6758 17.698 22 15.0036 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.9616 3.28743 17.6225 5.33317 19.4535L6.99999 10.9738H9.17026L12 6.07251L14.8297 10.9738H17L18.5793 19.531ZM16.0919 21.1272L15.2056 12.9738H8.79438L7.90814 21.1272C9.15715 21.688 10.5421 22 12 22C13.4579 22 14.8428 21.688 16.0919 21.1272Z"
    fill="currentColor"
  />
</svg>
                    </button>
                    </div>
    </div>
    `
}

export const deleteMarkerWithPopup = id => {
    document.getElementById(`popup${id}`).remove();
    document.getElementById(id).remove();
}

export const createPopup = (withMarker, id, lngLat, map, inputFields = {}) => {
    const { description, url } = inputFields;

    const popupOptions = {
        closeButton: false
    }
    const popup = new mapboxgl.Popup(popupOptions)
    if (withMarker) {

        return popup
            .setHTML(setPopupContent(id, description, url))
            .on('open', () => {
                popup.getElement()
                    .setAttribute('id', `popup${id}`);
            });

    } else {
        return popup
            .setLngLat(lngLat)
            .setHTML(setPopupHtml(id, description, url))
            .addTo(map)
            .getElement()
            .setAttribute('id', `popup${id}`);
    }
}

export const getIdElement = ({ lng, lat }) => {
    return `${lng}:${lat}`;
}
import { ganttConfig } from './gantt';

export const addMarker = (start_date, css, text, id) => {
    return gantt.addMarker({
        start_date: new Date(start_date), //a Date object that sets the marker's date
        css, //a CSS class applied to the marker
        text, //the marker title
        id,
    });
}

export const createTodayMarker = gantt => {
    gantt.addMarker({
        start_date: new Date(),
        css: 'today',
        text: 'Сегодня',
    });
}

export const getMarker = (markers, id) => {
    return markers.find(marker => marker === id);
}

export const updateMarker = (marker, newDate, text) => {
    const currentMarker = gantt.getMarker(marker);
    newDate ? currentMarker.start_date = newDate : null;
    text ? currentMarker.text = text : null;
    gantt.updateMarker(marker)
}

export const taskUpdate = (newDate, id) => {
    gantt.getTask(id).end_date = newDate; //changes task's data
    gantt.updateTask(id);
    gantt.render();
}


export const showAlert = (title, type, text) => {
    return gantt.alert({
        title,
        type,
        text,
    })
}

export const checkProject = (id) => {
    return gantt.getParent(id);
}


export const checkParentDeadline = (markers, id, item) => {

    gantt.eachParent(task => {

        if (!checkProject(task.id)) {
            const marker = getMarker(markers, task.id);

            if (marker) {
                const markerDate = new Date(gantt.getMarker(marker).start_date);
                const taskDate = new Date(item.end_date);

                if ((markerDate - taskDate) < 0) {
                    showAlert('Ошибка', 'alert-error', `Вы превысили дедлайн проекта ${task.text}`);
                    taskUpdate(markerDate, id);
                }
            }
        }
    }, id);
}

export const resizeLayout = (gantt, autosize, show_grid) => {
    autosize ? gantt.config.autosize = autosize : null;
    gantt.config.show_grid = show_grid;
    gantt.config.task_height = 50;

    gantt.resetLayout();
    ganttConfig(gantt)
}
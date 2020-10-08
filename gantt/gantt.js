
export const setGanttHTML = () => {
    return `
<div class='gantt_control'>
<div class='btn-group' role='group' aria-label='Basic example'>
    <button id='zoom_in' type='button' class='button'>Увеличить</button>
    <button id='zoom_out' type='button' class='button'>Уменьшить</button>
    <button id='save_btn' type='button' class='button'>Сохранить</button>
    <button id='export_to_pdf' type='button' class='button'>Выгрузить PDF</button>
    <button id='exit_btn' type='button' class='button'>Выйти</button>
</div>
</div>

<div id='gantt_here' style='width:100%; height: calc(100vh - 52px);'></div>

</div>
`
}

export const ganttConfig = (gantt, isNew = true) => {

    gantt.plugins({
        marker: true,
        quick_info: true,
    });


    gantt.templates.scale_cell_class = function (date) {
        if (date.getDay() == 0 || date.getDay() == 6) {
            return 'weekend';
        }
    };
    gantt.templates.timeline_cell_class = function (item, date) {
        if (date.getDay() == 0 || date.getDay() == 6) {
            return 'weekend'
        }
    };

    gantt.templates.progress_text = function (start, end, task) {
        return `<span style="float: left; color: #fff"'> + ${Math.round(task.progress * 100)}  % </span>`;
    };

    gantt.config.fit_tasks = true;
    gantt.i18n.setLocale('ru');


    gantt.config.autofit = true;
    gantt.config.grid_width = 500;

    gantt.config.scales = [
        { unit: 'month', step: 1, format: '%F, %Y' },
        { unit: 'day', step: 1, format: '%j, %D' }
    ];

    gantt.config.date_format = '%Y-%m-%d %H:%i';

    gantt.config.min_column_width = 30;
    gantt.config.row_height = 55;

    const opts = [
        { key: 1, label: 'Высокий' },
        { key: 2, label: 'Средний' },
        { key: 3, label: 'Низкий' }
    ];

    gantt.config.lightbox.sections = [
        { name: 'description', height: 38, map_to: 'text', type: 'textarea', focus: true },
        { name: 'priority', height: 25, map_to: 'priority', type: 'select', options: opts },
        { name: 'period', height: 35, map_to: 'auto', type: 'duration' }
    ];
    gantt.locale.labels.section_period = 'Продолжительность';
    gantt.locale.labels.section_priority = 'Приоритет';
    gantt.config.columns = [
        { name: 'text', label: 'Задача', tree: true, width: '*' },
        { name: 'start_date', label: 'Время начала', align: 'center' },
        {
            name: 'priority', label: 'Приоритет', align: 'center', template: function (obj) {
                if (obj.priority == 1) {
                    return 'Высокий'
                }
                if (obj.priority == 2) {
                    return 'Средний'
                }
                return 'Низкий'
            }
        },
        { name: 'add', label: '' }
    ];



    gantt.templates.task_class = function (start, end, task) {
        switch (task.priority) {
            case '1':
                return 'high';
                break;
            case '2':
                return 'medium';
                break;
            case '3':
                return 'low';
                break;
        }
    };

    const zoomConfig = {
        levels: [
            {
                name: 'day',
                scale_height: 27,
                min_column_width: 80,
                scales: [
                    { unit: 'day', step: 1, format: '%d %M' }
                ]
            },
            {
                name: 'week',
                scale_height: 50,
                min_column_width: 50,
                scales: [
                    {
                        unit: 'week', step: 1, format: function (date) {
                            const dateToStr = gantt.date.date_to_str('%d %M');
                            const endDate = gantt.date.add(date, -6, 'day');
                            const weekNum = gantt.date.date_to_str('%W')(date);
                            return '#' + weekNum + ', ' + dateToStr(date) + ' - ' + dateToStr(endDate);
                        }
                    },
                    { unit: 'day', step: 1, format: '%j %D' }
                ]
            },
            {
                name: 'month',
                scale_height: 50,
                min_column_width: 120,
                scales: [
                    { unit: 'month', format: '%F, %Y' },
                    { unit: 'week', format: 'Week #%W' }
                ]
            },
            {
                name: 'quarter',
                height: 50,
                min_column_width: 90,
                scales: [
                    {
                        unit: 'quarter', step: 1, format: function (date) {
                            const dateToStr = gantt.date.date_to_str('%M');
                            const endDate = gantt.date.add(gantt.date.add(date, 3, 'month'), -1, 'day');
                            return dateToStr(date) + ' - ' + dateToStr(endDate);
                        }
                    },
                    { unit: 'month', step: 1, format: '%M' },
                ]
            },
            {
                name: 'year',
                scale_height: 50,
                min_column_width: 30,
                scales: [
                    { unit: 'year', step: 1, format: '%Y' }
                ]
            }
        ],
        useKey: 'ctrlKey',
        trigger: 'wheel',
        element: function () {
            return gantt.$root.querySelector('.gantt_task');
        }
    };

    gantt.ext.zoom.init(zoomConfig);
    gantt.ext.zoom.setLevel('day');

    if (isNew) {
        gantt.init('gantt_here');
    }
}
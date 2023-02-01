let _original_window_open = window.location.open
window.location.open = function () {
    console.log(_original_window_open)
}

function random_choice(data) {
    if (_.isArray(data)) {
        return data[Math.floor(Math.random() * data.length)]
    } else if (_.isObject(data)) {
        return data[random_choice(Object.keys(data))]
    } else {
        return data
    }
}
function write_url(parameter, name) {
    let host = window.location.pathname
    let url_params = new URLSearchParams(window.location.search)

    if (url_params.get(parameter) !== name) {
        url_params.set(parameter, name)
        window.history.pushState(parameter, parameter, `${host}?${url_params.toString()}`);
    }
}
function read_url(parameter) {
    return new URLSearchParams(window.location.search).get(parameter)
}
function build_gui(layout, props, item_data) {
    let item = null
    item_data = item_data || {}

    switch (layout.type) {
        case 'pane': {
            item = new Tweakpane.Pane()
            item.registerPlugin(TweakpaneEssentialsPlugin);
            item.registerPlugin(TweakpaneInfodumpPlugin)
            item.element.parentElement.classList.add('pane')
            break;
        }
        case 'folder': {
            console.log(item_data)
            item = item_data.item.addFolder({
                title: layout.title,
                expanded: layout.expanded
            })
            break;
        }
        case 'input': {
            item = item_data.item.addInput(layout.bind[0], layout.bind[1], {
                label: layout.label,
                min: layout.min,
                max: layout.max,
                step: layout.step,
                options: _.isString(layout.options) ? props[layout.options] : layout.options,
            })
            break;
        }
        case 'button': {
            item = item_data.item.addButton({
                label: layout.label,
                title: layout.title,
                hidden: layout.hidden,
            })
            break;
        }
        case 'blade': {
            item = item_data.item.addBlade({
                view: layout.view,
                label: layout.label,
                ...layout
            })

            break;
        }
        default: {
            console.log(`[panes] unknown item type: ${layout.type}`, layout)
        }
    }
    if (layout.class_list && item.element) {
        layout.class_list.forEach(class_name => item.element.parentElement.classList.add(layout.class_list))
    }
    if (_.isFunction(layout.on_click)) item.on('click', layout.on_click)
    if (_.isString(layout.on_click)) item.on('click', props[layout.on_click])
    if (_.isFunction(layout.on_change)) item.on('change', layout.on_change)
    if (_.isString(layout.on_change)) item.on('change', props[layout.on_change])

    if (_.isObject(layout.children)) {
        _.forEach(layout.children, (child_layout, ref) => {
            item_data.item = item
            let child_item_data = build_gui(child_layout, props, item_data)
            item_data[ref] = child_item_data.item

        })
    }

    item_data.item = item

    return item_data
}

function loge(topic, ...args) {
    console.log(`%c[preview_3d] %c[!] %c[${topic}]: `, 'color: #4caf50', 'color: #f44336;', 'color: #cddc39', ...args)
}

function logd(topic, ...args) {
    console.log(`%c[preview_3d] %c[i] %c[${topic}]: `, 'color: #4caf50', 'color: #8bc34a;', 'color: #cddc39', ...args)
}

export {
    random_choice,
    write_url,
    read_url,
    build_gui,
    loge
}
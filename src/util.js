
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

let _original_window_open = window.location.open
window.location.open = function () {
    console.log(_original_window_open)
}

function read_url(parameter) {
    return new URLSearchParams(window.location.search).get(parameter)
}

function build_gui(layout, props, parent_data) {

    let item = null
    let item_data = {}

    switch (layout.type) {
        case 'pane': {
            item = new Tweakpane.Pane()
            item.registerPlugin(TweakpaneEssentialsPlugin);
            item.registerPlugin(TweakpaneInfodumpPlugin)
            item.element.parentElement.classList.add('pane')
            if (layout.class_list) {
                layout.class_list.forEach(class_name => item.element.parentElement.classList.add(layout.class_list))
            }
            break;
        }
        case 'folder': {
            item = parent_data.item.addFolder({
                title: layout.title,
                expanded: layout.expanded
            })
            break;
        }
        case 'input': {
            item = parent_data.item.addInput(layout.bind[0], layout.bind[1], {
                label: layout.label,
                min: layout.min,
                max: layout.max,
                step: layout.step,
                options: _.isString(layout.options) ? props[layout.options] : layout.options,
            })

            item.on('change', _.isString(layout.on_change) ? props[layout.on_change] : layout.on_change)
            break;
        }
        default: {
            console.log(`[panes] unknown item type: ${layout.type}`, layout)
        }
    }

    console.log(layout, props, item)

    if (parent_data !== undefined) {
        item_data.refs = parent_data.refs

    } else {
        item_data.refs = {
            root: item
        }
    }

    item_data.item = item

    if (_.isObject(layout.children)) {
        _.forEach(layout.children, (child_layout, ref) => {
            item_data.refs[ref] = build_gui(child_layout, props, item_data).item
        })
    }

    return item_data
}


export {
    random_choice,
    write_url,
    read_url,
    build_gui
}
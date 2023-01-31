
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


export {
    random_choice,
    write_url,
    read_url
}
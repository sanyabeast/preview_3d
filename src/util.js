
function random_choice(data) {
    if (_.isArray(data)) {
        return data[Math.floor(Math.random() * data.length)]
    } else if (_.isObject(data)) {
        return data[random_choice(Object.keys(data))]
    } else {
        return data
    }
}

export {
    random_choice
}
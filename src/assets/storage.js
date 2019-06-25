export const getstorage = (key) => {
    try {
        if (localStorage.getItem(key)) {
          return localStorage.getItem(key)
        }else {
            return null
        }
    } catch (e) {
        // console.warn(e)
    }
}

export const setstorage = (key, value) => {
    try {
        localStorage.setItem(key,value)
    } catch (e) {
        // console.warn(e)
    }
}
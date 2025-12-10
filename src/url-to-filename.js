const transformUrl = (url) => {
let result = url.replace(/^[a-z]+:\/\//, '').replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') +'.html'
return result
}

export default transformUrl
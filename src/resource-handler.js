import axios from 'axios'
import fs from 'fs'
const { promises: fsp } = fs

/* Принимает абсолютный урл картинки и путь куда эту картинку положить */

const downloadResource = (url, filepath) => {
  return axios.get(url, { responseType: 'arraybuffer' })
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Статус ${response.status}`)
      }
      return fsp.writeFile(filepath, response.data)
    })
    .then(() => filepath)
}

export default downloadResource

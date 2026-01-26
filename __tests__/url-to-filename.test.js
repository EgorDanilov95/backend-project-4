import { transformUrl, getResourcesDirname, getResourceFilename } from '../src/url-to-filename.js'

describe('transformUrl', () => {
  test('basic url', () => {
    expect(transformUrl('https://hexlet.ru')).toBe('hexlet-ru.html')
  })
  test('url with dashes and numbers', () => {
    expect(transformUrl('http://-hexlet--124.com')).toBe('hexlet-124-com.html')
  })
})
test('url with params', () => {
  expect(transformUrl('https://site.com/page?id=1&name=test')).toBe('site-com-page-id-1-name-test.html')
})
test('dirname for resources', () => {
  const htmlFileName = transformUrl('https://site.com/page?id=1&name=test')
  expect(getResourcesDirname(htmlFileName)).toBe('site-com-page-id-1-name-test_files')
})
test('imageFileName', () => {
  expect(getResourceFilename('https://hexlet-io.ru/node-js.png')).toBe('hexlet-io-ru-node-js.png')
})

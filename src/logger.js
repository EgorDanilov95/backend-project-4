import debug from 'debug'

export const log = debug('page-loader')
export const logNetwork = debug('page-loader:network')
export const logFile = debug('page-loader:file')
export const logError = debug('page-loader:error')
export const logResource = debug('page-loader:resource')
export const logDebug = debug('page-loader:debug')

log.color = '32' // зелёный
logNetwork.color = '36' // голубой
logFile.color = '33' // жёлтый
logError.color = '31' // красный
logResource.color = '35' // пурпурный
logDebug.color = '90' // серый

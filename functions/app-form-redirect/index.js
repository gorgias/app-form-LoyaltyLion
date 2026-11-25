'use strict'

const functions = require('@google-cloud/functions-framework')
const { createHandler } = require('./lib/handler')

functions.http('redirect', createHandler({ fetch: globalThis.fetch, log: console }))

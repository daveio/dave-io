/**
 * MU/TH/UR 6000 — SECURITY ANALYSIS MODULE
 * Client-only plugin: initializes zxcvbn-ts for password strength estimation.
 */
import { zxcvbnOptions } from '@zxcvbn-ts/core'
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common'
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en'

export default defineNuxtPlugin(() => {
  zxcvbnOptions.setOptions({
    dictionary: {
      ...zxcvbnCommonPackage.dictionary,
      ...zxcvbnEnPackage.dictionary,
    },
    graphs: zxcvbnCommonPackage.adjacencyGraphs,
    useLevenshteinDistance: true,
    translations: zxcvbnEnPackage.translations,
  })
})

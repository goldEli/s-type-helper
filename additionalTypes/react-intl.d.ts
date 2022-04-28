/* eslint-disable */
declare module 'react-intl' {
  export function defineMessages<T>(messageDescriptors: T): {
    [p in keyof T]: T[p]
  }
}

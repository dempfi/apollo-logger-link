import gql from 'graphql-tag'
import { ApolloLink, Operation } from 'apollo-link'

const getGroup = (collapsed: boolean) =>
  collapsed ? console.groupCollapsed.bind(console) : console.group.bind(console)

const parseQuery = (queryString: string) => {
  const queryObj = gql`
    ${queryString}
  `
  const { name } = queryObj.definitions[0] as any
  return [name ? name.value : 'Generic', queryString.trim()]
}

const logObject = (obj: any, name: string, collapsed = false) => {
  getGroup(collapsed)(name)
  console.log(JSON.stringify(obj, null, '  '))
  console.groupEnd()
}
export const loggerLink = (getSchemaName: (operation: Operation) => string) =>
  new ApolloLink((operation, forward) => {
    const schemaName = getSchemaName(operation)
    operation.setContext({ start: Date.now() })

    const { variables } = operation
    const operationType = (operation.query.definitions[0] as any).operation
    const [queryName, query] = parseQuery(operation.query.loc!.source.body)


    if (operationType === 'subscription') {
      const date = new Date().toLocaleTimeString()
      console.groupCollapsed(
        `%cgraphql %c${operationType} %c${schemaName}::%c${queryName} %c@ ${date}`,
        `%c${operationType} %c${schemaName}::%c${queryName} %c@ ${date})`,
        `color: #61A600; font-weight: bold;`,
        'color: gray; font-weight: lighter',
        'color: black; font-weight: bold',
        'color: gray; font-weight: lighter'
      )
      if (variables) {
        Object.keys(variables).forEach(key => {
          console.log(
            `%c${key}: %c${variables[key]}`,
            'color: gray; font-weight: lighter',
            'color: black; font-weight: bold'
          )
        })
      }

      console.groupCollapsed('QUERY')
      console.log(query)
      console.groupEnd()
      console.groupEnd()
      return forward(operation)
    }

    return forward(operation).map(result => {
      const time = Date.now() - operation.getContext().start
      const errors = result.errors ?? result.data?.[queryName]?.errors
      const hasError = Boolean(errors)
      try {
        getGroup(!hasError)(
          `%c${operationType} %c${schemaName}::%c${queryName} %c(in ${time} ms)`,
          `color: ${hasError ? '#F51818' : '#61A600'}; font-weight: bold;`,
          'color: gray; font-weight: lighter',
          'color: black; font-weight: bold',
          'color: gray; font-weight: lighter'
        )

        if (errors) {
          errors.forEach((err: any) => {
            console.log(`%c${err.message}`, 'color: #F51818; font-weight: lighter')
          })
        }

        if (variables && Object.keys(variables).length !== 0) {
          logObject(variables, 'VARIABLES', true)
        }

        console.groupCollapsed('QUERY')
        console.log(query)
        console.groupEnd()

        if (result.data) logObject(result.data, 'RESULT', true)
        if (errors) logObject(errors, 'ERRORS', true)

        console.groupEnd()
      } catch {
        // this may happen if console group is not supported
        console.log(`${operationType} ${schemaName}::${queryName} (in ${time} ms)`)
        if (errors) console.error(errors)
      }

      return result
    })
  })

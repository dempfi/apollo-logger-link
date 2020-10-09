![HERO](./assets/hero.png)

Simple yet powerfull logger link for your apollo client.

### Usage

```ts
import { ApolloLink, ApolloClient, InMemoryCache } from '@apollo/client'
import { loggerLink } from 'apollo-logger-link'

const logger = loggerLink(op => op.getContext().schemaName)

const apolloClient = new ApolloClient({
  link: ApolloLink.from([logger, new HttpLink({ uri: '/graphql' })]),
  cache: new InMemoryCache()
})
```

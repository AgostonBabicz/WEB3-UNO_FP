import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge'
import { gameResolver } from './resolvers/gameResolver.js'
import { gameSchema } from './schema/gameSchema.js'
import { userSchema } from './schema/userSchema.js'
import { userResolver } from './resolvers/userResolver.js'

export const typeDefs = mergeTypeDefs([gameSchema, userSchema])
export const resolvers = mergeResolvers([gameResolver, userResolver])

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
// const { ApolloServer, gql } = require("apollo-server");
const { ApolloServer, gql } = require("apollo-server-express");

admin.initializeApp();
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Item {
    id: ID
    name: String
    amount: Int
    calories: Int
    fat: Int
    carbs: Int
    protein: Int
  }

  input UpdateItem {
    name: String
    amount: Int
    calories: Int
    fat: Int
    carbs: Int
    protein: Int
  }
  input CreateItem {
    name: String
    amount: Int
    calories: Int
    fat: Int
    carbs: Int
    protein: Int
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    items(userId: ID!): [Item]
    readItem(userId: ID!, itemId: ID): Item
  }
  type Mutation {
    createItem(userId: ID!, item: CreateItem!): [Item]!
    updateItem(userId: ID!, id: ID!, item: UpdateItem!): [Item]!
    deleteItem(userId: ID!, id: ID!): [Item]!
  }
`;

const resolvers = {
  Query: {
    items: async (parent: any, args: any, context: any, info: any) => {
      const response = await admin
        .database()
        .ref(args.userId)
        .once("value")
        .then((snap) => snap.val())
        .then((val) => {
          if (val === null) {
            return [];
          }
          return Object.keys(val).map((key) => ({ ...val[key], id: key }));
        });
      const items = await Promise.all(response);

      return items ?? [];
    },
  },
  Mutation: {
    createItem: (parent: any, args: any, context: any, info: any) => {
      admin
        .database()
        .ref(args.userId)
        .push({ ...args?.item });

      return []; // return actual data
    },
    updateItem: async (parent: any, args: any, context: any, info: any) => {
      await admin
        .database()
        .ref(args.userId)
        // .ref(args.?id)
        .update({ [args.id]: { ...args?.item } });

      return []; // return actual data
    },
    deleteItem: async (parent: any, args: any, context: any, info: any) => {
      await admin
        .database()
        // .ref("items")
        .ref(args.userId + "/" + args.id)
        .remove();

      return []; // return actual data
    },
  },
};

const app = express();
const server = new ApolloServer({ typeDefs, resolvers });
server.applyMiddleware({ app, path: "/", cors: true });
exports.graphql = functions.https.onRequest(app);

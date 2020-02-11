/* eslint-disable no-underscore-dangle */
const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

// Parse return JSON objects
app.use(bodyParser.json());

// Graphql middleware for Express
app.use('/graphql', graphqlHttp({
  schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String
        }

        type User {
          _id: ID!
          email: String!
          password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String
        }

        input UserInput {
          email: String!
          password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
  rootValue: {
    events: () => Event.find().then((events) => events.map((event) => ({ ...event._doc, _id: event._doc._id.toString() }))).catch((err) => {
      throw err;
    }),

    createEvent: (args) => {
      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price,
        date: new Date(args.eventInput.date),
        creator: '5e4218c23db0251da011becd',
      });
      let createdEvent;
      return event
        .save()
        .then((res) => {
          createdEvent = { ...res._doc };
          return User.findById('5e4218c23db0251da011becd');
        })
        .then((user) => {
          if (!user) {
            throw new Error('User not found.');
          }
          user.createdEvents.push(event);
          return user.save();
        })
        .then((res) => createdEvent)
        .catch((err) => {
          throw new Error(err);
        }); // hit db and write our data into db
    },

    createUser: (args) => User.findOne({ email: args.userInput.email })
      .then((user) => {
        if (user) {
          throw new Error('User exists already.');
        }
        return bcrypt.hash(args.userInput.password, 12);
      })
      .then((hashedPassword) => {
        const user = new User({
          email: args.userInput.email,
          password: hashedPassword,
        });
        return user.save();
      })
      .then((result) => ({ ...result._doc, password: null, _id: result.id }))
      .catch((err) => {
        throw err;
      }),
  }, // Has all the resolver functions
  graphiql: true,
}));

mongoose
  .connect(`mongodb+srv://${process.env.MONGO_USER}:${
    process.env.MONGO_PASSWORD
  }@cluster0-lddeq.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => {
    throw new Error(err);
  });

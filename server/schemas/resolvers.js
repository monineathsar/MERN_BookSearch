const { User, Book } = require('../models');
const { ApolloError, AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');
const { saveBook } = require('../controllers/user-controller');
const { Agent } = require('https');
const { aggregate } = require('../models/User');

// Create the functions that fulfill the queries defined in `typeDefs.js`
const resolvers = {
  Query: {
    getMe: async (parent, args, context) => {
        if(!context.user) {
            throw new AuthenticationError("You are not logged in!");
        }
        return await User.findOne({ _id: context.user._id}).select('-_v -password');
    }
  },

  Mutation: {
    createUser: async (parent, args) => {
        const user = await User.create(args);

        if (!user) {
            throw new ApolloError("Failed to create new user!");
        }
        const token = signToken(user);
        return {token, user};
    },
    loginUser: async (parent, {email, password}) => {
        const user = await User.findOne({email});
        if (!user) {
            throw new AuthenticationError("This email is not registered yet!");        
        }

        const correctPw = await user.isCorrectPassword(password);
        if (!correctPw) {
            throw new AuthenticationError("Incorrect password!");
        }

        const token = signToken(user);
        return {token, user};
    },
    saveBook: async (parent, args, context) => {
        if(!context.user) {
            throw new AuthenticationError("You are not logged in!");
        }

        const updatedUser =  await User.findOneAndUpdate(
            { _id: context.user._id },
            { $addToSet: { savedBooks: args.input }},
            { new: true, runValidators: true }
        );

        return updatedUser;
    },
    deleteBook: async (parent, args, context) => {
        if(!context.user) {
            throw new AuthenticationError("You are not logged in!");
        }

        const updatedUser =  await User.findOneAndUpdate(
            { _id: context.user._id },
            { $pull: { savedBooks: args.bookId }},
            { new: true, runValidators: true }
        );

        return updatedUser;
    }
  }
};

module.exports = resolvers;

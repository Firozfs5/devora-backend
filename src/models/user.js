const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      maxlength: 20,
    },
    lastName: {
      type: String,
      required: true,
      maxlength: 10,
    },
    emailId: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value))
          throw new Error("there a invalis email entered");
      },
    },
    password: {
      type: String,
      min: 8,
      required: true,
    },
    age: {
      type: Number,
      min: 18,
    },
    profileVisibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "others"],
        message: `{values} this gender is invalid`,
      },
      // validate: {
      //   validator: (v) => ["male", "female", "others"].includes(v),
      //   message: "Gender is invalid ",
      // },
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    photoUrl: {
      type: String,
    },
    about: {
      type: String,
      maxlength: 150,
      // default: "This is about ur profile",
    },
    cloudinaryPublicId: {
      type: String,
    },
    skills: { type: [String] },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ firstName: 1, lastNames: 1 });

userSchema.methods.getJWT = async function () {
  const user = this;
  return await jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
};

userSchema.methods.validatePassword = async function (passwordSentByUser) {
  const user = this;
  return bcrypt.compare(passwordSentByUser, user.password);
};

module.exports = mongoose.model("User", userSchema);

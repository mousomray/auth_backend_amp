
const mongoose = require("mongoose");
const { Schema, model } = mongoose;


const userSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "institution", "student"],
      required: true,
    },
    institution: { type: Schema.Types.ObjectId, ref: "Institution" },
    student: { type: Schema.Types.ObjectId, ref: "Student" }
  },
  { timestamps: true }
);


const institutionSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    website: String,
    registrationNo: {
     type: String,
      default: null,
    },
    establishDate: Date,
    address: String,
    geoLocation: {
      lat: String,
      lng: String,
    },
    institutionImage: { type: String, default: null },
    institutionBanner: String,
    adminUser: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE"
    }
  },
  { timestamps: true }
);


const courseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    duration: { type: String, required: true },

    fee: { type: Number, required: true },

    image: String,
    description: String,

    institution: {
      type: Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  { timestamps: true }
);




const studentSchema = new Schema(
  {
    studentId: {
      type: String,
      trim: true,
    },
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: String,
    dob: Date,
    fatherName: String,

    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },

    admissionDate: {
      type: Date,
      default: Date.now,
    },

    photo: String,
    signature: String,

    institution: {
      type: Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    /* 🔗 Student → Multiple Courses */
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    /* 🔗 Student ↔ User (1–1) */
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },
  },
  { timestamps: true }
);

const User = model("User", userSchema);
const Institution = model("Institution", institutionSchema);
const Course = model("Course", courseSchema);
const Student = model("Student", studentSchema);

module.exports = {
  User,
  Institution,
  Course,
  Student,
};

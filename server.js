const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3000;


app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/studentdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));


const studentSchema = new mongoose.Schema({
  SID: Number,
  FirstName: String,
  LastName: String,
  Email: String,
  NearCity: String,
  Guardian: String,
  Course: String,
  Subjects: [String],
});

const Student = mongoose.model("Student", studentSchema);


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "universityofbedfordshire11@gmail.com",
    pass: "spra eoqp pmzb caen",
  },
});


app.get("/", (req, res) => {
  res.send("Welcome to the Student Record Management System with MongoDB!");
});


app.get("/students", async (req, res) => {
  try {
    const query = {};

    for (const key in req.query) {
      if (req.query[key]) {
        if (key === "SID") {
          const sidValue = parseInt(req.query[key], 10);
          if (!isNaN(sidValue)) {
            query[key] = sidValue;
          }
        } else {
          query[key] = { $regex: req.query[key], $options: "i" };
        }
      }
    }

    const students = await Student.find(query);
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving students", error });
  }
});

app.post("/students", async (req, res) => {
  try {
    const newStudent = new Student(req.body);
    await newStudent.save();

    // Send welcome email
    const mailOptions = {
      from: "universityofbedfordshire11@gmail.com",
      to: newStudent.Email,
      subject: "Welcome to the University!",
      text: `Hello ${newStudent.FirstName},\n\nWelcome to our Student Management System. We are excited to have you on board!\n\nBest Regards,\nUniversity of Bedfordshire`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ message: "Error adding student", error });
  }
});


app.delete("/students/:sid", async (req, res) => {
  try {
    const result = await Student.deleteOne({ SID: req.params.sid });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting student", error });
  }
});


app.put("/students/:sid", async (req, res) => {
  try {
    const updatedStudent = await Student.findOneAndUpdate(
      { SID: req.params.sid },
      req.body,
      { new: true }
    );
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: "Error updating student", error });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

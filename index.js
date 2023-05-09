import express from 'express'
import mongoose from 'mongoose'
import userModel from './schemas/userModel.js'
import cors from 'cors'
import './util/config.js'

const PORT = process.env.PORT || 9999
const DB_CONNECTION = process.env.DB_CONNECTION

const app = express()
app.use(express.json())

app.use(cors(
    {
        origin:true,
        methods:["GET","POST"],
        allowedHeaders:['Content-Type', 'Authorization'],
        credentials:true
    }
))

//register
app.post("/register", async (req,res) => {
    try {
        const {mail,password,userName,firstName,lastName,birthDate,telephoneNumber,gender,profileDescription,profileWebsite,profileImage,jobTitle} = req.body
        const user = await userModel.create({mail,password,userName,firstName,lastName,birthDate,telephoneNumber,gender,profileDescription,profileWebsite,profileImage,jobTitle})
        res.json(user).end()
    } catch (err) {
        res.status(501).json({message:err.message})
    }
})

//new post
app.post("/new-post/:id", async (req, res) => {
    try {
        
      const userId = req.params.id;
      const { profileImage, userName, jobTitle, postImage, likes } = req.body;
      const post = { profileImage, userName, jobTitle, postImage, likes };
      const updatedUser = await userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { posts: post } },
        { new: true }
      );
      
      // Check if user was found and updated
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.status(201).json({ user: updatedUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create new post" });
    }
  });









try {
    mongoose.connect(DB_CONNECTION)
        .then(() => {
            console.log("Connection to DB succesfull 👍")
            try {
                app.listen(PORT, () => console.log("Server running on PORT" + " " + PORT + " 👍"))
            } catch (err) {
                console.log(err.message + " | " + "Server not able to run on" + " " + PORT + "👎")
            }
        })
} catch (err) {
    console.log(err.message + "Not able to connect to DB")}
import express from 'express'
import mongoose from 'mongoose'
import userModel from './userModel.js'
import cors from 'cors'
import './config.js'
import {encryptPassword} from './authMiddleware.js'
import {validateRegisterData} from './validationMiddleware.js'

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
//is email in use
//register
app.post("/api/v1/register", 
    validateRegisterData,
    encryptPassword,
    async (req,res) => {
    try {
        const {mail,password,userName,firstName,lastName,birthDate,telephoneNumber,gender,profileDescription,profileWebsite,profileImage,jobTitle} = req.body
        //checks if mail is already in use
        const uniqueMailCheck = await userModel.findOne({mail})
        if(uniqueMailCheck === null){
            const user = await userModel.create({mail,password,userName,firstName,lastName,birthDate,telephoneNumber,gender,profileDescription,profileWebsite,profileImage,jobTitle})
            res.status(200).json(user._id)
        }else{
            res.status(502).json({message:"email already in use"})
        }
        //checks if mail is already in use
    } catch (err) {
        res.status(501).json({message:err.message})
    }
})

app.post("/api/v1/login" ,
    encryptPassword,
    async (req,res) => {
    try {
        const {mail,password} = req.body
        const user = await userModel.findOne({mail,password})
        if(user === null) res.status(401).json({message:"User not found"})
        else{
            res.status(200).json(user._id)
        }
    } catch (err) {
        
    }
})

//new post
app.post("/api/v1/new-post", async (req, res) => {
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
        return res.status(400).json({ message: "User not found" });
      }
  
      res.status(200).json({ user: updatedUser });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to create new post" });
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
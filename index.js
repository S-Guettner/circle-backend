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

//login
app.post("/api/v1/login" ,
    encryptPassword,
    async (req,res) => {
    try {
        const {mail} = req.body
        const user = await userModel.findOne({mail})
        if(user === null){
            res.status(401).json({message:"User not found"})
        }
        else{
            if(user.password === req.body.password){
                res.status(200).json(user._id)
            }else{
                res.status(400).json({message:"Wrong password"})
            }
        }
    } catch (err) {
        res.status(500).json({message:err.message})
    }
})

//new post
app.post("/api/v1/new-post/:id", async (req, res) => {
    try {

      const userId = req.params.id;
      const { profileImage, userName, jobTitle, postImage, likes } = req.body
      const post = { profileImage, userName, jobTitle, postImage, likes }
      const updatedUser = await userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { posts: post } },
        { new: true }
      )
      
      // Check if user was found and updated
      if (!updatedUser) {
        return res.status(400).json({ message: "User not found" })
      }
  
      res.status(200).json({ user: updatedUser });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to create new post" })
    }
  })


//get posts
app.post("/api/v1/get-feed", async (req,res) => {
    try {
        const { userId } = req.body;
        const users = await userModel
        .find({ _id: { $ne: userId } })
        .populate("posts");
        const posts = users
        .reduce((acc, user) => acc.concat(user.posts), []);
        res.status(200).json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

//create comment
app.post("/api/v1/new-comment", async (req, res) => {
  try {

    const { userId, userName ,profileImage, jobTitle,  commentText ,postId} = req.body;
    const comment = {userId, userName ,profileImage, jobTitle,  commentText ,postId}
    const user = await userModel.findOne({ "posts._id": postId })
    if (!user) {
      return res.status(400).json({ message: "User not found" })
    }
    const post = user.posts.find((p) => p._id.toString() === postId)
    if (!post) {
      return res.status(400).json({ message: "Post not found" })
    }
    const updateComments = await userModel.findOneAndUpdate(
      { "posts._id": postId },
      { $push: { "posts.$.comments": comment } },
      { new: true }
    )
    res.status(200).json({ comment: updateComments })
  } catch (err) {
    res.status(400).json({ message: "Failed to create new comment" })
  }
})

//user profile data
app.post('/api/v1/get-profile' , async (req,res) => {
  try {
    const {userId} = req.body
    const singleUser = await userModel.findOne({_id:userId})
    if(!singleUser){
      res.status(500).json({message:"User not Found"})
    }else{
      res.status(200).json(singleUser)
    }
  } catch (err) {
    res.status(500).json({message:"Failed to get User data"})
    console.log(err)
  }
})

//following status
app.post('/api/v1/following-status', async (req,res) => {
  try {
    const userId = "645e3976d3ae8d816b2367b4"
    const currentUser = await userModel.findById({_id:userId});

    if (!currentUser) {
      throw new Error('User not found');
    }

    const allUsers = await userModel.find({ _id: { $ne: userId } }, 'fullName jobTitle smallAvatar')
    const usersWithFollowingStatus = allUsers.map(user => {
      const isFollowing = currentUser.followingList.some(followingId => followingId.equals(user._id))
      const followingStatus = isFollowing ? 'following' : 'not_following';
      return { ...user.toObject(), followingStatus };
    })
    res.status(200).json(usersWithFollowingStatus)
  } catch (err) {
    res.status(500).json({message:err})
  }
})

//get comments from specific post
app.post('/api/v1/get-post-comments', async (req, res) => {
  try {
    const { postId } = req.body
    const user = await userModel.findOne({ 'posts.postId': postId })

    if (!user) {
      return res.status(404).json({ message: 'Post not found.' })
    }

    // get the specific post
    const post = user.posts.find((p) => p.postId === postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    res.json({ comments: post.comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

//add comment to post
app.post('/api/v1/add-comment', async (req, res) => {
  try {
    const { postId, comment ,commenterProfileImage,commenterUserName,commenterJobTitle,} = req.body
    const user = await userModel.findOne({ 'posts.postId': postId });

    if (!user) {
      return res.status(404).json({ error: 'User or post not found.' });
    }

    // get the specific post
    const post = user.posts.find((p) => p.postId === postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // new comment
    const newComment = {
      profileImage: commenterProfileImage,
      userName: commenterUserName,
      jobTitle: commenterJobTitle,
      commentText: comment
    }

    post.comments.unshift(newComment);

    await user.save();

    res.status(200).json(post.comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
})

//increase likes at a comment by one
app.post('/api/v1/increase-comment-likes', async (req, res) => {
  try {
    const { postId, commentId } = req.body
    const user = await userModel.findOne({ 'posts.postId': postId });

    if (!user) {
      return res.status(404).json({ error: 'User or post not found.' });
    }


    const post = user.posts.find((p) => p.postId === postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comment = post.comments.find((c) => c.commentIdTest === commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Increase the likes on the comment by 1
    comment.likes += 1;

    await user.save();

    res.status(200).json(comment)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

//decrease likes at comment by one
app.post('/api/v1/decrease-comment-likes', async (req, res) => {
  try {
    const { postId, commentId } = req.body
    const user = await userModel.findOne({ 'posts.postId': postId });

    if (!user) {
      return res.status(404).json({ error: 'User or post not found.' });
    }


    const post = user.posts.find((p) => p.postId === postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const comment = post.comments.find((c) => c.commentIdTest === commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Increase the likes on the comment by 1
    comment.likes -= 1;

    await user.save();

    res.status(200).json(comment)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
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
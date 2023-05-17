import express from 'express';
import mongoose from 'mongoose';
import userModel from './userModel.js';
import cors from 'cors';
import './config.js';
import { encryptPassword } from './authMiddleware.js';
import { validateRegisterData } from './validationMiddleware.js';
import { faker } from '@faker-js/faker';

const PORT = process.env.PORT || 9999;
const DB_CONNECTION = process.env.DB_CONNECTION;

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

//register
app.post('/api/v1/register', validateRegisterData, encryptPassword, async (req, res) => {
  try {
    const {
      email,
      password,
      userName,
      firstName,
      lastName,
      birthDate,
      telephoneNumber,
      gender,
      userDescription,
      website,
      avatarMidsize,
      jobTitle,
    } = req.body;
    //checks if mail is already in use
    const uniqueMailCheck = await userModel.findOne({ email });
    if (uniqueMailCheck === null) {
      const user = await userModel.create({
        email,
        password,
        userName,
        firstName,
        lastName,
        birthDate,
        telephoneNumber,
        gender,
        userDescription,
        website,
        avatarMidsize,
        jobTitle,
      });
      res.status(200).json(user);
    } else {
      res.status(502).json({ message: 'email already in use' });
    }
    //checks if mail is already in use
  } catch (err) {
    res.status(501).json({ message: err.message });
  }
});

//register submit
app.post('/api/v1/register-submit', async (req, res) => {
  try {
    const { userId, fullName, firstName, lastName, avatarMidsize, userDescription, jobTitle, phoneNumber, website } = req.body;
    const user = await userModel.findOne({ _id: userId }); // Find the user with the specified userId
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    // Update the user with the new data
    user.fullName = fullName;
    user.firstName = firstName;
    user.lastName = lastName;
    user.avatarMidsize = avatarMidsize;
    user.userDescription = userDescription;
    user.jobTitle = jobTitle;
    user.phoneNumber = phoneNumber;
    user.website = website;

    await user.save(); // Save the updated user

    res.status(200).json({ message: 'User data added successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

//login
app.post('/api/v1/login', encryptPassword, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (user === null) {
      res.status(401).json({ message: 'User not found' });
    } else {
      if (user.password === req.body.password) {
        res.status(200).json(user._id);
      } else {
        res.status(400).json({ message: 'Wrong password' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//new post
app.post('/api/v1/new-post', async (req, res) => {
  try {
    const { userId, profileImage, userName, jobTitle, postImage, likes } = req.body;
    const post = { profileImage, userName, jobTitle, postImage, likes };
    const updatedUser = await userModel.findOneAndUpdate({ _id: userId }, { $push: { posts: post } }, { new: true });

    // Check if user was found and updated
    if (!updatedUser) {
      return res.status(400).json({ message: 'User not found' });
    }

    res.status(200).json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Failed to create new post' });
  }
});

//get posts
app.post('/api/v1/get-feed', async (req, res) => {
  try {
    const { userId } = req.body;
    const users = await userModel.find({}).populate('posts');
    let posts = users.reduce((acc, user) => acc.concat(user.posts), []);

    // Sort posts by timestamp in descending order
    const sortedPosts = await posts.sort((a, b) => {
      const timestampA = new Date(a.timestamp);
      const timestampB = new Date(b.timestamp);
      return timestampB - timestampA;
    });

    res.status(200).json(sortedPosts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//user profile data
app.post('/api/v1/get-profile', async (req, res) => {
  try {
    const { userId } = req.body;
    const singleUser = await userModel.findOne({ _id: userId });
    if (!singleUser) {
      res.status(400).json({ message: 'User not Found' });
    } else {
      res.status(200).json(singleUser);
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to get User data' });
    console.log(err);
  }
});

app.post('/api/v1/get-member-profile', async (req, res) => {
  try {
    const { fullName } = req.body;
    const singleUser = await userModel.findOne({ fullName: fullName });
    if (!singleUser) {
      res.status(400).json({ message: 'Member not Found' });
    } else {
      res.status(200).json(singleUser);
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to get User data' });
    console.log(err);
  }
});

//following status
app.post('/api/v1/following-status', async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUser = await userModel.findById({ _id: userId });

    if (!currentUser) {
      throw new Error('User not found');
    }
    const allUsers = await userModel.find({ _id: { $ne: userId } }, 'fullName jobTitle smallAvatar');
    const usersWithFollowingStatus = allUsers.map((user) => {
      const isFollowing = currentUser.followingList.some((followingId) => followingId.equals(user._id));
      const followingStatus = isFollowing ? 'following' : 'not_following';
      return { ...user.toObject(), followingStatus };
    });
    res.status(200).json(usersWithFollowingStatus);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

//search for user
app.post('/api/v1/search-user', async (req, res) => {
  const { fullName, userId } = req.body;

  try {
    const users = await userModel.find({ fullName: { $regex: fullName, $options: 'i' } }, 'fullName jobTitle avatarSmall followingList');

    const searchedUsers = users.map((user) => {
      const isFollowing = user.followingList.some((follower) => follower.userId === userId);
      return {
        ...user.toObject(),
        isFollowing,
      };
    });

    res.status(200).json(searchedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//add user to followingList
app.post('/api/v1/add-following', async (req, res) => {
  const { userId, fullNameToAdd, _id } = req.body;

  try {
    // Find the user to follow
    const userToAdd = await userModel.findOne({ fullName: fullNameToAdd });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User to follow not found' });
    }

    // Find the user who is adding the following
    const user = await userModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user to add is already in the followingList
    const isAlreadyFollowing = user.followingList.some((follower) => follower.fullName === fullNameToAdd);

    // If the user is already in the followingList, return a message
    if (isAlreadyFollowing) {
      return res.status(400).json({ message: 'User is already being followed' });
    }

    // Initialize followingList and followersList properties if not defined
    if (!Array.isArray(user.followingList)) {
      user.followingList = [];
    }
    if (!Array.isArray(userToAdd.followersList)) {
      userToAdd.followersList = [];
    }

    // Add the user to the followingList array
    const followingUser = {
      fullName: fullNameToAdd,
      _id: _id,
      // For example: email, username, etc.
    };
    user.followingList.push(followingUser);

    const followerUser = {
      fullName: user.fullName,
      // Include other user data here
      // For example: email, username, etc.
    };
    userToAdd.followersList.push(followerUser);

    // Save the updated user and userToAdd objects
    await Promise.all([user.save(), userToAdd.save()]);

    res.status(200).json({ message: 'User added to following list and followers list', followingUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/v1/remove-following', async (req, res) => {
  const { userId, fullNameToRemove } = req.body;

  try {
    // Find the user to remove from followingList
    const userToRemove = await userModel.findOne({ fullName: fullNameToRemove });
    if (!userToRemove) {
      return res.status(404).json({ message: 'User to remove not found' });
    }

    // Find the user who is removing the following
    const user = await userModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user to remove is found in the followingList
    const indexToRemove = user.followingList.findIndex((follower) => follower.fullName === fullNameToRemove);
    if (indexToRemove === -1) {
      return res.status(404).json({ message: 'User not found in following list' });
    }

    // Remove the user from the followingList array
    user.followingList.splice(indexToRemove, 1);

    // Find the index of the user in the followersList array of the user to remove
    const indexToRemoveFromFollowers = userToRemove.followersList.findIndex((follower) => follower.fullName === user.fullName);
    if (indexToRemoveFromFollowers !== -1) {
      // Remove the user from the followersList array of the user to remove
      userToRemove.followersList.splice(indexToRemoveFromFollowers, 1);
    }

    // Save the updated user and userToRemove objects
    await Promise.all([user.save(), userToRemove.save()]);

    res.status(200).json({ message: 'User removed from following list and followers list' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//add user to following list
app.post('/api/v1/follow-user', async (req, res) => {
  try {
    const { userId, IdOfUserToFollow } = req.body;

    // Find the user with userId
    const user = await userModel.findById(userId);

    // Find the user to be followed by IdOfUserToFollow
    const userToAdd = await userModel.findById(IdOfUserToFollow);

    // Check if the user to follow and the user to add exist
    if (!user || !userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the followingList array to add the user if not already present
    await userModel.findByIdAndUpdate(userId, { $addToSet: { followingList: userToAdd._id } });

    // Update the followerList array of the user to follow to add the user if not already present
    await userModel.findByIdAndUpdate(IdOfUserToFollow, { $addToSet: { followerList: userId } });

    return res.status(200).json({ message: 'User followed successfully' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/v1/get-post-comments', async (req, res) => {
  try {
    const { postId } = req.body;
    const user = await userModel.findOne({ 'posts.postId': postId });

    if (!user) {
      return res.status(404).json({ message: 'Post not found.' });
    }

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

app.post('/api/v1/new-comment', async (req, res) => {
  try {
    const { userId, postId, commentText } = req.body;

    const user = await userModel.findOne({ _id: userId });

    // Create comment object
    const commentObject = {
      comment: commentText,
      commentCreator: user.fullName,
      commentCreatorJob: user.jobTitle,
      commentCreatorAvatar: user.avatarMidsize,
      likes: 0,
      commentId: faker.database.mongodbObjectId(),
      timestamp: faker.date.between({ from: '2018-01-01T00:00:00.000Z', to: '2023-01-01T00:00:00.000Z' }),
    };

    // Update the post document
    const result = await userModel.findOneAndUpdate(
      { 'posts.postId': postId },
      { $push: { 'posts.$.comments': commentObject } } // Use commentObject instead of comment
    );

    const foundPost = await result.posts.find((post) => post.postId === postId);

    res.status(200).json(foundPost);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create new comment' });
  }
});

//increase likes at a comment by one
app.post('/api/v1/increase-comment-likes', async (req, res) => {
  try {
    const { postId, commentId } = req.body;
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

    res.status(200).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

//decrease likes at comment by one
app.post('/api/v1/decrease-comment-likes', async (req, res) => {
  try {
    const { postId, commentId } = req.body;
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

    res.status(200).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

try {
  mongoose.connect(DB_CONNECTION).then(() => {
    console.log('Connection to DB succesfull 👍');
    try {
      app.listen(PORT, () => console.log('Server running on PORT' + ' ' + PORT + ' 👍'));
    } catch (err) {
      console.log(err.message + ' | ' + 'Server not able to run on' + ' ' + PORT + '👎');
    }
  });
} catch (err) {
  console.log(err.message + 'Not able to connect to DB');
}

import mongoose from 'mongoose'

const commentUnderComment = mongoose.Schema({
    profileImage: String,
    fullName: String,
    jobTitle: String,
    commentText: String
})

const commentSchema = mongoose.Schema({
    commentCreatorAvatar: String,
    commentCreator: String,
    commentCreatorJob: String,
    commentId: String,
    comment: String,
    likes: Number,
    commentId: String,
    comments: [commentUnderComment]
})

const postSchema = mongoose.Schema({
    postId: String,
    creatorAvatarSmall: String,
    postCreator: String,
    postCreatorJob: String,
    postDescription: String,
    postImage: String,
    likes: Number,
    userId: String,


    comments: [commentSchema],
});

const follower = mongoose.Schema({
    fullName: String,
    jobTitle: String,
    avatarSmall: String,
    _id: String
})

const userSchema = mongoose.Schema({
    email: String,
    password: String,
    fullName: String,
    firstName: String,
    lastName: String,
    birthDate: String,
    phoneNumber: String,
    gender: String,
    profileDescription: String,
    profileWebsite: String,
    profileImage: String,
    jobTitle: String,
    posts: [postSchema],
    followerList: [follower],
    followingList: [follower],
});

// Add the pre middleware to set the fullName field
follower.pre('save', function (next) {
    this.fullName = `${this.firstName} ${this.lastName}`;
    next();
});



const userData = mongoose.model('user', userSchema)

export default userData
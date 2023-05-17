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
    profileImage: String,
    fullName: String,
    jobTitle: String,
    postDescription: String,
    postImage: String,
    likes: Number,
    userId: String,
    timestamp:{
        type: Date,
        immutable: true,
        default: Date.now,
    },
    comments: [commentSchema]
}
)

const follower = mongoose.Schema({
    fullName: String,
    jobTitle: String,
    avatarSmall: String,
    _id: String
})

const userSchema = mongoose.Schema({
    mail: String,
    password: String,
    fullName: String,
    userName: String,
    firstName: String,
    lastName: String,
    birthDate: String,
    telephoneNumber: String,
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
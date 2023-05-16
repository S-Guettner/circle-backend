import mongoose from 'mongoose'

const commentUnderComment = mongoose.Schema({
    profileImage: String,
    fullName: String,
    jobTitle: String,
    commentText: String
})

const commentSchema = mongoose.Schema({
    profileImage: String,
    fullName: String,
    jobTitle: String,
    userId: String,
    commentText: String,
    likes: Number,
    commentIdTest: String,
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
    comments: [commentSchema]
}
)

const follower = mongoose.Schema({
    followerName: String,
    jobTitle: String,
    avatarSmall: String
})

const userSchema = mongoose.Schema({
    mail: String,
    password: String,
    fullName: String,
    firstName: String,
    lastName: String,
    birthDate: String,
    telephoneNumber: String,
    gender: String,
    profileDescription: String,
    profileWebsite: String,
    avatarSmall: String,
    jobTitle: String,
    posts: [postSchema],
    followerList: [follower],
    followingList: [follower]
})

// Add the pre middleware to set the fullName field
userSchema.pre('save', function (next) {
    this.fullName = `${this.firstName} ${this.lastName}`;
    next();
});



const userData = mongoose.model('user', userSchema)

export default userData
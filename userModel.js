import mongoose from 'mongoose'

const commentUnderComment = mongoose.Schema({
    profileImage:String,
    userName:String,
    jobTitle:String,
    commentText:String
})

const commentSchema = mongoose.Schema({
    profileImage:String,
    userName:String,
    jobTitle:String,
    commentText:String,
    likes:Number,
    comments:[commentUnderComment]
})

const postSchema = mongoose.Schema({
    profileImage:String,
    userName:String,
    jobTitle:String,
    postDescription:String,
    postImage:String,
    likes:Number,
    userId:String,
    comments:[commentSchema]
    
},{
    timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    currentTime: () => (Math.floor(Date.now() / 1000)).toString()
}
}
)

const userSchema = mongoose.Schema({
    mail:String,
    password:String,
    userName:String,

    firstName:String,
    lastName:String,
    birthDate:String,
    telephoneNumber:String,
    gender:String,
    profileDescription:String,
    profileWebsite:String,
    profileImage:String,
    jobTitle:String,

    posts:[postSchema],

    /* array of user._id */
    followerList:[String],
    followingList:[String]
})







const userData = mongoose.model('user',userSchema )

export default userData
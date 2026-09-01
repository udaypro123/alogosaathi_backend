import YouTubePost from '../models/youtubepost.models.js';


// Get single fetchPost by ID
const addYoutubeItem = async (data) => {
    try {
        const responsedata = await YouTubePost.create(data);

        if (!responsedata) {
            throw new Error('video failed to add');
        }

        return responsedata;
    } catch (error) {
        throw error;
    }
};

const getYoutubeItem = async () => {
    try {

        const responsedata = await YouTubePost.find();
        if (!responsedata) {
            throw new Error('User not found');
        }

        return responsedata;
    } catch (error) {
        throw error;
    }
};


const deleteYoutubePost = async (data) => {
    try {

        console.log("dbc data check ------------->", data)
        const {id} = data;
        const responsedata = await YouTubePost.deleteOne({_id:id});
        console.log("------------->", responsedata)

        if (!responsedata) {
            throw new Error('User not found');
        }

        return responsedata;
    } catch (error) {
        throw error;
    }
};

// Update fetchPost profile
const updateYoutubeItem = async (updateData) => {
    try {
        const {
            title,
            description,
            link,
            playListName,
            postId
        } = updateData;

        const fetchPost = await YouTubePost.findById(postId);

        if (!fetchPost) {
            throw new Error('User not found');
        }

        // Update fields
        if (title) fetchPost.title = title;
        if (description) fetchPost.description = description;
        if (link) fetchPost.link = link;
        if (playListName) fetchPost.playListName = playListName;


        await fetchPost.save();

        return fetchPost;
    } catch (error) {
        throw error;
    }
};




export {
    addYoutubeItem,
    updateYoutubeItem,
    getYoutubeItem,
    deleteYoutubePost
};

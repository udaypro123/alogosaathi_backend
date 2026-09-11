import News from "../models/news.models.js";

// Get single fetchPost by ID
const AddNews = async (data) => {
    try {
        const responsedata = await News.create(data);

        if (!responsedata) {
            throw new Error('video failed to add');
        }

        return responsedata;
    } catch (error) {
        throw error;
    }
};

const GetNews = async () => {
    try {
        console.log("dbc is calling .............")
        const responsedata = await News.find();
        if (!responsedata) {
            throw new Error('User not found');
        }

        return responsedata;
    } catch (error) {
        throw error;
    }
};


const DeleteNews = async (data) => {
    try {

        console.log("dbc data check ------------->", data)
        const {id} = data;
        const responsedata = await News.deleteOne({_id:id});
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
const UpdateNews = async (updateData) => {
    try {
        const {
            _id,
            fullName,
            phoneNumber,
            link,
            address,
        } = updateData;

        const fetchPost = await News.findById(_id);

        if (!fetchPost) {
            throw new Error('User not found');
        }

        // Update fields
        if (fullName) fetchPost.fullName = fullName;
        if (phoneNumber) fetchPost.phoneNumber = phoneNumber;
        if (link) fetchPost.link = link;
        if (address) fetchPost.address = address;


        await fetchPost.save();

        return fetchPost;
    } catch (error) {
        throw error;
    }
};




export {
    AddNews,
    UpdateNews,
    DeleteNews,
    GetNews,
};

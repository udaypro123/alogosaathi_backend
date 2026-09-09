import OurClinet from "../models/ourClient.models.js";



// Get single fetchPost by ID
const AddClient = async (data) => {
    try {
        const responsedata = await OurClinet.create(data);

        if (!responsedata) {
            throw new Error('video failed to add');
        }

        return responsedata;
    } catch (error) {
        throw error;
    }
};

const GetallClient = async () => {
    try {

        const responsedata = await OurClinet.find();
        if (!responsedata) {
            throw new Error('User not found');
        }

        return responsedata;
    } catch (error) {
        throw error;
    }
};


const DeleteClient = async (data) => {
    try {

        console.log("dbc data check ------------->", data)
        const {id} = data;
        const responsedata = await OurClinet.deleteOne({_id:id});
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
const UpdateClient = async (updateData) => {
    try {
        const {
            _id,
            fullName,
            phoneNumber,
            link,
            address,
        } = updateData;

        const fetchPost = await OurClinet.findById(_id);

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
    AddClient,
    UpdateClient,
    DeleteClient,
    GetallClient,
};

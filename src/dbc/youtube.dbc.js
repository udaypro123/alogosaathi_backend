import User from '../models/User.models.js'


// Get single user by ID
const addYoutubeItem = async (userId) => {
    try {
        const user = await User.findById(userId).select('-password -refreshTokens');

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    } catch (error) {
        throw error;
    }
};

// Update user profile
const updateYoutubeItem = async (userId, updateData) => {
    try {
        const {
            firstName,
            lastName,
            phoneNumber,
            dateOfBirth,
            gender,
            address
        } = updateData;

        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Update fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (gender) user.gender = gender;
        if (address) user.address = { ...user.address, ...address };

        await user.save();

        return getUserResponse(user);
    } catch (error) {
        throw error;
    }
};




export {
    addYoutubeItem,
    updateYoutubeItem,
};

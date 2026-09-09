import mongoose from 'mongoose';

const ourClinetSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            maxlength: [
                150,
                "Full name cannot exceed 150 characters",
            ],
        },

        link: {
            type: String,
            required: true,
            default: "",
            trim: true,
        },

        phoneNumber: {
            type: Number,
            required: true,
        },

        address: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        timestamps: true,

        toJSON: {
            virtuals: true,
        },

        toObject: {
            virtuals: true,
        },
    }
);


// Indexes
ourClinetSchema.index({
    fullName: 1,
});

ourClinetSchema.index({
    phoneNumber: 1,
});


const OurClient = mongoose.model(
    "OurClient",
    ourClinetSchema
);

export default OurClient;

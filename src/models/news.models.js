
import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "News title is required"],
            trim: true,
            maxlength: [300, "Title cannot exceed 300 characters"],
        },

        slug: {
            type: String,
            required: [true, "News slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        shortDescription: {
            type: String,
            required: [true, "Short description is required"],
            trim: true,
            maxlength: [500, "Short description cannot exceed 500 characters"],
        },

        content: {
            type: String,
            required: [true, "News content is required"],
        },

        // Multiple images
        images: {
            type: [
                {
                    url: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    alt: {
                        type: String,
                        default: "",
                        trim: true,
                    },
                    caption: {
                        type: String,
                        default: "",
                        trim: true,
                    },
                },
            ],
            required: [true, "At least one news image is required"],
            validate: {
                validator: function (images) {
                    return images && images.length > 0;
                },
                message: "At least one news image is required",
            },
        },

        // Optional video
        video: {
            url: {
                type: String,
                default: "",
                trim: true,
            },
            thumbnail: {
                type: String,
                default: "",
                trim: true,
            },
        },

        category: {
            type: String,
            required: [true, "News category is required"],
            trim: true,
            lowercase: true,
            index: true,
        },

        subCategory: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
        },

        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],

        author: {
            name: {
                type: String,
                default: "",
                trim: true,
            },
            profileImage: {
                type: String,
                default: "",
                trim: true,
            },
        },

        source: {
            name: {
                type: String,
                default: "",
                trim: true,
            },
            url: {
                type: String,
                default: "",
                trim: true,
            },
        },

        publishedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },

        isPublished: {
            type: Boolean,
            default: true,
            index: true,
        },

        views: {
            type: Number,
            default: 0,
            min: 0,
        },

        // SEO
        seo: {
            metaTitle: {
                type: String,
                default: "",
                trim: true,
                maxlength: [
                    60,
                    "SEO meta title cannot exceed 60 characters",
                ],
            },

            metaDescription: {
                type: String,
                default: "",
                trim: true,
                maxlength: [
                    160,
                    "SEO meta description cannot exceed 160 characters",
                ],
            },

            keywords: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],

            canonicalUrl: {
                type: String,
                default: "",
                trim: true,
            },
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
newsSchema.index({
    title: "text",
    shortDescription: "text",
    content: "text",
});

newsSchema.index({
    category: 1,
    publishedAt: -1,
});

newsSchema.index({
    isPublished: 1,
    publishedAt: -1,
});

newsSchema.index({
    tags: 1,
});

newsSchema.index({
    createdAt: -1,
});

const News = mongoose.model("News", newsSchema);

export default News;

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

// Update news
const UpdateNews = async (updateData) => {
    try {
        const {
            _id,
            title,
            slug,
            shortDescription,
            content,
            images,
            video,
            category,
            subCategory,
            tags,
            author,
            source,
            publishedAt,
            isPublished,
            views,
            seo,
        } = updateData;

        const news = await News.findById(_id);

        if (!news) {
            throw new Error('News not found');
        }

        // Update fields
        if (title) news.title = title;
        if (slug) news.slug = slug;
        if (shortDescription) news.shortDescription = shortDescription;
        if (content) news.content = content;
        if (images) news.images = images;
        if (video) {
            if (video.url) news.video.url = video.url;
            if (video.thumbnail) news.video.thumbnail = video.thumbnail;
        }
        if (category) news.category = category;
        if (subCategory !== undefined) news.subCategory = subCategory;
        if (tags) news.tags = tags;
        if (author) {
            if (author.name) news.author.name = author.name;
            if (author.profileImage) news.author.profileImage = author.profileImage;
        }
        if (source) {
            if (source.name) news.source.name = source.name;
            if (source.url) news.source.url = source.url;
        }
        if (publishedAt) news.publishedAt = publishedAt;
        if (isPublished !== undefined) news.isPublished = isPublished;
        if (views !== undefined) news.views = views;
        if (seo) {
            if (seo.metaTitle) news.seo.metaTitle = seo.metaTitle;
            if (seo.metaDescription) news.seo.metaDescription = seo.metaDescription;
            if (seo.keywords) news.seo.keywords = seo.keywords;
            if (seo.canonicalUrl) news.seo.canonicalUrl = seo.canonicalUrl;
        }

        await news.save();

        return news;
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
